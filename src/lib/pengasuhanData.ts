export interface AspekPengasuhan {
  nama: string;
  nama_arab: string;
  indikator: string;
  deskripsi: string;
  predikat: "Sangat Baik" | "Baik" | "Cukup Baik" | "Kurang Baik";
  predikat_arab: string;
  tindak_lanjut: string;
  skor: number; // Skala 25
}

export interface PelanggaranSantri {
  berat: number;
  sedang: number;
  ringan: number;
  predikat: "Sangat Baik" | "Baik" | "Cukup Baik" | "Kurang Baik";
  predikat_arab: string;
  tindak_lanjut: string;
  skor: number; // Skala 25
}

export interface RaporPengasuhanData {
  santri_id: string;
  gedung: string;
  kamar: string;
  no_kamar: string;
  nama_kamar: string;
  pengasuh_1: string;
  pengasuh_2: string;
  aspek: {
    ibadah_akhlaq: AspekPengasuhan;
    kemandirian: AspekPengasuhan;
    penampilan_kerapihan: AspekPengasuhan;
    kedisiplinan: PelanggaranSantri;
  };
  nasihat_pengasuh: string;
  kutipan_mutiara: string;
  total_skor: number; // 0 - 100
  nilai_huruf: "A" | "B+" | "B" | "C+" | "C";
  predikat_umum: string;
  predikat_umum_arab: string;
  tanggal_penilaian: string;
}

// In-memory runtime cache for saved records
const pengasuhanStore: Record<string, RaporPengasuhanData> = {};

export function hitungNilaiAkhir(skor1: number, skor2: number, skor3: number, skor4: number) {
  const total = Math.min(100, Math.max(0, skor1 + skor2 + skor3 + skor4));
  let nilai_huruf: "A" | "B+" | "B" | "C+" | "C" = "B+";
  let predikat_umum = "Baik";
  let predikat_umum_arab = "جيد جدا";

  if (total >= 90) {
    nilai_huruf = "A";
    predikat_umum = "Sangat Baik";
    predikat_umum_arab = "ممتاز";
  } else if (total >= 80) {
    nilai_huruf = "B+";
    predikat_umum = "Baik";
    predikat_umum_arab = "جيد جدا";
  } else if (total >= 70) {
    nilai_huruf = "B";
    predikat_umum = "Cukup Baik";
    predikat_umum_arab = "جيد";
  } else if (total >= 60) {
    nilai_huruf = "C+";
    predikat_umum = "Kurang Baik";
    predikat_umum_arab = "مقبول";
  } else {
    nilai_huruf = "C";
    predikat_umum = "Sangat Kurang";
    predikat_umum_arab = "ضعيف";
  }

  return { total, nilai_huruf, predikat_umum, predikat_umum_arab };
}

export function getPredikatArab(predikat: string): string {
  switch (predikat) {
    case "Sangat Baik":
      return "ممتاز";
    case "Baik":
      return "جيد جدا";
    case "Cukup Baik":
      return "جيد";
    case "Kurang Baik":
      return "مقبول";
    default:
      return "جيد";
  }
}

// Template narasi deskriptif variatif berdasarkan karakter santri
const NASIHAT_QUOTES = [
  {
    hadits: 'Nabi ﷺ bersabda: "Sesungguhnya Allah tidak melihat kepada rupa kalian, melainkan kepada hati dan amalan kalian." (HR. Muslim)',
    nasihat: 'Jadilah pribadi yang teguh dalam kebaikan, senantiasa menjaga keikhlasan hati dan adab mulia di manapun berada. Teruslah bersemangat dalam menuntut ilmu syar\'i.',
  },
  {
    hadits: 'Nabi ﷺ bersabda: "Aku menjamin rumah di surga yang tertinggi bagi orang yang memperbagus akhlaqnya." (HR. Abu Dawud)',
    nasihat: 'Pertahankan kemandirian dan kesopanan yang sudah ananda bangun selama ini. Jadilah teladan bagi teman-teman sebaya dan berbakti kepada kedua orang tua.',
  },
  {
    hadits: 'Ibnu Qayyim rahimahullah berkata: "Jika engkau ingin mengetahui seberapa cintamu kepada Allah, maka lihatlah seberapa lekat hatimu dengan Al-Qur\'an."',
    nasihat: 'Jagalah hafalan Al-Qur\'an dan sholat berjamaah di masjid di awal waktu. Keberkahan hidup dimulai dari kedisiplinan menjaga hak-hak Allah.',
  },
  {
    hadits: 'Ali bin Abi Thalib radhiyallahu \'anhu berkata: "Kesabaran bagi iman laksana kepala bagi tubuh."',
    nasihat: 'Setiap tantangan di asrama adalah tempaan karakter untuk mencetak pemimpin masa depan. Tetaplah sabar, rendah hati, dan peduli kepada sesama.',
  },
];

