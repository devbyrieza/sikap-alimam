import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStandardMapelName } from "@/lib/mapel";
import { getOfficialNis } from "@/lib/officialSantri";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const santri_id = searchParams.get("santri_id");
  const rawSemester = searchParams.get("semester") || "Ganjil";
  const tahun_ajaran = searchParams.get("tahun_ajaran") || "2026/2027";

  if (!santri_id) {
    return NextResponse.json({ error: "santri_id is required" }, { status: 400 });
  }

  try {
    // 1. Get Santri & Kelas
    const santri = await prisma.santriAktif.findUnique({
      where: { id: santri_id },
      include: {
        kelas: {
          include: { wali_kelas: true }
        }
      }
    });

    if (!santri) {
      return NextResponse.json({ error: "Santri not found" }, { status: 404 });
    }

    const kelas_id = santri.kelas_id;
    const klsNama = santri.kelas?.nama?.toUpperCase() || "";
    const isMA = santri.kelas && (
      santri.kelas.jenjang === "MA" || 
      klsNama.includes("MA") || 
      klsNama === "10" || 
      klsNama === "11" || 
      klsNama === "12" ||
      klsNama.startsWith("10") || 
      klsNama.startsWith("11") || 
      klsNama.startsWith("12")
    );

    // 2. Get All Santri in the same Class (for Ranking)
    const temanSekelas = await prisma.santriAktif.findMany({
      where: { kelas_id: kelas_id, is_active: true },
      select: { id: true, nama_lengkap: true }
    });
    const jumlahSantri = temanSekelas.length;

    // Normalisasi filter semester: mendukung "Ganjil" / "1" atau "Genap" / "2"
    const isGanjil = rawSemester === "1" || rawSemester.toLowerCase() === "ganjil";
    const semesterVariants = isGanjil ? ["Ganjil", "1"] : ["Genap", "2"];

    // 3. Get All Grades for the Class
    const allNilaiRaw = await prisma.nilaiSantri.findMany({
      where: {
        santri: { kelas_id: kelas_id },
        semester: { in: semesterVariants },
        tahun_ajaran
      },
      include: { mapel: true }
    });

    // Helper: Hitung Nilai Murni PTS per santri per mapel (100% selaras dengan Rekap Nilai)
    const getStudentScore = (sId: string, targetStandardName: string): number | null => {
      const vals = allNilaiRaw.filter(
        n => n.santri_id === sId && getStandardMapelName(n.mapel.nama, isMA) === targetStandardName
      );
      if (vals.length === 0) return null;

      const getVal = (jenis: string) => {
        const entry = vals.find(v => v.jenis === jenis);
        return entry ? Number(entry.nilai) : 0;
      };

      const hasPeriode = (suffix: string, ujianKey: string) => {
        return vals.some(
          v => v.jenis === `harian${suffix}` || 
               v.jenis === `kompetensi${suffix}` || 
               v.jenis === `sikap${suffix}` || 
               v.jenis === ujianKey
        );
      };

      // MURNI PTS / PAS MODE
      if (hasPeriode("_pas", "pas")) {
        return Math.round(getVal("pas"));
      } else if (hasPeriode("_pts", "pts")) {
        return Math.round(getVal("pts"));
      }

      if (vals.some(v => v.jenis === "ujian")) {
        return Math.round(getVal("ujian"));
      }

      return Math.round(Number(vals[0].nilai));
    };

    // Ambil daftar mapel standar yang ada di kelas ini
    const mapelStandardMap = new Map<string, { standardName: string; rawNama: string; nama_arab?: string | null; kategori: string }>();
    allNilaiRaw.forEach(n => {
      const std = getStandardMapelName(n.mapel.nama, isMA);
      if (!mapelStandardMap.has(std)) {
        mapelStandardMap.set(std, {
          standardName: std,
          rawNama: n.mapel.nama,
          nama_arab: n.mapel.nama_arab,
          kategori: n.mapel.kategori || "syariah"
        });
      }
    });
    const classStandardMapels = Array.from(mapelStandardMap.values());

    // 4. Hitung Total dan Ranking untuk Setiap Santri di Kelas
    const santriTotals = temanSekelas.map(s => {
      let total = 0;
      let count = 0;
      classStandardMapels.forEach(m => {
        const val = getStudentScore(s.id, m.standardName);
        if (val !== null) {
          total += val;
          count++;
        }
      });
      const average = count > 0 ? Math.round(total / count) : 0;
      return { id: s.id, total: Math.round(total), average };
    });

    // Sort descending by total
    const sortedTotals = [...santriTotals].sort((a, b) => b.total - a.total);
    let prevTotal = -1;
    let prevRank = 1;
    const rankMap = new Map<string, number>();

    sortedTotals.forEach((st, index) => {
      if (prevTotal === st.total) {
        rankMap.set(st.id, prevRank);
      } else {
        rankMap.set(st.id, index + 1);
        prevRank = index + 1;
        prevTotal = st.total;
      }
    });

    const currentSantriData = santriTotals.find(s => s.id === santri_id);
    const studentTotalNilai = currentSantriData?.total || 0;
    const rataRataTotal = currentSantriData?.average || 0;
    const studentRank = rankMap.get(santri_id) || 1;

    // 5. Hitung Rata-Rata Kelas per Mapel
    const mapelAverages = new Map<string, number>();
    classStandardMapels.forEach(m => {
      let sum = 0;
      let count = 0;
      temanSekelas.forEach(s => {
        const v = getStudentScore(s.id, m.standardName);
        if (v !== null) {
          sum += v;
          count++;
        }
      });
      mapelAverages.set(m.standardName, count > 0 ? Math.round((sum / count) * 10) / 10 : 0);
    });

    // Auto-translate dictionary fallback
    const translateArab = (nama: string) => {
      const dict: Record<string, string> = {
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
        "Tadribat Alal Anmath": "تدريبات على الأنماط"
      };
      
      const keys = Object.keys(dict).sort((a, b) => b.length - a.length);
      for (const key of keys) {
        if (nama.toLowerCase().includes(key.toLowerCase())) {
          return dict[key];
        }
      }
      return nama;
    };

    // Helper kategori mapel resmi
    const getKategoriMapel = (namaStd: string, rawKat?: string): "syariah" | "bahasa" | "umum" => {
      const low = namaStd.toLowerCase();
      if (["akidah", "hadis", "fikih", "ushul fikih", "sirah", "tahsin", "tahfidz", "adab", "akhlak", "tauhid", "tafsir", "tajwid", "mahfudzot"].some(k => low.includes(k))) return "syariah";
      if (["bahasa arab", "nahwu", "shorof", "kitabah", "muthola", "imla", "khot", "insya", "muhadatsah"].some(k => low.includes(k))) return "bahasa";
      if (["matematika", "ipa", "ips", "bahasa indonesia", "bahasa inggris", "ppkn", "pkn", "tik", "informatika", "entrepreneurship", "sejarah", "geografi", "ekonomi", "sosiologi", "biologi", "fisika", "kimia", "pjok", "prakarya"].some(k => low.includes(k))) return "umum";
      if (rawKat === "syariah" || rawKat === "bahasa" || rawKat === "umum") return rawKat;
      return "syariah";
    };

    // Susun daftar mapel per kategori untuk santri ini (KKM: Diniyah & Bahasa = 85, Umum = 80)
    const formatMapel = (kategoriTarget: string) => {
      return classStandardMapels
        .filter(m => getKategoriMapel(m.standardName, m.kategori) === kategoriTarget)
        .map(m => {
          const val = getStudentScore(santri_id, m.standardName);
          if (val === null) return null;
          const kkmValue = kategoriTarget === "umum" ? 80 : 85;
          return {
            nama: m.standardName,
            nama_arab: m.nama_arab || translateArab(m.standardName),
            kkm: kkmValue,
            nilai: Math.round(val),
            rata_rata_kelas: Math.round(mapelAverages.get(m.standardName) || 0)
          };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => a.nama.localeCompare(b.nama));
    };

    const syariah = formatMapel("syariah");
    const bahasa = formatMapel("bahasa");
    const umum = formatMapel("umum");

    // 6. Get Presensi
    const presensi = await prisma.presensiSiswa.findMany({
      where: { santri_id },
      select: { tanggal: true, status: true }
    });

    const getDateString = (d: Date) => d.toISOString().split("T")[0];
    const datesSakit = new Set<string>();
    const datesIzin = new Set<string>();
    const datesAlpha = new Set<string>();

    presensi.forEach(p => {
      const d = getDateString(p.tanggal);
      if (p.status === "sakit") datesSakit.add(d);
      if (p.status === "izin") datesIzin.add(d);
      if (p.status === "alpha") datesAlpha.add(d);
    });

    const absen = {
      sakit: datesSakit.size,
      izin: datesIzin.size,
      alpha: datesAlpha.size
    };

    const kepribadian = {
      perilaku: "A",
      kedisiplinan: "B",
      kerajinan: "A",
      kebersihan: "A"
    };
    
    const tahfidz = await prisma.capaianTahfidz.findMany({
      where: { santri_id },
      orderBy: { tanggal: "desc" },
      take: 10
    });
    
    const raw_ujian_tahfidz = await prisma.ujianTahfidz.findMany({
      where: { santri_id },
      orderBy: { tanggal: "desc" },
      take: 20
    });

    // Filter unik berdasarkan jenis_ujian + juz + surah
    const seenUjian = new Set();
    const ujian_tahfidz = [];
    for (const u of raw_ujian_tahfidz) {
      const key = `${u.jenis_ujian}_${u.juz || 'nojuz'}_${u.surah_nama || 'nosurah'}`;
      if (!seenUjian.has(key)) {
        seenUjian.add(key);
        ujian_tahfidz.push(u);
      }
      if (ujian_tahfidz.length >= 5) break;
    }

    const defaultWali = isMA
      ? "Muhammad Thoriq Ibn Ziyad, Lc., M.Ag."
      : klsNama.includes("IL")
      ? "Imron Abdillah, S.Pd."
      : "Agus Cahyono";

    const defaultHead = isMA
      ? "Rethna Kartika Septianiar, S.Pd."
      : klsNama.includes("IL")
      ? "Imron Abdillah, S.Pd."
      : "Ade Supyana, S.Pd.I.";

    let waliNama = santri.kelas.wali_kelas?.nama_lengkap || defaultWali;
    if (waliNama && waliNama.toLowerCase().includes("imron")) {
      waliNama = "Imron Abdillah, S.Pd.";
    }

    let headNama = defaultHead;
    if (headNama && headNama.toLowerCase().includes("imron")) {
      headNama = "Imron Abdillah, S.Pd.";
    }

    return NextResponse.json({
      santri: {
        nama: santri.nama_lengkap,
        nis: getOfficialNis(santri.nama_lengkap) || santri.nis,
        kelas: santri.kelas.nama,
        jenjang: santri.kelas.jenjang,
        wali_kelas: waliNama,
        kepala_madrasah: headNama,
        semester: isGanjil ? "Ganjil" : "Genap",
        tahun_ajaran
      },
      nilai_akademik: {
        syariah,
        bahasa,
        umum
      },
      kedisiplinan: {
        totalNilai: Math.round(studentTotalNilai),
        rataRata: Math.round(rataRataTotal),
        ranking: studentRank,
        jumlahSantri
      },
      tahfidz,
      ujian_tahfidz,
      absen,
      kepribadian
    });

  } catch (error: any) {
    console.error("Error generating cetak rapor:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
