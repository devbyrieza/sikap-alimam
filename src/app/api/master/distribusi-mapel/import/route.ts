import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Client } from "pg";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { data } = await request.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ success: false, message: "Data kosong atau format salah." });
    }

    const allPegawai = await prisma.pegawai.findMany();
    const allKelas = await prisma.kelas.findMany();
    const allMapel = await prisma.mataPelajaran.findMany();

    const results = {
      berhasil: 0,
      gagal: 0,
      log_gagal: [] as string[]
    };

    // Dictionary untuk menampung string mapel baru setiap guru
    // format: { pegawai_id: ["7 MTs|Khitobah", "IL|Nahwu"] }
    const pegMapelStrings: Record<string, Set<string>> = {};

    for (const row of data) {
      const { "Nama Guru": namaG, "Kelas": namaK, "Mata Pelajaran": namaM } = row;
      
      if (!namaG || !namaK || !namaM) {
        results.gagal++;
        results.log_gagal.push(`Baris tidak lengkap: ${JSON.stringify(row)}`);
        continue;
      }

      // 1. Cari Guru (Fuzzy)
      let p = allPegawai.find(x => x.nama_lengkap.toLowerCase().includes(namaG.toLowerCase().trim()));
      if (!p) {
        // Fallback fuzzy khusus
        if (namaG.toLowerCase().includes("ade")) p = allPegawai.find(x => x.nama_lengkap.toLowerCase().includes("ade su"));
        if (namaG.toLowerCase().includes("arifin")) p = allPegawai.find(x => x.nama_lengkap.toLowerCase().includes("arifin"));
        if (namaG.toLowerCase().includes("ikbal") || namaG.toLowerCase().includes("iqbal")) p = allPegawai.find(x => x.nama_lengkap.toLowerCase().includes("iqbal"));
      }

      // 2. Cari Kelas (Fuzzy)
      let k = allKelas.find(x => x.nama.toLowerCase() === namaK.toLowerCase().trim());
      if (!k) {
        const raw = namaK.toUpperCase().trim();
        if (raw.includes("7") && raw.includes("MTS")) k = allKelas.find(x => x.nama.includes("7 MTs"));
        else if (raw.includes("IL") || raw.includes("IDAD")) k = allKelas.find(x => x.nama.includes("IL"));
      }

      if (!p) {
        results.gagal++;
        results.log_gagal.push(`Guru tidak ditemukan: ${namaG}`);
        continue;
      }
      if (!k) {
        results.gagal++;
        results.log_gagal.push(`Kelas tidak ditemukan: ${namaK}`);
        continue;
      }

      // 3. Cari Mapel di Kelas tersebut (Fuzzy)
      const targetMapelSearch = namaM.toLowerCase().trim();
      let m = allMapel.find(x => x.kelas_id === k.id && x.nama.toLowerCase().includes(targetMapelSearch));
      
      if (!m) {
        // Fallback mapel names
        let search = targetMapelSearch;
        if (search.includes("qur'an") || search.includes("tahfidz") || search.includes("tahfizh")) search = "tah";
        else if (search === "fiqih" || search === "fiqh") search = "fiqh";
        else if (search === "aqidah" || search === "akidah") search = "akidah";
        else if (search === "hadits" || search === "hadis") search = "hadis";
        else if (search === "tarikh" || search.includes("siroh") || search.includes("sirah")) search = "siroh";
        else if (search === "ipa") search = "ipa";

        m = allMapel.find(x => x.kelas_id === k.id && x.nama.toLowerCase().includes(search));
      }

      if (!m) {
        results.gagal++;
        results.log_gagal.push(`Mapel tidak ditemukan: ${namaM} di kelas ${k.nama}`);
        continue;
      }

      // 4. Upsert
      await prisma.asatidzmMapel.upsert({
        where: { pegawai_id_mapel_id_kelas_id: { pegawai_id: p.id, mapel_id: m.id, kelas_id: k.id } },
        update: {},
        create: { pegawai_id: p.id, mapel_id: m.id, kelas_id: k.id }
      });

      // Kumpulkan string untuk simpeg update
      if (!pegMapelStrings[p.id]) pegMapelStrings[p.id] = new Set();
      // Only add to Set to avoid duplicates if they were already there?
      // Wait, we need to rebuild the string for this teacher entirely.
      results.berhasil++;
    }

    // Update String ke Pegawai (Untuk SIMPEG)
    let pgClient = null;
    if (process.env.SIMPEG_DATABASE_URL) {
      pgClient = new Client({ connectionString: process.env.SIMPEG_DATABASE_URL });
      await pgClient.connect();
    }

    for (const [pegawaiId] of Object.entries(pegMapelStrings)) {
      // Re-fetch all mapels for this teacher to build the complete string
      const allTugas = await prisma.asatidzmMapel.findMany({
        where: { pegawai_id: pegawaiId },
        include: { kelas: true, mapel: true }
      });
      const strMapel = allTugas.map(t => `[${t.kelas?.nama}] ${t.mapel?.nama}`).join(", ");
      
      await prisma.pegawai.update({
        where: { id: pegawaiId },
        data: { mata_pelajaran: strMapel }
      });

      if (pgClient) {
        await pgClient.query("UPDATE public.pegawai SET mata_pelajaran = $1 WHERE id = $2", [strMapel, pegawaiId]);
      }
    }

    if (pgClient) await pgClient.end();

    return NextResponse.json({ success: true, results });

  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message });
  }
}
