import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const santri_id = searchParams.get("santri_id");
  const semester = searchParams.get("semester") || "1";
  const tahun_ajaran = searchParams.get("tahun_ajaran") || "2025/2026";

  if (!santri_id) {
    return NextResponse.json({ error: "santri_id is required" }, { status: 400 });
  }

  try {
    // 1. Get Santri & Kelas
    const santri = await prisma.santriAktif.findUnique({
      where: { id: santri_id },
      include: { kelas: true }
    });

    if (!santri) {
      return NextResponse.json({ error: "Santri not found" }, { status: 404 });
    }

    const kelas_id = santri.kelas_id;

    // 2. Get All Santri in the same Class (for Ranking)
    const temanSekelas = await prisma.santriAktif.findMany({
      where: { kelas_id: kelas_id, is_active: true },
      select: { id: true, nama_lengkap: true }
    });
    const jumlahSantri = temanSekelas.length;

    // 3. Get All Grades for the Class (PTS Murni)
    const allNilaiRaw = await prisma.nilaiSantri.findMany({
        where: {
          santri: { kelas_id: kelas_id },
          semester,
          tahun_ajaran
        },
        include: { mapel: true }
      });

      // Aggregate / Deduplicate grades per student per mapel
      const deduplicatedNilai = new Map<string, any>();
      allNilaiRaw.forEach(n => {
        const key = `${n.santri_id}_${n.mapel_id}`;
        if (!deduplicatedNilai.has(key)) {
          deduplicatedNilai.set(key, { ...n, sum: n.nilai, count: 1 });
        } else {
          const existing = deduplicatedNilai.get(key);
          existing.sum += n.nilai;
          existing.count += 1;
          existing.nilai = Math.round(existing.sum / existing.count);
        }
      });
      const allNilai = Array.from(deduplicatedNilai.values());

      // 4. Calculate Class Averages per Mapel
    const mapelAverages = new Map<string, { total: number; count: number }>();
    allNilai.forEach(n => {
      if (!mapelAverages.has(n.mapel_id)) {
        mapelAverages.set(n.mapel_id, { total: 0, count: 0 });
      }
      const m = mapelAverages.get(n.mapel_id)!;
      m.total += n.nilai;
      m.count++;
    });

    // 5. Calculate Total Scores for Ranking
    const santriTotals = new Map<string, number>();
    temanSekelas.forEach(t => santriTotals.set(t.id, 0));
    allNilai.forEach(n => {
      if (santriTotals.has(n.santri_id)) {
        santriTotals.set(n.santri_id, santriTotals.get(n.santri_id)! + n.nilai);
      }
    });

    // Sort to find rank
    const sortedTotals = Array.from(santriTotals.entries()).sort((a, b) => b[1] - a[1]);
    let prevTotal = -1;
    let prevRank = 1;
    const rankMap = new Map<string, number>();
    
    sortedTotals.forEach((st, index) => {
      if (prevTotal === st[1]) {
        rankMap.set(st[0], prevRank);
      } else {
        rankMap.set(st[0], index + 1);
        prevRank = index + 1;
        prevTotal = st[1];
      }
    });

    const studentTotalNilai = santriTotals.get(santri_id) || 0;
    const studentRank = rankMap.get(santri_id) || 1;
    
    // Extract mapels for the current student
    const studentNilai = allNilai.filter(n => n.santri_id === santri_id);
    const mapelCount = studentNilai.length;
    const rataRataTotal = mapelCount > 0 ? (studentTotalNilai / mapelCount) : 0;

        // Auto-translate dictionary fallback
    const translateArab = (nama: string) => {
      const dict: Record<string, string> = {
        "Ushul Fiqh": "أصول الفقه",
        "Ushul Fiqih": "أصول الفقه",
        "Akidah": "العقيدة",
        "Tauhid": "التوحيد",
        "Adab": "الأدب",
        "Fiqh": "الفقه",
        "Hadits": "الحديث",
        "Hadis": "الحديث",
        "Siroh": "السيرة",
        "Tahsin": "التحسين",
        "Tahfidz Al-Qur'an": "تحفيظ القرآن",
        "Tahfidz": "التحفيظ",
        "Bahasa Arab": "اللغة العربية",
        "B. Arab": "اللغة العربية",
        "Kitabah": "الكتابة",
        "Nahwu": "النحو",
        "Shorf": "الصرف",
        "Tafsir": "التفسير",
        "Tajwid": "التجويد",
        "Mustholah Hadits": "مصطلح الحديث",
        "Khot": "الخط",
        "Imla": "الإملاء",
        "Muhadatsah": "المحادثة",
        "Mutholaah": "المطالعة",
        "Mahfudzot": "المحفوظات",
        "Matematika": "الرياضيات",
        "MTK": "الرياضيات",
        "IPA": "العلوم",
        "IPS": "العلوم الاجتماعية",
        "Bahasa Indonesia": "اللغة الإندونيسية",
        "B. Indonesia": "اللغة الإندونيسية",
        "Bahasa Inggris": "اللغة الإنجليزية",
        "B. Inggris": "اللغة الإنجليزية",
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
        "Entrepreneurship": "ريادة الأعمال",
        "Tadribat Alal Anmath": "تدريبات على الأنماط"
      };
      
      // Sort keys by descending length so "Ushul Fiqh" matches before "Fiqh", etc.
      const keys = Object.keys(dict).sort((a, b) => b.length - a.length);
      for (const key of keys) {
        if (nama.toLowerCase().includes(key.toLowerCase())) {
          return dict[key];
        }
      }
      return nama;
    };

    // Build the lists per category
    const formatMapel = (kategori: string) => {
      return studentNilai
        .filter(n => (n.mapel.kategori || "umum") === kategori)
        .sort((a, b) => a.mapel.nama.localeCompare(b.mapel.nama))
        .map(n => {
           const classAvgStats = mapelAverages.get(n.mapel_id);
           const classAvg = classAvgStats && classAvgStats.count > 0 ? (classAvgStats.total / classAvgStats.count) : 0;
           return {
             nama: n.mapel.nama.replace(/^\[.*?\]\s*/, ""),
             nama_arab: n.mapel.nama_arab || translateArab(n.mapel.nama),
             kkm: 75, // Default KKM
             nilai: n.nilai,
             rata_rata_kelas: Math.round(classAvg)
           };
        });
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

    // Filter unik berdasarkan jenis_ujian + juz + surah (Ambil yang paling terbaru saja)
    const seenUjian = new Set();
    const ujian_tahfidz = [];
    for (const u of raw_ujian_tahfidz) {
      const key = `${u.jenis_ujian}_${u.juz || 'nojuz'}_${u.surah_nama || 'nosurah'}`;
      if (!seenUjian.has(key)) {
        seenUjian.add(key);
        ujian_tahfidz.push(u);
      }
      if (ujian_tahfidz.length >= 5) break; // maksimal 5 baris di rapor
    }

    return NextResponse.json({
      santri: {
        nama: santri.nama_lengkap,
        nis: santri.nis,
        kelas: santri.kelas.nama,
        semester,
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

  } catch (error) {
    console.error("Error cetak rapor:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
