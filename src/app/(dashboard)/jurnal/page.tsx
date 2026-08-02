import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import JurnalClientFilter from "./JurnalClientFilter";
import { sortKelas } from "@/lib/kelas";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Jurnal Mengajar — SIAKAD Al-Imam",
  description: "Daftar jurnal mengajar guru Pesantren Al-Imam Al-Islami",
};

async function getJurnal() {
  const jurnal = await prisma.jurnalMengajar.findMany({
    orderBy: { tanggal: "desc" },
    include: {
      pegawai: { select: { id: true, nama_lengkap: true } },
      mapel: { select: { id: true, nama: true } },
      kelas: { select: { id: true, nama: true, jenjang: true } },
    },
  });
  return jurnal;
}

export default async function JurnalPage() {
  // 1. Fetch Jurnal
  const jurnal = await getJurnal();

  // 2. Fetch Kelas Aktif
  const rawKelas = await prisma.kelas.findMany({
    where: { is_active: true },
    select: { id: true, nama: true, jenjang: true },
  });
  const kelasList = sortKelas(rawKelas);

  // 3. Fetch Data Guru (ASATIDZ / GURU dari SIMPEG)
  let asatidzData = await prisma.pegawai.findMany({
    where: {
      OR: [
        { kategori_pegawai: { in: ["ASATIDZ", "GURU", "Guru", "asatidz", "guru", "PENGAJAR"] } },
        { kategori_pegawai: { contains: "ASATIDZ", mode: "insensitive" } },
        { kategori_pegawai: { contains: "GURU", mode: "insensitive" } },
        { jabatan: { contains: "Guru", mode: "insensitive" } },
        { jabatan: { contains: "Pengajar", mode: "insensitive" } },
        { jabatan: { contains: "Asatidz", mode: "insensitive" } },
        { jabatan: { contains: "Ustadz", mode: "insensitive" } },
        { mata_pelajaran: { not: null } },
      ],
    },
    select: { id: true, nama_lengkap: true },
    orderBy: { nama_lengkap: "asc" },
  });

  // Fallback 1: Jika kategori belum diset spesifik di DB, ambil seluruh pegawai SIMPEG
  if (asatidzData.length === 0) {
    asatidzData = await prisma.pegawai.findMany({
      select: { id: true, nama_lengkap: true },
      orderBy: { nama_lengkap: "asc" },
    });
  }

  // Fallback 2: Jika pegawai kosong, cek user dengan role 'guru'
  if (asatidzData.length === 0) {
    const userGurus = await prisma.user.findMany({
      where: {
        role: { in: ["guru", "GURU", "asatidz", "ASATIDZ"] },
        is_active: true,
      },
      select: { id: true, nama: true },
      orderBy: { nama: "asc" },
    });
    asatidzData = userGurus.map((u) => ({ id: u.id, nama_lengkap: u.nama }));
  }

  // Kumpulkan daftar nama guru unik (dari master pegawai + jurnal yang sudah tercatat)
  const asatidzSet = new Set<string>();
  asatidzData.forEach((a) => {
    if (a.nama_lengkap) asatidzSet.add(a.nama_lengkap.trim());
  });
  jurnal.forEach((j) => {
    if (j.pegawai?.nama_lengkap) asatidzSet.add(j.pegawai.nama_lengkap.trim());
  });
  const asatidzList = Array.from(asatidzSet).sort((a, b) => a.localeCompare(b, "id"));

  // Serialize Jurnal for Client Component
  const jurnalSerialized = jurnal.map((j) => ({
    id: j.id,
    tanggal: j.tanggal.toISOString().split("T")[0],
    asatidz: j.pegawai?.nama_lengkap || "-",
    mapel: j.mapel?.nama || "-",
    kelas: j.kelas?.nama || "-",
    kelas_jenjang: j.kelas?.jenjang || null,
    jam_ke: j.jam_ke ?? "-",
    materi: j.materi,
    kegiatan: j.kegiatan,
    catatan: j.catatan ?? "",
  }));

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1><BookOpen size={16} className="inline mr-1" /> Jurnal Mengajar</h1>
          <p>Rekap kegiatan belajar mengajar di Pesantren Al-Imam Al-Islami</p>
        </div>
        <Link href="/jurnal/tambah" className="btn btn-primary">
          <Plus size={16} />
          Tambah Jurnal
        </Link>
      </div>

      {/* Content */}
      <div style={{ padding: "24px 28px" }}>
        <JurnalClientFilter 
          data={jurnalSerialized} 
          kelasList={kelasList}
          asatidzList={asatidzList}
        />
      </div>
    </div>
  );
}
