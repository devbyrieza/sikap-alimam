import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStandardMapelName } from "@/lib/mapel";
import { getOfficialNis } from "@/lib/officialSantri";
import { getSession } from "@/lib/auth";
import { cekStatusSpp } from "@/lib/keuangan";

export const dynamic = "force-dynamic";

/** Peran yang hanya boleh melihat data anak sendiri. Peran lain dianggap staf pesantren. */
const WALI_ROLES = new Set(["wali_santri", "orang_tua", "wali"]);

const isSyariahOrBahasa = (name: string): boolean => {
  const low = name.toLowerCase();
  const umumKeywords = [
    "matematika", "mtk", "ipa", "ips", "indonesia", "inggris", "pjok", "penjas", "seni",
    "pkn", "informatika", "prakarya", "kewirausahaan", "entrepreneurship",
  ];
  return !umumKeywords.some((u) => low.includes(u));
};

/* ─────────── Terjemahan nama mapel ke Arab (cadangan bila nama_arab kosong) ─────────── */

const ARAB_DICT: Record<string, string> = {
  "Ushul Fikih": "أصول الفقه",
  "Ushul Fiqh": "أصول الفقه",
  "Ushul Fiqih": "أصول الفقه",
  "Akidah": "العقيدة",
  "Aqidah": "العقيدة",
  "Tauhid": "التوحيد",
  "Adab": "الأدب",
  "Akhlak": "الأخلاق",
  "Akhlaq": "الأخلاق",
  "Fikih": "الفقه",
  "Fiqih": "الفقه",
  "Fiqh": "الفقه",
  "Hadis": "الحديث",
  "Hadits": "الحديث",
  "Sirah": "السيرة",
  "Siroh": "السيرة",
  "Sirah Nabawiyah": "السيرة النبوية",
  "Tahsin Al-Qur'an": "التحسين",
  "Tahsin": "التحسين",
  "Tahfidz Al-Qur'an": "تحفيظ القرآن",
  "Tahfidz": "التحفيظ",
  "Bahasa Arab": "اللغة العربية",
  "B. Arab": "اللغة العربية",
  "Kitabah": "الكتابة",
  "Nahwu": "النحو",
  "Shorof": "الصرف",
  "Shorf": "الصرف",
  "Sharaf": "الصرف",
  "Tafsir": "التفسير",
  "Tajwid": "التجويد",
  "Mustholah Hadits": "مصطلح الحديث",
  "Khot": "الخط",
  "Imla": "الإملاء",
  "Muhadatsah": "المحادثة",
  "Mutholaah": "المطالعة",
  "Muthola'ah": "المطالعة",
  "Mahfudzot": "المحفوظات",
  "Matematika": "الرياضيات",
  "MTK": "الرياضيات",
  "IPA Terpadu": "العلوم",
  "IPA": "العلوم",
  "IPS Terpadu": "العلوم الاجتماعية",
  "IPS": "العلوم الاجتماعية",
  "Bahasa Indonesia": "اللغة الإندونيسية",
  "B. Indonesia": "اللغة الإندونيسية",
  "Bahasa Inggris": "اللغة الإنجليزية",
  "B. Inggris": "اللغة الإنجليزية",
  "Pendidikan Pancasila dan Kewarganegaraan (PPKn)": "التربية الوطنية",
  "PPKn": "التربية الوطنية",
  "PKn": "التربية الوطنية",
  "PJOK": "التربية البدنية",
  "Prakarya": "الحرف اليدوية",
  "Sejarah": "التاريخ",
  "Geografi": "الجغرافيا",
  "Ekonomi": "الاقتصاد",
  "Sosiologi": "علم الاجتماع",
  "Biologi": "علم الأحياء",
  "Fisika": "الفيزياء",
  "Kimia": "الكيمياء",
  "TIK": "تكنولوجيا المعلومات",
  "Informatika": "المعلوماتية",
  "Entrepreneurship": "ريادة الأعمال",
  "Tadribat 'alal Anmath": "تدريبات على الأنماط",
  "Tadribat Alal Anmath": "تدريبات على الأنماط",
};
// Kunci terpanjang dicocokkan lebih dulu; diurutkan sekali, bukan tiap pemanggilan
const ARAB_KEYS = Object.keys(ARAB_DICT).sort((a, b) => b.length - a.length);

