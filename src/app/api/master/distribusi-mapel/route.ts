import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncAsatidzMapel } from "@/lib/syncAsatidzMapel";

function formatGroupedMapelString(
  assignments: {
    kelas?: { nama?: string | null } | null;
    mapel?: { nama?: string | null } | null;
  }[],
): string {
  const byKelas = new Map<string, string[]>();
  for (const a of assignments) {
    const kName = (a.kelas?.nama || "").trim();
    const mName = (a.mapel?.nama || "").trim();
    if (!kName || !mName) continue;
    const existing = byKelas.get(kName) || [];
    if (!existing.some((x) => x.toLowerCase() === mName.toLowerCase())) {
      existing.push(mName);
    }
    byKelas.set(kName, existing);
  }
  return Array.from(byKelas.entries())
    .map(([kName, mapels]) => `${kName}: ${mapels.join(", ")}`)
    .join("; ");
}

export async function GET() {
  try {
    const teacherWhere = {
      OR: [
        {
          kategori_pegawai: {
            contains: "ASATIDZ",
            mode: "insensitive" as const,
          },
        },
        {
          kategori_pegawai: { contains: "GURU", mode: "insensitive" as const },
        },
        { jabatan: { contains: "Guru", mode: "insensitive" as const } },
        { jabatan: { contains: "Pengajar", mode: "insensitive" as const } },
        { jabatan: { contains: "Asatidz", mode: "insensitive" as const } },
        { mata_pelajaran: { not: null } },
        { mengajar: { some: {} } },
        { jadwal: { some: {} } },
      ],
    };

    let asatidz = await prisma.pegawai.findMany({
      where: teacherWhere,
      include: {
        mengajar: {
          include: {
            kelas: true,
            mapel: true,
          },
        },
      },
      orderBy: { nama_lengkap: "asc" },
    });

    // Pastikan relasi asatidzmMapel tersinkron bila masih ada string mata_pelajaran yang belum dipetakan
    const needingSync = asatidz.filter(
      (a) => a.mata_pelajaran?.trim() && a.mengajar.length === 0,
    );
    if (needingSync.length > 0) {
      await Promise.all(
        needingSync.map((t) =>
          syncAsatidzMapel(t.id, t.mata_pelajaran).catch(() => {}),
        ),
      );
      asatidz = await prisma.pegawai.findMany({
        where: teacherWhere,
        include: {
          mengajar: {
            include: {
              kelas: true,
              mapel: true,
            },
          },
        },
        orderBy: { nama_lengkap: "asc" },
      });
    }

    const [kelas, mapel] = await Promise.all([
      prisma.kelas.findMany({
        where: { is_active: true },
        orderBy: [{ jenjang: "asc" }, { nama: "asc" }],
      }),
      prisma.mataPelajaran.findMany({
        where: { is_active: true },
        orderBy: { nama: "asc" },
      }),
    ]);

    return NextResponse.json({ success: true, asatidz, kelas, mapel });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const { pegawai_id, assignments } = await req.json();

    // Clear old
    await prisma.asatidzmMapel.deleteMany({ where: { pegawai_id } });

    // Insert new
    if (Array.isArray(assignments) && assignments.length > 0) {
      await prisma.asatidzmMapel.createMany({
        data: assignments.map((a: { kelas_id: string; mapel_id: string }) => ({
          pegawai_id,
          kelas_id: a.kelas_id,
          mapel_id: a.mapel_id,
        })),
      });
    }

    // Rebuild mata_pelajaran string for SIMPEG & SIAKAD compatibility
    const updated = await prisma.asatidzmMapel.findMany({
      where: { pegawai_id },
      include: { kelas: true, mapel: true },
    });

    const mapelString = formatGroupedMapelString(updated);

    await prisma.pegawai.update({
      where: { id: pegawai_id },
      data: { mata_pelajaran: mapelString || null, updated_at: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Distribusi mengajar berhasil disimpan",
      mata_pelajaran: mapelString,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
