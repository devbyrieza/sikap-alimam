import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import JurnalClientFilter from "./JurnalClientFilter";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Jurnal Mengajar — SIAKAD Al-Imam",
  description: "Daftar jurnal mengajar asatidz Pesantren Al-Imam Al-Islami",
};

async function getJurnal() {
  const jurnal = await prisma.jurnalMengajar.findMany({
    orderBy: { tanggal: "desc" },
    include: {
      asatidz: { select: { id: true, nama_lengkap: true } },
      mapel: { select: { id: true, nama: true } },
      kelas: { select: { id: true, nama: true } },
    },
  });
  return jurnal;
}

export default async function JurnalPage() {
  const jurnal = await getJurnal();

  // Serialize for client component
  const jurnalSerialized = jurnal.map((j) => ({
    id: j.id,
    tanggal: j.tanggal.toISOString().split("T")[0],
    asatidz: j.asatidz.nama_lengkap,
    mapel: j.mapel.nama,
    kelas: j.kelas.nama,
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
        <JurnalClientFilter data={jurnalSerialized} />
      </div>
    </div>
  );
}
