import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  let SIMPEG_DB_URL = process.env.SIMPEG_DATABASE_URL;

  if (!SIMPEG_DB_URL) {
    if (process.env.NODE_ENV === "production") {
      SIMPEG_DB_URL = "postgresql://user_office:password_rahasia_office123@ucso0wo8gg8owc880w8sco44:5432/postgres?schema=office";
    } else {
      // Fallback lokal jika env SIMPEG_DATABASE_URL tidak diset
      return handleLocalFallback("Env SIMPEG_DATABASE_URL tidak dikonfigurasi.");
    }
  }

  console.log("Memulai sinkronisasi via API SIKAP...");
  
  // Parse skema secara dinamis dari URL koneksi
  let schema = "public";
  try {
    const urlObj = new URL(SIMPEG_DB_URL);
    schema = urlObj.searchParams.get("schema") || "public";
  } catch (e) {
    console.warn("Gagal mengekstrak nama skema dari URL, default ke 'public'.");
  }

  const pgClient = new Client({
    connectionString: SIMPEG_DB_URL,
    connectionTimeoutMillis: 5000, // Timeout cepat untuk lokal dev
  });

  try {
    await pgClient.connect();
    
    const res = await pgClient.query(`
      SELECT id, nik, nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir, no_hp, email, alamat, kategori_pegawai, mata_pelajaran 
      FROM ${schema}.pegawai 
      WHERE kategori_pegawai = 'ASATIDZ' 
         OR kategori_pegawai = 'GURU' 
         OR kategori_pegawai = 'Guru'
         OR kategori_pegawai ILIKE '%guru%'
    `);
    
    const simpegGuruList = res.rows;
    await pgClient.end();

    if (simpegGuruList.length === 0) {
      return NextResponse.json({ success: true, message: "Sinkronisasi selesai. Tidak ada guru baru ditemukan di SIMPEG." });
    }

    const result = await executeSync(simpegGuruList);
    return NextResponse.json({ success: true, ...result });

  } catch (error: any) {
    console.error("Koneksi DB SIMPEG gagal, mencoba fallback lokal:", error.message);
    return handleLocalFallback(error.message);
  }
}

