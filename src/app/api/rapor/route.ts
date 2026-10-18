import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cekStatusSpp } from "@/lib/keuangan";
import { getOfficialNis } from "@/lib/officialSantri";
import { getSession } from "@/lib/auth";
import { getStandardMapelName } from "@/lib/mapel";

export const dynamic = "force-dynamic";

/** Peran yang hanya boleh melihat data anak sendiri. Peran lain dianggap staf pesantren. */
const WALI_ROLES = new Set(["wali_santri", "orang_tua", "wali"]);

const stripPrefix = (s: string) => s.replace(/^\[.*?\]\s*/, "");

const isSyariahOrBahasa = (name: string): boolean => {
  const low = name.toLowerCase();
  const umumKeywords = [
    "matematika", "mtk", "ipa", "ips", "indonesia", "inggris", "pjok", "penjas", "seni",
    "pkn", "informatika", "prakarya", "kewirausahaan", "entrepreneurship",
  ];
  return !umumKeywords.some((u) => low.includes(u));
};

const formatName = (str: string) => {
  if (!str) return "-";
  return str
    .split(" ")
    .map((word) => {
      if (word.includes(".")) return word;
      if (word === word.toUpperCase() || word === word.toLowerCase()) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word;
    })
    .join(" ");
};

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  let santri_id = searchParams.get("santri_id");
  const rawSemester = searchParams.get("semester") || "Ganjil";
  const tahun_ajaran = searchParams.get("tahun_ajaran") || "2026/2027";

  try {
    // 1. Wajib login
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles = (session.role || "")
      .toLowerCase()
      .split(",")
      .map((r: string) => r.trim())
      .filter(Boolean);
    const waliOnly = roles.length === 0 || roles.every((r: string) => WALI_ROLES.has(r));

    // 2. Otorisasi
    if (waliOnly) {
      if (!santri_id) {
        // Tanpa santri_id: pakai anak pertama milik wali ini (tidak pernah santri sembarang)
        const orangTua = await prisma.orangTuaSantri.findFirst({
          where: { user_id: session.userId },
          select: { santri_id: true },
        });
        if (!orangTua?.santri_id) {
          return NextResponse.json({ error: "Santri not found" }, { status: 404 });
        }
        santri_id = orangTua.santri_id;
      } else {
        const akses = await prisma.orangTuaSantri.findFirst({
          where: { user_id: session.userId, santri_id },
          select: { santri_id: true },
        });
        if (!akses) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    } else if (!santri_id) {
      // Staf tanpa santri_id: santri aktif pertama (untuk pratinjau)
      const defaultSantri = await prisma.santriAktif.findFirst({
        where: { is_active: true },
        orderBy: { nama_lengkap: "asc" },
        select: { id: true },
      });
      if (!defaultSantri) {
        return NextResponse.json({ error: "No active santri found" }, { status: 404 });
      }
      santri_id = defaultSantri.id;
    }

    // 3. Data santri
    const santri = await prisma.santriAktif.findUnique({
      where: { id: santri_id },
      include: { kelas: true },
    });
    if (!santri) {
      return NextResponse.json({ error: "Santri not found" }, { status: 404 });
    }
    if (!santri.kelas || !santri.kelas_id) {
      return NextResponse.json({ error: "Santri belum ditempatkan di kelas" }, { status: 404 });
    }

    const kelas = santri.kelas;
    const kelas_id = santri.kelas_id;
    const klsNama = kelas.nama?.toUpperCase() || "";
    const isMA =
      kelas.jenjang === "MA" ||
      klsNama.includes("MA") ||
      klsNama === "10" || klsNama === "11" || klsNama === "12" ||
      klsNama.startsWith("10") || klsNama.startsWith("11") || klsNama.startsWith("12");

    // Normalisasi filter semester: mendukung "Ganjil" / "1" atau "Genap" / "2"
    const isGanjil = rawSemester === "1" || rawSemester.toLowerCase() === "ganjil";
    const semesterVariants = isGanjil ? ["Ganjil", "1"] : ["Genap", "2"];

    // 4. Status SPP + penguncian akses (dicek sebelum mengambil data berat)
    const sppInfo = await cekStatusSpp(santri.id);

    const userRole = (session.role || "").toUpperCase();
    const isStaff =
      !waliOnly &&
      (userRole.includes("ADMIN") ||
        userRole.includes("GURU") ||
        userRole.includes("MUDIR") ||
        userRole.includes("KEPALA") ||
        userRole.includes("KADIV") ||
        userRole.includes("MUSYRIF"));

    const isAccessLocked = !sppInfo.lunas && sppInfo.status !== "menunggu_verifikasi" && !sppInfo.isUnlockedManual;

    const santriInfo = {
      id: santri.id,
      nama: santri.nama_lengkap,
      nis: getOfficialNis(santri.nama_lengkap) || santri.nis,
      kelas: kelas.nama,
      jenjang: kelas.jenjang,
      foto_url: santri.foto_url,
      semester: isGanjil ? "Ganjil" : "Genap",
      tahun_ajaran,
    };

    if (isAccessLocked && !isStaff) {
      const jumlahSantri = await prisma.santriAktif.count({ where: { kelas_id, is_active: true } });
      return NextResponse.json({
        santri: santriInfo,
        is_locked: true,
        error: "SPP_TERKUNCI",
        spp: sppInfo,
        ringkasan: {
          persentaseKehadiran: 0, totalHari: 0, totalHadir: 0, totalSakit: 0, totalIzin: 0,
          totalAlpha: 0, persentaseShubuh: 0, ranking: 0, totalNilai: 0, rataRata: 0, jumlahSantri,
        },
        detail: { presensi: [], jurnal: [], akademik: [], mapelList: [], tahfidz: [], ujianTahfidz: [], ibadah: [] },
      });
    }

    // 5. Santri sekelas (untuk peringkat)
    const temanSekelas = await prisma.santriAktif.findMany({
      where: { kelas_id, is_active: true },
      select: { id: true, nama_lengkap: true },
    });
    const jumlahSantri = temanSekelas.length;

    // 6. Seluruh nilai kelas (agar peringkat selaras dengan Cetak Rapor)
    const allNilaiRaw = await prisma.nilaiSantri.findMany({
      where: { santri: { kelas_id }, semester: { in: semesterVariants }, tahun_ajaran },
      include: { mapel: true },
    });

    // Kelompokkan sekali per santri agar tidak memindai seluruh nilai untuk tiap santri/mapel
    const rows = allNilaiRaw.map((n) => ({ ...n, std: getStandardMapelName(n.mapel.nama, isMA) }));
    const rowsBySantri = new Map<string, typeof rows>();
    rows.forEach((r) => {
      const list = rowsBySantri.get(r.santri_id);
      if (list) list.push(r);
      else rowsBySantri.set(r.santri_id, [r]);
    });

    /** Nilai murni (tanpa pembulatan) satu santri untuk satu mapel standar. */
    const getRawStudentScore = (sId: string, std: string): number | null => {
      const vals = (rowsBySantri.get(sId) ?? []).filter((n) => n.std === std);
      if (vals.length === 0) return null;

      const getVal = (jenis: string) => {
        const entry = vals.find((v) => v.jenis === jenis);
        return entry ? Number(entry.nilai) : 0;
      };
      const hasPeriode = (suffix: string, ujianKey: string) =>
        vals.some(
          (v) =>
            v.jenis === `harian${suffix}` ||
            v.jenis === `kompetensi${suffix}` ||
            v.jenis === `sikap${suffix}` ||
            v.jenis === ujianKey,
        );

      if (hasPeriode("_pas", "pas")) return getVal("pas");
      if (hasPeriode("_pts", "pts")) return getVal("pts");
      if (vals.some((v) => v.jenis === "ujian")) return getVal("ujian");
      return Number(vals[0].nilai);
    };

    // Daftar mapel standar yang ada di kelas ini
    const classStandardMapels = Array.from(new Set(rows.map((r) => r.std)));

    // 7. Total & peringkat setiap santri (tie-breaker 5 tingkat)
    const santriTotals = temanSekelas.map((s) => {
      let total = 0;
      let totalRaw = 0;
      let count = 0;
      let diniyahTotal = 0;

      classStandardMapels.forEach((std) => {
        const rawVal = getRawStudentScore(s.id, std);
        if (rawVal === null) return;
        total += Math.round(rawVal);
        count++;
        totalRaw += rawVal;
        if (isSyariahOrBahasa(std)) diniyahTotal += rawVal;
      });

      return {
        id: s.id,
        nama: s.nama_lengkap,
        total: Math.round(total),
        totalRaw,
        average: count > 0 ? Math.round(total / count) : 0,
        averageRaw: count > 0 ? totalRaw / count : 0,
        diniyahTotal,
      };
    });

    const sortedTotals = [...santriTotals].sort((a, b) => {
      if (Math.abs(b.averageRaw - a.averageRaw) > 0.0001) return b.averageRaw - a.averageRaw;
      if (Math.abs(b.totalRaw - a.totalRaw) > 0.0001) return b.totalRaw - a.totalRaw;
      if (b.total !== a.total) return b.total - a.total;
      if (Math.abs(b.diniyahTotal - a.diniyahTotal) > 0.0001) return b.diniyahTotal - a.diniyahTotal;
      return a.nama.localeCompare(b.nama);
    });

    const rankMap = new Map<string, number>();
    sortedTotals.forEach((st, index) => rankMap.set(st.id, index + 1));

    const currentSantriData = santriTotals.find((s) => s.id === santri_id);
    const studentTotalNilai = currentSantriData?.total || 0;
    const rataRataTotal = currentSantriData?.average || 0;
    const studentRank = rankMap.get(santri_id) || 1;

    // 8. Presensi KBM pelajaran resmi
    const presensiRaw = await prisma.presensiSiswa.findMany({
      where: { santri_id, mapel_id: { not: null } },
      include: { mapel: { select: { nama: true } } },
      orderBy: { tanggal: "desc" },
    });
    const presensi = presensiRaw.filter((p) => p.mapel?.nama != null);

    const getDateString = (d: Date) => d.toISOString().split("T")[0];
    const datesHadir = new Set<string>();
    const datesSakit = new Set<string>();
    const datesIzin = new Set<string>();
    const datesAlpha = new Set<string>();
    const datesTotal = new Set<string>();

    presensi.forEach((p) => {
      const d = getDateString(p.tanggal);
      datesTotal.add(d);
      if (p.status === "hadir") datesHadir.add(d);
      if (p.status === "sakit") datesSakit.add(d);
      if (p.status === "izin") datesIzin.add(d);
      if (p.status === "alpha") datesAlpha.add(d);
    });

    const totalHari = datesTotal.size;
    const totalHadir = datesHadir.size;
    const persentaseKehadiran = totalHari > 0 ? Math.round((totalHadir / totalHari) * 100) : 100;

    // 9. Jurnal mengajar di kelas santri
    const jurnalKelas = await prisma.jurnalMengajar.findMany({
      where: { kelas_id },
      orderBy: { tanggal: "desc" },
      include: {
        pegawai: { select: { id: true, nama_lengkap: true } },
        mapel: { select: { id: true, nama: true, kategori: true } },
      },
    });

    const formattedJurnal = jurnalKelas.map((j) => ({
      id: j.id,
      tanggal: j.tanggal.toISOString().split("T")[0],
      asatidz: j.pegawai?.nama_lengkap ? formatName(j.pegawai.nama_lengkap.trim()) : "-",
      mapel: j.mapel?.nama ? stripPrefix(j.mapel.nama) : "-",
      mapel_kategori: j.mapel?.kategori || "umum",
      jam_ke: j.jam_ke || "-",
      materi: j.materi,
      learning_outcome: j.learning_outcome || j.materi,
      kegiatan: j.kegiatan,
      catatan: j.catatan || "",
    }));

    // 10. Tahfidz & ujian
    const tahfidz = await prisma.capaianTahfidz.findMany({
      where: { santri_id },
      orderBy: { tanggal: "desc" },
      take: 15,
    });
    const ujianTahfidz = await prisma.ujianTahfidz.findMany({
      where: { santri_id },
      orderBy: { tanggal: "desc" },
    });

    // 11. Nilai akademik santri ini
    const akademik = await prisma.nilaiSantri.findMany({
      where: { santri_id, semester: { in: semesterVariants }, tahun_ajaran },
      include: { mapel: true },
      orderBy: { created_at: "asc" },
    });

    const mapelMap = new Map<string, { id: string; nama: string; kategori: string }>();
    akademik.forEach((n) => {
      if (n.mapel && !mapelMap.has(n.mapel_id)) {
        mapelMap.set(n.mapel_id, {
          id: n.mapel_id,
          nama: stripPrefix(n.mapel.nama),
          kategori: n.mapel.kategori || "umum",
        });
      }
    });

    // Tambahkan mapel dari master kelas
    const classMapels = await prisma.mataPelajaran.findMany({
      where: { kelas_id, is_active: true },
      select: { id: true, nama: true, kategori: true },
      orderBy: { nama: "asc" },
    });
    classMapels.forEach((m) => {
      if (!mapelMap.has(m.id)) {
        mapelMap.set(m.id, { id: m.id, nama: stripPrefix(m.nama), kategori: m.kategori || "umum" });
      }
    });

    const mapelList = Array.from(mapelMap.values()).sort((a, b) => a.nama.localeCompare(b.nama, "id"));

    // 12. Ibadah & adab
    const ibadah = await prisma.ibadahAdabSantri.findMany({
      where: { santri_id },
      orderBy: { tanggal: "desc" },
      take: 30,
    });
    const shubuhJamaah = ibadah.filter((i) => i.shubuh === "Berjamaah").length;
    const persentaseShubuh = ibadah.length > 0 ? Math.round((shubuhJamaah / ibadah.length) * 100) : 100;

    return NextResponse.json({
      santri: santriInfo,
      is_locked: false,
      spp: sppInfo,
      tahfidz,
      ujian_tahfidz: ujianTahfidz,
      ringkasan: {
        persentaseKehadiran,
        totalHari,
        totalHadir,
        totalSakit: datesSakit.size,
        totalIzin: datesIzin.size,
        totalAlpha: datesAlpha.size,
        persentaseShubuh,
        ranking: studentRank,
        totalNilai: Math.round(studentTotalNilai),
        rataRata: Math.round(rataRataTotal),
        jumlahSantri,
      },
      detail: {
        presensi: presensi.map((p) => ({
          id: p.id,
          tanggal: p.tanggal.toISOString().split("T")[0],
          status: p.status,
          mapel_nama: p.mapel?.nama ? stripPrefix(p.mapel.nama) : null,
          jam_ke: p.jam_ke,
          keterangan: p.keterangan || "",
        })),
        jurnal: formattedJurnal,
        akademik: akademik.map((a) => ({
          id: a.id,
          mapel_id: a.mapel_id,
          mapel_nama: a.mapel?.nama ? stripPrefix(a.mapel.nama) : "Mapel",
          mapel_kategori: a.mapel?.kategori || "umum",
          jenis: a.jenis,
          nilai: a.nilai,
          keterangan: a.keterangan,
        })),
        mapelList,
        tahfidz,
        ujianTahfidz,
        ibadah,
      },
    });
  } catch (error) {
    console.error("Error generating rapor:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}