import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const kelas_id = searchParams.get("kelas_id");
    const tanggal = searchParams.get("tanggal");

    if (!kelas_id || !tanggal) {
      return NextResponse.json({ error: "kelas_id dan tanggal wajib" }, { status: 400 });
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
      },
      select: { santri_id: true, status: true, keterangan: true, id: true },
    });

    // Map presensi ke santri_id
    const presensiMap = new Map(presensiAda.map((p) => [p.santri_id, p]));

    // Gabungkan santri dengan status presensi (default hadir jika belum ada)
    const result = santri.map((s) => {
      const p = presensiMap.get(s.id);
      return {
        ...s,
        status: p?.status ?? "hadir",
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
    const { kelas_id, tanggal, presensi } = body as {
      kelas_id: string;
      tanggal: string;
      presensi: { santri_id: string; status: string; keterangan?: string }[];
    };

    if (!kelas_id || !tanggal || !Array.isArray(presensi) || presensi.length === 0) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const tanggalDate = new Date(tanggal);

    // Upsert semua presensi
    const ops = presensi.map((p) =>
      prisma.presensiSiswa.upsert({
        where: {
          santri_id_tanggal: {
            santri_id: p.santri_id,
            tanggal: tanggalDate,
          },
        },
        create: {
          santri_id: p.santri_id,
          kelas_id,
          tanggal: tanggalDate,
          status: p.status,
          keterangan: p.keterangan ?? null,
        },
        update: {
          status: p.status,
          keterangan: p.keterangan ?? null,
        },
      })
    );

    await prisma.$transaction(ops);

    return NextResponse.json({ message: "Presensi berhasil disimpan", count: presensi.length });
  } catch (err) {
    console.error("[POST /api/presensi/santri]", err);
    return NextResponse.json({ error: "Gagal menyimpan presensi" }, { status: 500 });
  }
}
