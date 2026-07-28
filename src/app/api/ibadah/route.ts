import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const tanggalStr = searchParams.get("tanggal");
  const kelas_id = searchParams.get("kelas_id");

  if (!tanggalStr || !kelas_id) {
    return NextResponse.json(
      { error: "tanggal and kelas_id are required" },
      { status: 400 }
    );
  }

  try {
    const tanggal = new Date(tanggalStr);

    // Ambil data santri aktif di kelas tersebut
    const santriList = await prisma.santriAktif.findMany({
      where: {
        kelas_id,
        is_active: true,
      },
      select: {
        id: true,
        nama_lengkap: true,
      },
      orderBy: {
        nama_lengkap: "asc",
      },
    });

    // Ambil data ibadah santri pada tanggal tersebut
    const ibadahData = await prisma.ibadahAdabSantri.findMany({
      where: {
        tanggal,
        santri_id: {
          in: santriList.map((s) => s.id),
        },
      },
    });

    // Gabungkan data
    const result = santriList.map((santri) => {
      const ibadah = ibadahData.find((i) => i.santri_id === santri.id);
      return {
        santri_id: santri.id,
        nama_lengkap: santri.nama_lengkap,
        // Defaults if not exists
        shubuh: ibadah?.shubuh || "Berjamaah",
        dzuhur: ibadah?.dzuhur || "Berjamaah",
        ashar: ibadah?.ashar || "Berjamaah",
        maghrib: ibadah?.maghrib || "Berjamaah",
        isya: ibadah?.isya || "Berjamaah",
        tahajjud: ibadah?.tahajjud || false,
        dhuha: ibadah?.dhuha || false,
        shaum: ibadah?.shaum || false,
        almatsurat: ibadah?.almatsurat || false,
        adab_kamar: ibadah?.adab_kamar || "",
        adab_masjid: ibadah?.adab_masjid || "",
        catatan: ibadah?.catatan || "",
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching ibadah:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tanggal: tanggalStr, pegawai_id, data } = body;

    if (!tanggalStr || !pegawai_id || !Array.isArray(data)) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    const tanggal = new Date(tanggalStr);

    // Proses upsert untuk setiap data santri
    const results = await Promise.all(
      data.map((item) =>
        prisma.ibadahAdabSantri.upsert({
          where: {
            santri_id_tanggal: {
              santri_id: item.santri_id,
              tanggal,
            },
          },
          update: {
            pegawai_id,
            shubuh: item.shubuh,
            dzuhur: item.dzuhur,
            ashar: item.ashar,
            maghrib: item.maghrib,
            isya: item.isya,
            tahajjud: item.tahajjud,
            dhuha: item.dhuha,
            shaum: item.shaum,
            almatsurat: item.almatsurat,
            adab_kamar: item.adab_kamar,
            adab_masjid: item.adab_masjid,
            catatan: item.catatan,
          },
          create: {
            santri_id: item.santri_id,
            pegawai_id,
            tanggal,
            shubuh: item.shubuh,
            dzuhur: item.dzuhur,
            ashar: item.ashar,
            maghrib: item.maghrib,
            isya: item.isya,
            tahajjud: item.tahajjud,
            dhuha: item.dhuha,
            shaum: item.shaum,
            almatsurat: item.almatsurat,
            adab_kamar: item.adab_kamar,
            adab_masjid: item.adab_masjid,
            catatan: item.catatan,
          },
        })
      )
    );

    return NextResponse.json({ success: true, updated: results.length });
  } catch (error) {
    console.error("Error saving ibadah:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
