import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import JurnalClientFilter from "./JurnalClientFilter";
import { sortKelas } from "@/lib/kelas";

export const dynamic = "force-dynamic";

const formatName = (str: string) => {
  if (!str) return "-";
  return str.split(' ').map(word => {
    if (word.includes('.')) return word; 
    if (word === word.toUpperCase() || word === word.toLowerCase()) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    return word;
  }).join(' ');
};

const normalizeMapelName = (name: string) => {
  let normalized = name.replace(/^\[.*?\]\s*/, ""); // Hapus awalan seperti "[7 MTs] "
  if (normalized === "Tahsin/Tahfidz Al-Quran") {
    normalized = "Tahsin Al-Qur'an";
  }
  return normalized;
};

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

  // 2. Fetch Kelas Aktif (Saat ini hanya 7 MTs dan IL, plus kelas yang ditambahkan Admin Super)
  const rawKelas = await prisma.kelas.findMany({
    where: { is_active: true },
    select: { id: true, nama: true, jenjang: true },
  });

  // Normalisasi & eliminasi duplikasi / placeholder yang belum berjalan
  const seenKelas = new Set<string>();
  const normalizedKelasList: { id: string; nama: string; jenjang: string | null }[] = [];

  for (const k of rawKelas) {
    let name = k.nama.trim();
    // Standarisasi I'dad Lughowy ke IL
    if (name === "I'dad Lughowy" || name === "I'dad" || name === "Idad Lughowy") {
      name = "IL";
    }

    // Filter placeholder kelas yang belum dibuka saat ini (8 MTs, 9 MTs, 10 MA, 11 MA, 12 MA)
    if (["8 MTs", "9 MTs", "10 MA", "11 MA", "12 MA"].includes(name)) {
      continue;
    }

    if (!seenKelas.has(name)) {
      seenKelas.add(name);
      normalizedKelasList.push({ ...k, nama: name });
    }
  }

  // Pastikan kelas 7 MTs dan IL selalu ada dalam daftar master
  if (!seenKelas.has("7 MTs")) {
    normalizedKelasList.push({ id: "kelas-7-mts", nama: "7 MTs", jenjang: "MTs" });
  }
  if (!seenKelas.has("IL")) {
    normalizedKelasList.push({ id: "kelas-il", nama: "IL", jenjang: "Islamiyah" });
  }

  const kelasList = sortKelas(normalizedKelasList);

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
    if (a.nama_lengkap) asatidzSet.add(formatName(a.nama_lengkap.trim()));
  });
  jurnal.forEach((j) => {
    if (j.pegawai?.nama_lengkap) asatidzSet.add(formatName(j.pegawai.nama_lengkap.trim()));
  });
  const asatidzList = Array.from(asatidzSet).sort((a, b) => a.localeCompare(b, "id"));

  // Serialize Jurnal for Client Component (Normalisasi nama kelas I'dad Lughowy -> IL)
  const jurnalSerialized = jurnal.map((j) => {
    let kelasNama = j.kelas?.nama || "-";
    if (kelasNama === "I'dad Lughowy" || kelasNama === "I'dad" || kelasNama === "Idad Lughowy") {
      kelasNama = "IL";
    } else {
      kelasNama = kelasNama.replace(/\s*(MTs|MA|IL)$/i, "");
    }

    return {
      id: j.id,
      tanggal: j.tanggal.toISOString().split("T")[0],
      asatidz: j.pegawai?.nama_lengkap ? formatName(j.pegawai.nama_lengkap.trim()) : "-",
      mapel: j.mapel?.nama ? normalizeMapelName(j.mapel.nama) : "-",
      kelas: kelasNama,
      kelas_jenjang: j.kelas?.jenjang || null,
      jam_ke: j.jam_ke ?? "-",
      materi: j.materi,
      learning_outcome: j.learning_outcome ?? "",
      kegiatan: j.kegiatan,
      catatan: j.catatan ?? "",
    };
  });

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Premium Hero Banner */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #f59e0b 100%)",
        borderRadius: "24px",
        padding: "32px 36px",
        color: "white",
        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)"
      }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <BookOpen size={28} /> Jurnal Mengajar
          </h1>
          <p style={{ marginTop: "8px", opacity: 0.9, fontSize: "16px" }}>Rekap kegiatan belajar mengajar di Pesantren Al-Imam Al-Islami</p>
        </div>
        <Link href="/jurnal/tambah" style={{
          background: "white",
          color: "#0f172a",
          padding: "12px 24px",
          borderRadius: "14px",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          textDecoration: "none",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          transition: "transform 0.2s"
        }}>
          <Plus size={18} />
          Tambah Jurnal
        </Link>
      </div>

      {/* Content */}
      <div style={{ width: "100%" }}>
        {/* We keep JurnalClientFilter but ensure the wrapper is aligned */}
        <JurnalClientFilter 
          data={jurnalSerialized} 
          kelasList={kelasList}
          asatidzList={asatidzList}
        />
      </div>
    </div>
  );
}
