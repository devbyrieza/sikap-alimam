export interface WaliDashboardData {
  locked: boolean;
  semester?: string;
  tahunAjaran?: string;
  spp: {
    lunas: boolean;
    status: string;
    tunggakanCount: number;
    nominalTunggakan?: number;
    isUnlockedManual?: boolean;
  };
  biodata: {
    id: string;
    nama: string;
    nis: string;
    nisn: string;
    tempatLahir: string | null;
    tanggalLahir: string | null;
    kelasAktif: string;
    kelasId: string;
    kamarAktif: string;
    musyrifAktif: string;
    waliKelas: { nama: string; noHp: string | null } | null;
    fotoUrl: string | null;
  };
  keaktifanArab?: {
    predikat: "Baik" | "Cukup" | "Kurang" | string;
    catatan: string | null;
    tanggal: string;
    petugas: string | null;
  } | null;
  pelanggaran?: Array<{
    id: string;
    tanggal: string;
    pelanggaran: string;
    sanksi: string;
    kategori: string;
    petugas: string | null;
  }>;
  kbm?: {
    presensiJpl: {
      sakit: number;
      izin: number;
      alpha: number;
    };
    mapelOptions: Array<{ id: string; nama: string }>;
    ujianNilai: Array<{
      mapelId: string;
      mapelNama: string;
      harian: number | null;
      pts: number | null;
      pas: number | null;
      nilaiAkhir: number | null;
    }>;
    ekskul: Array<{
      id: string;
      namaEkskul: string;
      nilai: string;
      nilaiAngka: number | null;
      keterangan: string | null;
    }>;
    sikapKedisiplinan: {
      nilaiSikap: string;
      skorSikap: number | null;
      nilaiKedisiplinan: string;
      skorKedisiplinan: number | null;
      catatanWaliKelas: string | null;
      waliKelasNama: string | null;
    } | null;
    raporButtons: {
      hasNilaiAkhirSemester: boolean;
      ptsEnabled: boolean;
      pasEnabled: boolean;
    };
  };
  pengasuhan?: {
    kebersihan_diri_kamar: string;
    kerapian_diri_barang: string;
    kemandirian: string;
    kepatuhan_kedisiplinan: string;
    ibadah_akhlak: string;
    mentoring_mulahadzoh: string;
    catatan_musyrif: string;
    tanggal: string;
    musyrifNama: string | null;
  } | null;
  halaqoh?: {
    kelompokNama: string | null;
    pengampuNama: string | null;
    targetJuz: number;
    totalDihafalJuz: number;
    totalSetoranZiyadah: number;
    bulan: number;
    tahun: number;
    capaianBulanIni: {
      jumlahSetoran: number;
      totalHalaman: number;
      totalJuz: number;
      hadir: number;
      sakit: number;
      izin: number;
      alfa: number;
    };
    setoranTerbaru: Array<{
      id: string;
      tanggal: string;
      sesi: string;
      jenis: string;
      surahNama: string;
      surahSelesaiNama: string | null;
      ayatDari: number;
      ayatKe: number;
      jumlahHalaman: number;
      kehadiran: string;
      nilaiAkhir: number;
      catatan: string | null;
    }>;
  };
  kesehatan?: {
    tinggiBadan: number | null;
    beratBadan: number | null;
    riwayatSakit: string | null;
    rambut: string | null;
    kuku: string | null;
    telinga: string | null;
    gigi: string | null;
    catatanGizi: string | null;
    tanggal: string;
    petugas: string | null;
    riwayatList: Array<{
      id: string;
      tanggal: string;
      tinggiBadan: number | null;
      beratBadan: number | null;
      riwayatSakit: string | null;
    }>;
  } | null;
}