export function getPengasuhanBySantri(
  santriId: string,
  santriNama: string,
  jenjang: string = "SMP IT",
  jk: string = "L"
): RaporPengasuhanData {
  if (pengasuhanStore[santriId]) {
    return pengasuhanStore[santriId];
  }

  const isPutri = jk === "P" || santriNama.toLowerCase().includes("fatimah") || santriNama.toLowerCase().includes("aisyah") || santriNama.toLowerCase().includes("safiyyah") || santriNama.toLowerCase().includes("nabila");
  
  // Seed penentuan kamar & asrama
  const hash = (santriId + santriNama).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const roomNum = (hash % 4) + 1;
  const quoteIdx = hash % NASIHAT_QUOTES.length;
  const quote = NASIHAT_QUOTES[quoteIdx];

  const gedung = isPutri
    ? (hash % 2 === 0 ? "Khadijah binti Khuwailid" : "Aisyah binti Abi Bakar")
    : (hash % 3 === 0 ? "Abu Bakar Ash-Shiddiq" : hash % 3 === 1 ? "Umar bin Khattab" : "Utsman bin Affan");

  const kamarBase = isPutri
    ? (hash % 2 === 0 ? "Marwah" : "Shofa")
    : (hash % 3 === 0 ? "Badr" : hash % 3 === 1 ? "Yamamah" : "Qadisiyyah");

  const namaKamar = `${kamarBase} - ${roomNum}`;

  const pengasuh1 = isPutri ? "Ustadzah Maryam Shalihah, Lc." : (hash % 2 === 0 ? "Ust. Bilal Ramadhan, Al-Hafizh" : "Ust. Zaid Al-Kaylani, Al-Hafizh");
  const pengasuh2 = isPutri ? "Ustadzah Fatimah Az-Zahra, S.Pd." : "Ust. Utsman Jauhari, S.Ag.";

  // Hitung variasi skor realistis (84 - 94)
  const skorIbadah = 22 + (hash % 4); // 22, 23, 24, 25
  const skorKemandirian = 21 + ((hash + 1) % 4);
  const skorPenampilan = 21 + ((hash + 2) % 4);
  const skorDisiplin = 24; // Pelanggaran 0

  const pIbadah = skorIbadah >= 24 ? "Sangat Baik" : "Baik";
  const pKemandirian = skorKemandirian >= 24 ? "Sangat Baik" : "Baik";
  const pPenampilan = skorPenampilan >= 24 ? "Sangat Baik" : "Baik";
  const pDisiplin = "Sangat Baik";

  const { total, nilai_huruf, predikat_umum, predikat_umum_arab } = hitungNilaiAkhir(
    skorIbadah,
    skorKemandirian,
    skorPenampilan,
    skorDisiplin
  );

  const namaPanggilan = santriNama.split(" ")[0];

  const record: RaporPengasuhanData = {
    santri_id: santriId,
    gedung,
    kamar: kamarBase,
    no_kamar: String(roomNum),
    nama_kamar: namaKamar,
    pengasuh_1: pengasuh1,
    pengasuh_2: pengasuh2,
    aspek: {
      ibadah_akhlaq: {
        nama: "Ibadah dan Akhlaq",
        nama_arab: "العبادة والأخلاق",
        indikator: "Sholat sunnah, puasa sunnah, tutur kata santun, kejujuran, dan pembiasaan 5S (Senyum, Salam, Sapa)",
        deskripsi: `Alhamdulillah ananda ${namaPanggilan} senantiasa istiqomah dalam menjalankan shalat berjamaah di shaff awal dan rutin mengamalkan shalat sunnah rawatib. Tutur katanya santun, bertingkah laku sopan terhadap asatidz, serta jujur dan mudah dipercaya oleh teman-teman asrama.`,
        predikat: pIbadah,
        predikat_arab: getPredikatArab(pIbadah),
        tindak_lanjut: pIbadah === "Sangat Baik" ? "Pertahankan dan terus tingkatkan keteladanan" : "Pertahankan dan perbanyak amalan nawafil",
        skor: skorIbadah,
      },
      kemandirian: {
        nama: "Kemandirian",
        nama_arab: "الاعتماد على النفس",
        indikator: "Bangun tidur subuh, berangkat shalat & sekolah tepat waktu, piket kamar, disiplin jam istirahat malam, dan motivasi belajar",
        deskripsi: `Ananda ${namaPanggilan} memiliki kemandirian yang sangat baik. Selalu bangun tidur sebelum waktu subuh berkumandang, bertanggung jawab dalam jadwal piket kebersihan kamar, serta mampu mengatur waktu belajar dan istirahat malam pkl 21.30 secara disiplin.`,
        predikat: pKemandirian,
        predikat_arab: getPredikatArab(pKemandirian),
        tindak_lanjut: pKemandirian === "Sangat Baik" ? "Pertahankan kedisiplinan dan jiwa kepemimpinan" : "Pertahankan serta tingkatkan inisiatif pribadi",
        skor: skorKemandirian,
      },
      penampilan_kerapihan: {
        nama: "Penampilan dan Kerapihan",
        nama_arab: "المظهر والنظافة",
        indikator: "Kelengkapan pakaian syar'i, kerapihan ranjang & lemari pribadi, serta kebersihan diri (rambut, kuku, gigi)",
        deskripsi: `Terbiasa berpenampilan rapi, bersih, dan sesuai standar syari'at pesantren. Lemari pakaian dan tempat tidur tertata dengan rapi. Ananda juga peduli menjaga kebersihan kuku, gigi, serta perlengkapan pribadi asrama.`,
        predikat: pPenampilan,
        predikat_arab: getPredikatArab(pPenampilan),
        tindak_lanjut: pPenampilan === "Sangat Baik" ? "Pertahankan kerapihan diri dan lingkungan kamar" : "Pertahankan dan jaga konsistensi kebersihan lemari",
        skor: skorPenampilan,
      },
      kedisiplinan: {
        berat: 0,
        sedang: 0,
        ringan: 0,
        predikat: pDisiplin,
        predikat_arab: getPredikatArab(pDisiplin),
        tindak_lanjut: "Pertahankan catatan bebas pelanggaran (Nol Pelanggaran)",
        skor: skorDisiplin,
      },
    },
    nasihat_pengasuh: `Ananda ${namaPanggilan}, ${quote.nasihat}`,
    kutipan_mutiara: quote.hadits,
    total_skor: total,
    nilai_huruf,
    predikat_umum,
    predikat_umum_arab,
    tanggal_penilaian: new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };

  pengasuhanStore[santriId] = record;
  return record;
}

export function savePengasuhanRecord(data: RaporPengasuhanData): RaporPengasuhanData {
  const { total, nilai_huruf, predikat_umum, predikat_umum_arab } = hitungNilaiAkhir(
    data.aspek.ibadah_akhlaq.skor,
    data.aspek.kemandirian.skor,
    data.aspek.penampilan_kerapihan.skor,
    data.aspek.kedisiplinan.skor
  );

  data.total_skor = total;
  data.nilai_huruf = nilai_huruf;
  data.predikat_umum = predikat_umum;
  data.predikat_umum_arab = predikat_umum_arab;
  data.aspek.ibadah_akhlaq.predikat_arab = getPredikatArab(data.aspek.ibadah_akhlaq.predikat);
  data.aspek.kemandirian.predikat_arab = getPredikatArab(data.aspek.kemandirian.predikat);
  data.aspek.penampilan_kerapihan.predikat_arab = getPredikatArab(data.aspek.penampilan_kerapihan.predikat);
  data.aspek.kedisiplinan.predikat_arab = getPredikatArab(data.aspek.kedisiplinan.predikat);

  pengasuhanStore[data.santri_id] = data;
  return data;
}
