import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { data } = await request.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ success: false, message: "Data kosong atau format salah." });
    }

    const allPegawai = await prisma.pegawai.findMany();

    const results = {
      berhasil: 0,
      gagal: 0,
      log_gagal: [] as string[]
    };

    for (const row of data) {
      const { "Nama Pengampu": namaG, "Nama Kelompok": namaK, "Sesi": sesiRaw } = row;
      
      if (!namaG || !namaK || !sesiRaw) {
        results.gagal++;
        results.log_gagal.push(`Baris tidak lengkap: ${JSON.stringify(row)}`);
        continue;
      }

      // 1. Cari Pengampu (Fuzzy)
      let p = allPegawai.find(x => x.nama_lengkap.toLowerCase().includes(namaG.toLowerCase().trim()));
      if (!p) {
        if (namaG.toLowerCase().includes("ade")) p = allPegawai.find(x => x.nama_lengkap.toLowerCase().includes("ade su"));
        if (namaG.toLowerCase().includes("arifin")) p = allPegawai.find(x => x.nama_lengkap.toLowerCase().includes("arifin"));
        if (namaG.toLowerCase().includes("ikbal") || namaG.toLowerCase().includes("iqbal")) p = allPegawai.find(x => x.nama_lengkap.toLowerCase().includes("iqbal"));
      }

      if (!p) {
        results.gagal++;
        results.log_gagal.push(`Pengampu tidak ditemukan: ${namaG}`);
        continue;
      }

      // 2. Format Sesi
      let sesiFormatted = "subuh";
      const sL = sesiRaw.toLowerCase().trim();
      if (sL.includes("dhuha") || sL.includes("duha")) sesiFormatted = "dhuha";
      else if (sL.includes("maghrib") || sL.includes("magrib")) sesiFormatted = "maghrib";

      // 3. Cek apakah kelompok dengan nama dan sesi tsb di pengampu ini sudah ada?
      const existing = await prisma.halaqohKelompok.findFirst({
        where: {
          pegawai_id: p.id,
          nama_kelompok: namaK.trim(),
          sesi: sesiFormatted
        }
      });

      if (!existing) {
        await prisma.halaqohKelompok.create({
          data: {
            pegawai_id: p.id,
            nama_kelompok: namaK.trim(),
            sesi: sesiFormatted
          }
        });
        results.berhasil++;
      } else {
        // Already exists, just skip or consider as success
        results.berhasil++;
      }
    }

    return NextResponse.json({ success: true, results });

  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message });
  }
}