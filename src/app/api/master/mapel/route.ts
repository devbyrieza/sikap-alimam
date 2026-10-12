import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sortKelas } from "@/lib/kelas";
import { getSession } from "@/lib/auth";
import { getStandardMapelName } from "@/lib/mapel";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const kelas_id = searchParams.get("kelas_id");

    const whereClause: any = { is_active: true };
    if (kelas_id) {
      whereClause.kelas_id = kelas_id;
    }

    const session = await getSession();
    const role = (session?.role || "").toLowerCase();
    const isPrivileged = [
      "admin_super",
      "super_admin",
      "mudir",
      "kepala_sekolah",
      "kadiv_kurikulum",
      "kepala_kurikulum",
      "wali_kelas",
      "admin_rapor"
    ].some((r) => role.includes(r));

    const showAll = searchParams.get("all") === "true";

    if (session?.asatidz_id && !isPrivileged && !showAll) {
      whereClause.asatidz_mapel = {
        some: {
          pegawai_id: session.asatidz_id
        }
      };
    }

    const rawMapel = await prisma.mataPelajaran.findMany({
      where: whereClause,
      include: {
        kelas: true },
      orderBy: {
        nama: "asc" } });

    // Auto-heal and deduplicate mapels across all classes to standard baku terms
    const healedMapel = await Promise.all(
      rawMapel.map(async (m) => {
        const isMA = m.kelas && (
          m.kelas.jenjang === "MA" || 
          m.kelas.nama.toUpperCase().includes("MA") || 
          m.kelas.nama.startsWith("11") || 
          m.kelas.nama.startsWith("12")
        );

        const targetName = getStandardMapelName(m.nama, isMA);

        if (targetName !== m.nama) {
          const exists = rawMapel.find(other => 
            other.kelas_id === m.kelas_id && 
            other.id !== m.id && 
            (other.nama.toLowerCase() === targetName.toLowerCase() || getStandardMapelName(other.nama, isMA).toLowerCase() === targetName.toLowerCase())
          );

          if (!exists) {
            try {
              await prisma.mataPelajaran.update({
                where: { id: m.id },
                data: { nama: targetName }
              });
              m.nama = targetName;
            } catch (e) {
              console.error("Auto-heal rename error:", e);
            }
          } else {
            // MERGE: Pindahkan semua data ke 'exists' dan hapus duplikat 'm'
            try {
              const keepId = exists.id;
              const dropId = m.id;
              await prisma.nilaiSantri.updateMany({ where: { mapel_id: dropId }, data: { mapel_id: keepId } });
              await prisma.jurnalMengajar.updateMany({ where: { mapel_id: dropId }, data: { mapel_id: keepId } });
              await prisma.jadwalPelajaran.updateMany({ where: { mapel_id: dropId }, data: { mapel_id: keepId } });
              await prisma.presensiSiswa.updateMany({ where: { mapel_id: dropId }, data: { mapel_id: keepId } });
              
              // Relink asatidz_mapel
              const asatidzDrop = await prisma.asatidzmMapel.findMany({ where: { mapel_id: dropId } });
              for (const a of asatidzDrop) {
                const alreadyLinked = await prisma.asatidzmMapel.findFirst({
                  where: { pegawai_id: a.pegawai_id, mapel_id: keepId, kelas_id: a.kelas_id }
                });
                if (!alreadyLinked) {
                  await prisma.asatidzmMapel.create({
                    data: { pegawai_id: a.pegawai_id, mapel_id: keepId, kelas_id: a.kelas_id }
                  }).catch(() => {});
                }
              }
              await prisma.asatidzmMapel.deleteMany({ where: { mapel_id: dropId } });
              await prisma.mataPelajaran.delete({ where: { id: dropId } }).catch(() => {});
              (m as any)._isDeleted = true;
            } catch (mergeErr) {
              console.error("Auto-merge mapel duplicate error:", mergeErr);
            }
          }
        }
        return m;
      })
    );

    // Filter out deleted and redundant duplicates
    const cleanedMapel = healedMapel.filter((m: any, idx, arr) => {
      if (m._isDeleted) return false;
      const isMA = m.kelas && (
        m.kelas.jenjang === "MA" || 
        m.kelas.nama.toUpperCase().includes("MA") || 
        m.kelas.nama.startsWith("11") || 
        m.kelas.nama.startsWith("12")
      );
      if (isMA && (m.nama.toLowerCase() === "fiqh" || m.nama.toLowerCase() === "fiqih")) {
        return false;
      }
      return arr.findIndex((other: any) => !other._isDeleted && other.kelas_id === m.kelas_id && getStandardMapelName(other.nama, isMA).toLowerCase() === getStandardMapelName(m.nama, isMA).toLowerCase()) === idx;
    });

    // Urutkan mapel berdasarkan urutan logis kelasnya
    const sortedMapel = [...cleanedMapel].sort((a, b) => {
      if (!a.kelas || !b.kelas) return 0;
      if (a.kelas.id === b.kelas.id) {
        return a.nama.localeCompare(b.nama, "id");
      }
      const sortedClasses = sortKelas([a.kelas, b.kelas]);
      return sortedClasses[0].id === a.kelas.id ? -1 : 1;
    });

    return NextResponse.json({ mapel: sortedMapel, success: true });
  } catch (error: any) {
    console.error("Error fetching mapel:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data mata pelajaran", details: error.message },
      { status: 500 }
    );
  }
}

// Tambah Mapel Baru oleh Admin Super
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nama, nama_arab, kategori, kelas_id } = body;

    if (!nama || !nama.trim()) {
      return NextResponse.json({ error: "Nama mata pelajaran wajib diisi" }, { status: 400 });
    }

    if (!kelas_id) {
      return NextResponse.json({ error: "Tingkat kelas pengampu wajib dipilih" }, { status: 400 });
    }

    // Pastikan kelas exists
    const kelas = await prisma.kelas.findUnique({
      where: { id: kelas_id } });

    if (!kelas) {
      return NextResponse.json({ error: "Kelas yang dipilih tidak valid" }, { status: 400 });
    }

    const newMapel = await prisma.mataPelajaran.create({
      data: {
        nama: nama.trim(),
        nama_arab: nama_arab?.trim() || null,
        kategori: kategori || "umum",
        kelas_id,
        is_active: true },
      include: {
        kelas: true } });

    return NextResponse.json({ success: true, mapel: newMapel }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating mapel:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Mata pelajaran ini sudah terdaftar di kelas tersebut." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Gagal menambahkan mata pelajaran", details: error.message },
      { status: 500 }
    );
  }
}
