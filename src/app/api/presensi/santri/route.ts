import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const kelas_id = searchParams.get("kelas_id");
    const tanggal = searchParams.get("tanggal");
    const mapel_id = searchParams.get("mapel_id");
    const jam_ke = searchParams.get("jam_ke");

    if (!kelas_id || !tanggal) {
      return NextResponse.json({ error: "kelas_id dan tanggal wajib diisi" }, { status: 400 });
    }

    const tanggalDate = new Date(tanggal);

    // Ambil semua santri aktif di kelas tersebut
    const santri = await prisma.santriAktif.findMany({
      where: { kelas_id, is_active: true },
      orderBy: { nama_lengkap: "asc" },
      select: { id: true, nama_lengkap: true, nis: true },
    });

    // Ambil presensi yang sudah ada untuk tanggal tersebut
    const presensiAda = await prisma.presensiSiswa.findMany({
      where: {
        kelas_id,
        tanggal: tanggalDate,
        ...(mapel_id ? { mapel_id } : { mapel_id: null }),
        ...(jam_ke ? { jam_ke } : { jam_ke: null }),
      },
      select: { santri_id: true, status: true, keterangan: true, id: true },
    });

    // Map presensi ke santri_id
    const presensiMap = new Map(presensiAda.map((p) => [p.santri_id, p]));

    // Gabungkan santri dengan status presensi (biarkan null jika belum diabsen)
    const result = santri.map((s) => {
      const p = presensiMap.get(s.id);
      return {
        ...s,
        status: p?.status ?? null,
        keterangan: p?.keterangan ?? null,
        presensi_id: p?.id ?? null,
      };
    });

    return NextResponse.json({ data: result, tanggal });
  } catch (err) {
    console.error("[GET /api/presensi/santri]", err);
    return NextResponse.json({ error: "Gagal mengambil data presensi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { kelas_id, tanggal, mapel_id, jam_ke, presensi } = body as {
      kelas_id: string;
      tanggal: string;
      mapel_id: string;
      jam_ke: string;
      presensi: { santri_id: string; status: string; keterangan?: string }[];
    };

    if (!kelas_id || !tanggal || !mapel_id || !jam_ke || !Array.isArray(presensi) || presensi.length === 0) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const tanggalDate = new Date(tanggal);

    // Upsert semua presensi
    const ops = presensi.map((p) => {
      // Prisma's upsert with compound unique constraint with nullable fields might be tricky.
      // We will use a raw query or findFirst + update/create if Prisma upsert fails on nulls,
      // but in Prisma 5, upsert works with the generated unique object if fields are exactly matched.
      return prisma.presensiSiswa.upsert({
        where: {
          santri_id_tanggal_mapel_id_jam_ke: {
            santri_id: p.santri_id,
            tanggal: tanggalDate,
            mapel_id,
            jam_ke,
          },
        },
        create: {
          santri_id: p.santri_id,
          kelas_id,
          tanggal: tanggalDate,
          mapel_id,
          jam_ke,
          status: p.status,
          keterangan: p.keterangan ?? null,
        },
        update: {
          status: p.status,
          keterangan: p.keterangan ?? null,
        },
      });
    });

    await prisma.$transaction(ops);

    return NextResponse.json({ message: "Presensi berhasil disimpan", count: presensi.length });
  } catch (err) {
    console.error("[POST /api/presensi/santri]", err);
    return NextResponse.json({ error: "Gagal menyimpan presensi" }, { status: 500 });
  }
}
