import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const kelas_id = searchParams.get("kelas_id");
  const mapel_id = searchParams.get("mapel_id");
  const santri_id = searchParams.get("santri_id");

  try {
    let queryOptions: any = {
      include: {
        santri: true,
        mapel: true,
        kelas: true },
      where: {}
    };

    if (kelas_id) queryOptions.where.kelas_id = kelas_id;
    if (mapel_id) queryOptions.where.mapel_id = mapel_id;
    if (santri_id) queryOptions.where.santri_id = santri_id;

    const nilai = await prisma.nilaiSantri.findMany(queryOptions);

    return NextResponse.json(nilai);
  } catch (error) {
    console.error("Error filtering nilai:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
