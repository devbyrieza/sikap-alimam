import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const kelas_id = searchParams.get("kelas_id");
    const tanggal = searchParams.get("tanggal");
    let mapel_id = searchParams.get("mapel_id");
    const jam_ke = searchParams.get("jam_ke");
    const nama_mapel_custom = searchParams.get("nama_mapel_custom");

    if (!kelas_id || !tanggal) {
      return NextResponse.json({ error: "kelas_id dan tanggal wajib diisi" }, { status: 400 });
    }

    if (!mapel_id && nama_mapel_custom) {
      const existingMapel = await prisma.mataPelajaran.findFirst({
        where: { nama: { equals: nama_mapel_custom, mode: "insensitive" }, kelas_id }
      });
      if (existingMapel) {
        mapel_id = existingMapel.id;
      }
    }

    const tanggalDate = new Date(tanggal);

    // Ambil info kelas yang dipilih
    const selectedKelasInfo = await prisma.kelas.findUnique({ where: { id: kelas_id } });

    let allowedKelasIds = [kelas_id];
    if (selectedKelasInfo) {
      const isIL = selectedKelasInfo.jenjang === "IL" || 
                   selectedKelasInfo.nama.toUpperCase().includes("IL") || 
                   selectedKelasInfo.nama.toUpperCase().includes("I'DAD") || 
                   selectedKelasInfo.nama.toUpperCase().includes("IDAD") ||
                   selectedKelasInfo.nama.toUpperCase().includes("LUGHOWY");
      
      if (isIL) {
        const ilKelasRecords = await prisma.kelas.findMany({
          where: {
            OR: [
              { jenjang: "IL" },
              { nama: { contains: "IL", mode: "insensitive" } },
              { nama: { contains: "I'dad", mode: "insensitive" } },
              { nama: { contains: "Idad", mode: "insensitive" } },
              { nama: { contains: "Lughow", mode: "insensitive" } }
            ]
          },
          select: { id: true }
        });
        allowedKelasIds = Array.from(new Set([kelas_id, ...ilKelasRecords.map(k => k.id)]));

        // Auto-ensure Iman Prayogo (NIS: 2602070019) terdaftar di database
        const imanExist = await prisma.santriAktif.findFirst({
          where: { nama_lengkap: { contains: "Iman Prayogo", mode: "insensitive" } }
        });
        if (!imanExist) {
          await prisma.santriAktif.create({
            data: {
              nis: "2602070019",
              nama_lengkap: "Iman Prayogo",
              kelas_id: allowedKelasIds[0],
              jenis_kelamin: "L",
              is_active: true
            }
          });
        }
      }
    }


    // Ambil semua santri aktif di kelas-kelas sepadan tersebut
    const santri = await prisma.santriAktif.findMany({
      where: {
        kelas_id: { in: allowedKelasIds },
        is_active: true
      },
      orderBy: { nama_lengkap: "asc" },
      select: { id: true, nama_lengkap: true, nis: true } });

    // Ambil presensi yang sudah ada untuk tanggal tersebut
    const presensiAda = await prisma.presensiSiswa.findMany({
      where: {
        kelas_id: { in: allowedKelasIds },
        tanggal: tanggalDate,
        ...(mapel_id ? { mapel_id } : { mapel_id: null }),
        ...(jam_ke ? { jam_ke } : { jam_ke: null }) },
      select: { santri_id: true, status: true, keterangan: true, id: true } });


    // Map presensi ke santri_id
    const presensiMap = new Map(presensiAda.map((p) => [p.santri_id, p]));

    // Gabungkan santri dengan status presensi (biarkan null jika belum diabsen)
    const result = santri.map((s) => {
      const p = presensiMap.get(s.id);
      return {
        ...s,
        status: p?.status ?? null,
        keterangan: p?.keterangan ?? null,
        presensi_id: p?.id ?? null };
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
    const { kelas_id, tanggal, mapel_id, jam_ke, presensi, nama_mapel_custom } = body as {
      kelas_id: string;
      tanggal: string;
      mapel_id: string;
      jam_ke: string | string[];
      presensi: { santri_id: string; status: string; keterangan?: string }[];
      nama_mapel_custom?: string;
    };

    let finalMapelId = mapel_id;
    if (!finalMapelId && nama_mapel_custom) {
      const existing = await prisma.mataPelajaran.findFirst({
        where: { nama: { equals: nama_mapel_custom, mode: "insensitive" }, kelas_id }
      });
      if (existing) {
        finalMapelId = existing.id;
      } else {
        const newMapel = await prisma.mataPelajaran.create({
          data: { nama: nama_mapel_custom.trim(), kelas_id, is_active: true }
        });
        finalMapelId = newMapel.id;
      }
    }

    if (!kelas_id || !tanggal || !finalMapelId || !jam_ke || !Array.isArray(presensi) || presensi.length === 0) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const jam_ke_str = Array.isArray(jam_ke) ? jam_ke.join(", ") : String(jam_ke);
    const tanggalDate = new Date(tanggal);

    // Untuk menghindari bug upsert Prisma dengan tipe Date dan nullable fields,
    // kita akan mengeksekusi operasi secara manual.
    // 1. Ambil data presensi yang sudah ada untuk (tanggal, mapel_id, jam_ke)
    const existingPresensi = await prisma.presensiSiswa.findMany({
      where: {
        tanggal: tanggalDate,
        mapel_id: finalMapelId,
        jam_ke: jam_ke_str,
        santri_id: { in: presensi.map((p) => p.santri_id) } },
      select: { id: true, santri_id: true } });

    const existingMap = new Map(existingPresensi.map((p) => [p.santri_id, p.id]));

    const ops = presensi.map((p) => {
      const existingId = existingMap.get(p.santri_id);
      
      if (existingId) {
        return prisma.presensiSiswa.update({
          where: { id: existingId },
          data: {
            status: p.status,
            keterangan: p.keterangan ?? null } });
      } else {
        return prisma.presensiSiswa.create({
          data: {
            santri_id: p.santri_id,
            kelas_id,
            tanggal: tanggalDate,
            mapel_id: finalMapelId,
            jam_ke: jam_ke_str,
            status: p.status,
            keterangan: p.keterangan ?? null } });
      }
    });

    await prisma.$transaction(ops);

    return NextResponse.json({ message: "Presensi berhasil disimpan", count: presensi.length });
  } catch (err) {
    console.error("[POST /api/presensi/santri]", err);
    return NextResponse.json({ error: "Gagal menyimpan presensi" }, { status: 500 });
  }
}