async function handleLocalFallback(reason: string) {
  // Mencari file gurus_production.json di folder scripts/ atau root
  const localJsonPath = path.join(process.cwd(), "gurus_production.json");
  
  if (fs.existsSync(localJsonPath)) {
    try {
      const raw = fs.readFileSync(localJsonPath, "utf8");
      const gurus = JSON.parse(raw);
      const result = await executeSync(gurus);
      return NextResponse.json({ 
        success: true, 
        fallback: true,
        message: `Koneksi database SIMPEG offline (${reason}). Menggunakan data lokal (gurus_production.json).`,
        ...result 
      });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: `Gagal membaca file fallback: ${e.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ 
    success: false, 
    error: `Koneksi database SIMPEG offline (${reason}) dan file fallback tidak ditemukan.` 
  }, { status: 503 });
}

async function executeSync(simpegGuruList: any[]) {
  // Ambil data yang ada di SIKAP saat ini
  const sikapGuruList = await prisma.pegawai.findMany({
    where: { kategori_pegawai: 'ASATIDZ' }
  });

  const simpegGuruIds = new Set(simpegGuruList.map(g => g.id));
  
  // Cari Guru di SIKAP yang TIDAK ADA di SIMPEG
  const toDeleteIds = sikapGuruList
    .filter(g => !simpegGuruIds.has(g.id))
    .map(g => g.id);

  let deletedCount = 0;
  if (toDeleteIds.length > 0) {
    // Hapus relasi terlebih dahulu agar tidak foreign key constraint error
    await prisma.jadwalPelajaran.deleteMany({ where: { pegawai_id: { in: toDeleteIds } } });
    await prisma.asatidzmMapel.deleteMany({ where: { pegawai_id: { in: toDeleteIds } } });
    await prisma.jurnalMengajar.deleteMany({ where: { pegawai_id: { in: toDeleteIds } } });
    await prisma.presensiAsatidz.deleteMany({ where: { pegawai_id: { in: toDeleteIds } } });
    await prisma.capaianTahfidz.deleteMany({ where: { pegawai_id: { in: toDeleteIds } } });
    await prisma.ibadahAdabSantri.deleteMany({ where: { pegawai_id: { in: toDeleteIds } } });

    const delRes = await prisma.pegawai.deleteMany({ where: { id: { in: toDeleteIds } } });
    deletedCount = delRes.count;
  }

  // Insert/Upsert guru dari SIMPEG
  let updatedCount = 0;
  for (const guru of simpegGuruList) {
    try {
        let validNik = guru.nik && guru.nik.trim() !== "" && guru.nik.trim() !== "-" ? guru.nik.trim() : null;

        const savedPegawai = await prisma.pegawai.upsert({
          where: { id: guru.id },
          update: {
            nik: validNik,
            nama_lengkap: guru.nama_lengkap,
            jenis_kelamin: guru.jenis_kelamin,
            tempat_lahir: guru.tempat_lahir,
            tanggal_lahir: guru.tanggal_lahir ? new Date(guru.tanggal_lahir) : null,
            no_hp: guru.no_hp,
            email: guru.email,
            alamat: guru.alamat,
            mata_pelajaran: guru.mata_pelajaran,
            kategori_pegawai: 'ASATIDZ'
          },
          create: {
            id: guru.id,
            nik: validNik || `GURU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            nama_lengkap: guru.nama_lengkap,
            jenis_kelamin: guru.jenis_kelamin,
            tempat_lahir: guru.tempat_lahir,
            tanggal_lahir: guru.tanggal_lahir ? new Date(guru.tanggal_lahir) : null,
            no_hp: guru.no_hp,
            email: guru.email,
            alamat: guru.alamat,
            mata_pelajaran: guru.mata_pelajaran,
            kategori_pegawai: 'ASATIDZ'
          }
        });

        if (!savedPegawai.user_id) {
          const passwordHash = await bcrypt.hash("Sikap2026!", 10);
          const fallbackEmail = guru.email || `${savedPegawai.nik || savedPegawai.id}@pesantren-alimam.com`;
          
          try {
            const newUser = await prisma.user.create({
              data: {
                email: fallbackEmail,
                password: passwordHash,
                nama: guru.nama_lengkap.trim(),
                role: "GURU",
                is_active: true
              }
            });
            await prisma.pegawai.update({
              where: { id: savedPegawai.id },
              data: { user_id: newUser.id }
            });
          } catch (e) {
            console.error("Gagal membuat user otomatis untuk", guru.nama_lengkap, e);
          }
        } else {
          const existingUser = await prisma.user.findUnique({ where: { id: savedPegawai.user_id } });
          if (existingUser && !existingUser.role.includes("GURU")) {
            const newRole = existingUser.role ? `${existingUser.role},GURU` : "GURU";
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { role: newRole }
            });
          }
        }

      // Auto-mapping ke AsatidzmMapel jika ada mata_pelajaran
      if (guru.mata_pelajaran) {
        const segments = (guru.mata_pelajaran as string)
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s);

        for (const segment of segments) {
          const match = segment.match(/^\[(.*?)\]\s*(.*)$/);
          let rawKelas = "";
          let rawMapel = "";

          if (match) {
            rawKelas = match[1].trim();
            rawMapel = match[2].trim();
          } else {
            rawMapel = segment;
          }

          // 1. Cari Kelas di SIKAP
          let dbKelas = null;
          if (rawKelas) {
            dbKelas = await prisma.kelas.findFirst({
              where: {
                nama: {
                  equals: rawKelas,
                  mode: "insensitive",
                },
              },
            });
          }

          // 2. Normalisasi & Cari Mapel di SIKAP
          let searchName = rawMapel;
          const lowerMapel = rawMapel.toLowerCase();
          if (
            lowerMapel.includes("qur'an") ||
            lowerMapel.includes("tahfidz") ||
            lowerMapel.includes("tahfizh")
          ) {
            searchName = "Tah"; // Mencakup "Tahsin/Tahfidz Al-Quran"
          } else if (lowerMapel === "fiqih" || lowerMapel === "fiqh") {
            searchName = "Fiqh";
          } else if (lowerMapel === "aqidah" || lowerMapel === "akidah") {
            searchName = "Akidah";
          } else if (lowerMapel === "hadits" || lowerMapel === "hadis") {
            searchName = "Hadis";
          } else if (lowerMapel === "tarikh" || lowerMapel.includes("siroh")) {
            searchName = "Siroh";
          } else if (lowerMapel === "ipa") {
            searchName = "IPA";
          }

          const mapelFilter: any = {
            nama: {
              contains: searchName,
              mode: "insensitive",
            },
          };

          if (dbKelas) {
            mapelFilter.kelas_id = dbKelas.id;
          }

          const matchedMapel = await prisma.mataPelajaran.findFirst({
            where: mapelFilter,
          });

          if (matchedMapel) {
            await prisma.asatidzmMapel.upsert({
              where: {
                pegawai_id_mapel_id_kelas_id: {
                  pegawai_id: guru.id,
                  mapel_id: matchedMapel.id,
                  kelas_id: matchedMapel.kelas_id,
                },
              },
              update: {},
              create: {
                pegawai_id: guru.id,
                mapel_id: matchedMapel.id,
                kelas_id: matchedMapel.kelas_id,
              },
            });
          }
        }
      }

      updatedCount++;
    } catch (err) {
      // Abaikan jika bentrok unik NIK/Email
    }
  }

  return {
    deleted: deletedCount,
    updated: updatedCount,
    total: simpegGuruList.length
  };
}
