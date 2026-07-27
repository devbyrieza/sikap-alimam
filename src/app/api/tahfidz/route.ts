import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const kelas_id = searchParams.get("kelas_id");
    const tanggal = searchParams.get("tanggal");

    if (!kelas_id || !tanggal) {
      return NextResponse.json(
        { success: false, message: "kelas_id dan tanggal wajib diisi" },
        { status: 400 }
      );
    }

    const targetDate = new Date(tanggal);

    // Ambil data santri di kelas tersebut
    const santri = await prisma.santriAktif.findMany({
      where: { kelas_id, is_active: true },
      orderBy: { nama_lengkap: "asc" },
      select: {
        id: true,
        nama_lengkap: true,
        nis: true,
      },
    });

    // Ambil capaian tahfidz pada tanggal tersebut untuk santri-santri ini
    const capaian = await prisma.capaianTahfidz.findMany({
      where: {
        tanggal: targetDate,
        santri_id: { in: santri.map((s) => s.id) },
      },
    });

    // Petakan capaian ke ID santri
    const capaianMap = new Map();
    capaian.forEach((c) => {
      // Jika 1 santri bisa setor beberapa jenis dalam 1 hari, kita simpan dalam array
      if (!capaianMap.has(c.santri_id)) {
        capaianMap.set(c.santri_id, []);
      }
      capaianMap.get(c.santri_id).push(c);
    });

    const result = santri.map((s) => ({
      ...s,
      capaian: capaianMap.get(s.id) || [],
    }));

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tahfidz:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { asatidz_id, tanggal, data } = body;

    if (!asatidz_id || !tanggal || !data || !Array.isArray(data)) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const targetDate = new Date(tanggal);

    // Proses penyimpanan data
    await prisma.$transaction(
      data.map((item: any) => {
        if (item.id) {
          // Update existing
          return prisma.capaianTahfidz.update({
            where: { id: item.id },
            data: {
              jenis: item.jenis,
              surat: item.surat,
              halaman: item.halaman || null,
              ayat: item.ayat || null,
              nilai: item.nilai ? parseFloat(item.nilai) : null,
              keterangan: item.keterangan || null,
            },
          });
        } else {
          // Create new
          return prisma.capaianTahfidz.create({
            data: {
              santri_id: item.santri_id,
              asatidz_id: asatidz_id,
              tanggal: targetDate,
              jenis: item.jenis,
              surat: item.surat,
              halaman: item.halaman || null,
              ayat: item.ayat || null,
              nilai: item.nilai ? parseFloat(item.nilai) : null,
              keterangan: item.keterangan || null,
            },
          });
        }
      })
    );

    return NextResponse.json(
      { success: true, message: "Data tahfidz berhasil disimpan" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving tahfidz:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan data tahfidz" },
      { status: 500 }
    );
  }
}
