import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.role?.includes("ADMIN_SUPER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const santri_id = searchParams.get("santri_id");
    let mapel_id = searchParams.get("mapel_id");
    const semester = searchParams.get("semester");
    const tahun_ajaran = searchParams.get("tahun_ajaran");
    const nama_mapel_custom = searchParams.get("nama_mapel_custom");

    if (!mapel_id && nama_mapel_custom) {
      const existingMapel = await prisma.mataPelajaran.findFirst({
        where: { nama: { equals: nama_mapel_custom, mode: "insensitive" } }
      });
      if (existingMapel) {
        mapel_id = existingMapel.id;
      }
    }

    if (!santri_id || !mapel_id || !semester || !tahun_ajaran) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    await prisma.nilaiSantri.deleteMany({
      where: {
        santri_id,
        mapel_id,
        semester,
        tahun_ajaran
      } });
    return NextResponse.json({ message: "Data nilai santri berhasil dihapus" }, { status: 200 });
  } catch (err) {
    console.error(`[DELETE /api/nilai/hapus]`, err);
    return NextResponse.json({ error: "Gagal menghapus data nilai santri" }, { status: 500 });
  }
}