const translateArab = (nama: string) => {
  const low = nama.toLowerCase();
  for (const key of ARAB_KEYS) {
    if (low.includes(key.toLowerCase())) return ARAB_DICT[key];
  }
  return nama;
};

const getKategoriMapel = (namaStd: string, rawKat?: string): "syariah" | "bahasa" | "umum" => {
  const low = namaStd.toLowerCase();
  if (["akidah", "hadis", "fikih", "ushul fikih", "sirah", "tahsin", "tahfidz", "adab", "akhlak", "tauhid", "tafsir", "tajwid", "mahfudzot"].some((k) => low.includes(k))) return "syariah";
  if (["bahasa arab", "nahwu", "shorof", "kitabah", "muthola", "imla", "khot", "insya", "muhadatsah"].some((k) => low.includes(k))) return "bahasa";
  if (["matematika", "ipa", "ips", "bahasa indonesia", "bahasa inggris", "ppkn", "pkn", "tik", "informatika", "entrepreneurship", "sejarah", "geografi", "ekonomi", "sosiologi", "biologi", "fisika", "kimia", "pjok", "prakarya"].some((k) => low.includes(k))) return "umum";
  if (rawKat === "syariah" || rawKat === "bahasa" || rawKat === "umum") return rawKat;
  return "syariah";
};

/** Hitung jumlah jam pelajaran dari kolom jam_ke ("3, 4" -> 2, "1-2" -> 2, "3" -> 1). */
const parseJamPelajaranCount = (jam_ke: string | null | undefined): number => {
  if (!jam_ke) return 1;
  const str = String(jam_ke).trim();
  if (!str) return 1;
  if (str.includes(",")) {
    return str.split(",").map((s) => s.trim()).filter(Boolean).length;
  }
  if (str.includes("-")) {
    const parts = str.split("-").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
    if (parts.length === 2 && parts[1] >= parts[0]) return parts[1] - parts[0] + 1;
  }
  return 1;
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

    // 2. Otorisasi (sama dengan /api/rapor)
    if (waliOnly) {
      if (!santri_id) {
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

    const targetSantriId: string = santri_id;

    // 3. Santri, kelas, halaqoh
    const santri = await prisma.santriAktif.findUnique({
      where: { id: targetSantriId },
      include: {
        kelas: { include: { wali_kelas: true } },
        halaqoh_anggota: {
          where: { is_active: true },
          include: { kelompok: { include: { pegawai: true } } },
        },
      },
    });

    if (!santri) {
      return NextResponse.json({ error: "Santri not found" }, { status: 404 });
    }
    if (!santri.kelas || !santri.kelas_id) {
      return NextResponse.json({ error: "Santri belum ditempatkan di kelas" }, { status: 404 });
    }

    const kelas = santri.kelas;
    const kelas_id = santri.kelas_id;

    // 4. Status administrasi SPP
    const userRole = (session.role || "").toUpperCase();
    const isStaff =
      !waliOnly &&
      (userRole.includes("ADMIN") ||
        userRole.includes("GURU") ||
        userRole.includes("MUDIR") ||
        userRole.includes("KEPALA") ||
        userRole.includes("KADIV") ||
        userRole.includes("MUSYRIF"));

    const sppInfo = await cekStatusSpp(targetSantriId);
    const isAccessLocked = !sppInfo.lunas && sppInfo.status !== "menunggu_verifikasi" && !sppInfo.isUnlockedManual;

    if (isAccessLocked && !isStaff) {
      return NextResponse.json(
        {
          error: "SPP_TERKUNCI",
          message:
            "Akses cetak rapor santri dikunci karena terdapat kewajiban administrasi SPP yang belum diselesaikan.",
          spp: sppInfo,
          santri: {
            id: santri.id,
            nama: santri.nama_lengkap,
            nis: getOfficialNis(santri.nama_lengkap) || santri.nis,
            kelas: kelas.nama || "-",
          },
        },
        { status: 403 },
      );
    }

    const klsNama = kelas.nama?.toUpperCase() || "";
    const isMA =
      kelas.jenjang === "MA" ||
      klsNama.includes("MA") ||
      klsNama === "10" || klsNama === "11" || klsNama === "12" ||
      klsNama.startsWith("10") || klsNama.startsWith("11") || klsNama.startsWith("12");

    // Normalisasi filter semester: mendukung "Ganjil" / "1" atau "Genap" / "2"
    const isGanjil = rawSemester === "1" || rawSemester.toLowerCase() === "ganjil";
    const semesterVariants = isGanjil ? ["Ganjil", "1"] : ["Genap", "2"];

    // 5. Santri sekelas & seluruh nilai kelas (untuk ranking)
    const temanSekelas = await prisma.santriAktif.findMany({
      where: { kelas_id, is_active: true },
      select: { id: true, nama_lengkap: true },
    });
    const jumlahSantri = temanSekelas.length;

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

    /** Nilai murni (tanpa pembulatan), selaras dengan Rekap Nilai dan /api/rapor. */
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

      // Mode murni PTS / PAS
      if (hasPeriode("_pas", "pas")) return getVal("pas");
      if (hasPeriode("_pts", "pts")) return getVal("pts");
      if (vals.some((v) => v.jenis === "ujian")) return getVal("ujian");
      return Number(vals[0].nilai);
    };
    const getStudentScore = (sId: string, std: string): number | null => {
      const raw = getRawStudentScore(sId, std);
      return raw === null ? null : Math.round(raw);
    };

    // Daftar mapel standar di kelas ini
    const mapelStandardMap = new Map<
      string,
      { standardName: string; rawNama: string; nama_arab?: string | null; kategori: string }
    >();
    rows.forEach((r) => {
      if (!mapelStandardMap.has(r.std)) {
        mapelStandardMap.set(r.std, {
          standardName: r.std,
          rawNama: r.mapel.nama,
          nama_arab: r.mapel.nama_arab,
          kategori: r.mapel.kategori || "syariah",
        });
      }
    });
    const classStandardMapels = Array.from(mapelStandardMap.values());

    // 6. Total & ranking setiap santri (tie-breaker 5 tingkat)
    const santriTotals = temanSekelas.map((s) => {
      let total = 0;
      let totalRaw = 0;
      let count = 0;
      let diniyahTotal = 0;

      classStandardMapels.forEach((m) => {
        const rawVal = getRawStudentScore(s.id, m.standardName);
        if (rawVal === null) return;
        total += Math.round(rawVal);
        count++;
        totalRaw += rawVal;
        if (isSyariahOrBahasa(m.standardName)) diniyahTotal += rawVal;
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

    // Urutan: 1) rata-rata murni, 2) total murni, 3) total bulat,
    // 4) total mapel Syari'ah/Bahasa Arab, 5) alfabetis nama (agar tidak ada ranking kembar)
    const sortedTotals = [...santriTotals].sort((a, b) => {
      if (Math.abs(b.averageRaw - a.averageRaw) > 0.0001) return b.averageRaw - a.averageRaw;
      if (Math.abs(b.totalRaw - a.totalRaw) > 0.0001) return b.totalRaw - a.totalRaw;
      if (b.total !== a.total) return b.total - a.total;
      if (Math.abs(b.diniyahTotal - a.diniyahTotal) > 0.0001) return b.diniyahTotal - a.diniyahTotal;
      return a.nama.localeCompare(b.nama);
    });

    const rankMap = new Map<string, number>();
    sortedTotals.forEach((st, index) => rankMap.set(st.id, index + 1));

    const currentSantriData = santriTotals.find((s) => s.id === targetSantriId);
    const studentTotalNilai = currentSantriData?.total || 0;
    const rataRataTotal = currentSantriData?.average || 0;
    const studentRank = rankMap.get(targetSantriId) || 1;

    // 7. Rata-rata kelas per mapel
    const mapelAverages = new Map<string, number>();
    classStandardMapels.forEach((m) => {
      let sum = 0;
      let count = 0;
      temanSekelas.forEach((s) => {
        const v = getStudentScore(s.id, m.standardName);
        if (v !== null) {
          sum += v;
          count++;
        }
      });
      mapelAverages.set(m.standardName, count > 0 ? Math.round((sum / count) * 10) / 10 : 0);
    });

    // Daftar mapel per kategori untuk santri ini (KKM: Diniyah & Bahasa = 85, Umum = 80)
    const formatMapel = (kategoriTarget: "syariah" | "bahasa" | "umum") =>
      classStandardMapels
        .filter((m) => getKategoriMapel(m.standardName, m.kategori) === kategoriTarget)
        .flatMap((m) => {
          const val = getStudentScore(targetSantriId, m.standardName);
          if (val === null) return [];
          return [
            {
              nama: m.standardName,
              nama_arab: m.nama_arab || translateArab(m.standardName),
              kkm: kategoriTarget === "umum" ? 80 : 85,
              nilai: val,
              rata_rata_kelas: Math.round(mapelAverages.get(m.standardName) || 0),
            },
          ];
        })
        .sort((a, b) => a.nama.localeCompare(b.nama));

    const syariah = formatMapel("syariah");
    const bahasa = formatMapel("bahasa");
    const umum = formatMapel("umum");

    // 8A. Ketidakhadiran akademik (KBM kelas, satuan: jam pelajaran)
    // TODO: batasi rentang tanggal sesuai semester/PTS/PAS. Saat ini seluruh catatan santri dihitung.
    let presensiKbm: { tanggal: Date; status: string | null; jam_ke: string | null }[] = [];
    try {
      presensiKbm = await prisma.presensiSiswa.findMany({
        where: { santri_id: targetSantriId },
        select: { tanggal: true, status: true, jam_ke: true },
      });
    } catch (e) {
      console.warn("Gagal fetch presensiSiswa:", e);
    }

    const akad = { sakit: 0, izin: 0, alpha: 0, sakit_kali: 0, izin_kali: 0, alpha_kali: 0 };
    presensiKbm.forEach((p) => {
      const jp = parseJamPelajaranCount(p.jam_ke);
      const st = (p.status || "").toLowerCase().trim();
      if (st === "sakit") { akad.sakit += jp; akad.sakit_kali++; }
      else if (st === "izin") { akad.izin += jp; akad.izin_kali++; }
      else if (st === "alpha" || st === "alfa") { akad.alpha += jp; akad.alpha_kali++; }
    });

    const absen_akademik = {
      sakit: akad.sakit,
      izin: akad.izin,
      alpha: akad.alpha,
      total: akad.sakit + akad.izin + akad.alpha,
      sakit_kali: akad.sakit_kali,
      izin_kali: akad.izin_kali,
      alpha_kali: akad.alpha_kali,
      total_kali: akad.sakit_kali + akad.izin_kali + akad.alpha_kali,
    };

    // 8B. Ketidakhadiran kepengasuhan (halaqoh Al-Qur'an, satuan: sesi)
    let catatanHalaqohList: { tanggal: Date; kehadiran: string | null; sesi: string | null }[] = [];
    try {
      catatanHalaqohList = await prisma.catatanHalaqoh.findMany({
        where: { santri_id: targetSantriId, kehadiran: { not: "hadir" } },
        select: { tanggal: true, kehadiran: true, sesi: true },
      });
    } catch (e) {
      console.warn("Gagal fetch catatanHalaqoh:", e);
    }

    let sakitHalaqohSesi = 0;
    let izinHalaqohSesi = 0;
    let alphaHalaqohSesi = 0;
    catatanHalaqohList.forEach((c) => {
      const kh = (c.kehadiran || "").toLowerCase().trim();
      if (kh === "sakit") sakitHalaqohSesi++;
      else if (kh === "izin") izinHalaqohSesi++;
      else if (kh === "alfa" || kh === "alpha") alphaHalaqohSesi++;
    });

    const absen_halaqoh = {
      sakit: sakitHalaqohSesi,
      izin: izinHalaqohSesi,
      alpha: alphaHalaqohSesi,
      total: sakitHalaqohSesi + izinHalaqohSesi + alphaHalaqohSesi,
    };

    // 9. Kepribadian
    // TODO: sambungkan ke data asli (mis. penilaian adab/ibadah/kedisiplinan santri).
    // Sebelumnya nilai tetap "A/B/A/A" tercetak untuk SEMUA santri; kini "-" sampai ada data sebenarnya.
    const kepribadian = { perilaku: "-", kedisiplinan: "-", kerajinan: "-", kebersihan: "-" };

    // 10. Tahfidz & ujian
    const tahfidz = await prisma.capaianTahfidz.findMany({
      where: { santri_id: targetSantriId },
      orderBy: { tanggal: "desc" },
      take: 10,
    });

    const raw_ujian_tahfidz = await prisma.ujianTahfidz.findMany({
      where: { santri_id: targetSantriId },
      orderBy: { tanggal: "desc" },
      take: 20,
    });

    // Unik berdasarkan jenis_ujian + juz + surah, maksimal 5
    const seenUjian = new Set<string>();
    const ujian_tahfidz: typeof raw_ujian_tahfidz = [];
    for (const u of raw_ujian_tahfidz) {
      const key = `${u.jenis_ujian}_${u.juz || "nojuz"}_${u.surah_nama || "nosurah"}`;
      if (!seenUjian.has(key)) {
        seenUjian.add(key);
        ujian_tahfidz.push(u);
      }
      if (ujian_tahfidz.length >= 5) break;
    }

    // 11. Pejabat penandatangan
    // TODO: pindahkan nama pejabat ke konfigurasi/database agar tidak perlu ubah kode saat berganti.
    const defaultHead = isMA
      ? "Rethna Kartika Septianiar, S.Pd."
      : klsNama.includes("IL")
        ? "Imron Abdillah, S.Pd."
        : "Ade Supyana, S.Pd.I.";
    const kepalaKepengasuhan = "Wahyudi Pranata, Lc.";

    const normalizeImron = (nama: string) =>
      nama.toLowerCase().includes("imron") ? "Imron Abdillah, S.Pd." : nama;

    // Wali kelas dan pengampu halaqoh hanya dari data sebenarnya. Bila belum diatur, "-"
    // (jangan menebak nama pada dokumen resmi). Atur wali kelas di data kelas / kelompok halaqoh.
    const waliNama = normalizeImron(kelas.wali_kelas?.nama_lengkap || "-");
    const headNama = normalizeImron(defaultHead);
    const pengampuHalaqoh = santri.halaqoh_anggota?.[0]?.kelompok?.pegawai?.nama_lengkap || "-";

    return NextResponse.json({
      santri: {
        id: santri.id,
        nama: santri.nama_lengkap,
        nis: getOfficialNis(santri.nama_lengkap) || santri.nis,
        kelas: kelas.nama,
        jenjang: kelas.jenjang,
        wali_kelas: waliNama,
        kepala_madrasah: headNama,
        kepala_kepengasuhan: kepalaKepengasuhan,
        pengampu_halaqoh: pengampuHalaqoh,
        semester: isGanjil ? "Ganjil" : "Genap",
        tahun_ajaran,
      },
      nilai_akademik: { syariah, bahasa, umum },
      kedisiplinan: {
        totalNilai: Math.round(studentTotalNilai),
        rataRata: Math.round(rataRataTotal),
        ranking: studentRank,
        jumlahSantri,
      },
      tahfidz,
      ujian_tahfidz,
      absen: absen_halaqoh, // kompatibilitas versi lama
      absen_akademik,
      absen_halaqoh,
      kepribadian,
    });
  } catch (error) {
    console.error("Error generating cetak rapor:", error);
    // Jangan bocorkan pesan error internal ke klien.
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}