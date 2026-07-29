import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { prisma as currentPrisma } from '@/lib/prisma'; // This is ppdb_alimam (new DB)

// This API pulls data from the OLD database and injects it into the NEW database
export async function POST() {
  try {
    // 1. Connect to the OLD office schema
    const OLD_DB_URL = "postgresql://user_office:password_rahasia_office123@ucso0wo8gg8owc880w8sco44:5432/postgres?schema=office";
    const oldPrisma = new PrismaClient({
      datasourceUrl: OLD_DB_URL,
    });

    // 2. Fetch all Pegawai and their associated Users from old DB
    // (Assuming they have the exact same Prisma Schema in the old DB)
    const oldPegawai = await oldPrisma.pegawai.findMany();
    const oldUsers = await oldPrisma.user.findMany();

    if (oldPegawai.length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada data pegawai di server lama.' });
    }

    let successCount = 0;

    // 3. Migrate Users first
    for (const oldU of oldUsers) {
      await currentPrisma.user.upsert({
        where: { id: oldU.id },
        update: {
          email: oldU.email,
          password: oldU.password,
          nama: oldU.nama,
          role: oldU.role,
          is_active: oldU.is_active,
        },
        create: {
          id: oldU.id,
          email: oldU.email,
          password: oldU.password,
          nama: oldU.nama,
          role: oldU.role,
          is_active: oldU.is_active,
          created_at: oldU.created_at,
          updated_at: oldU.updated_at,
        }
      });
    }

    // 4. Migrate Pegawai
    for (const oldP of oldPegawai) {
      await currentPrisma.pegawai.upsert({
        where: { id: oldP.id },
        update: {
          user_id: oldP.user_id,
          nama_lengkap: oldP.nama_lengkap,
          kategori_pegawai: oldP.kategori_pegawai,
          jabatan: oldP.jabatan,
          unit_kerja: oldP.unit_kerja,
          divisi: oldP.divisi,
          mata_pelajaran: oldP.mata_pelajaran,
          is_active: oldP.is_active,
          foto_url: oldP.foto_url,
        },
        create: {
          id: oldP.id,
          user_id: oldP.user_id,
          nama_lengkap: oldP.nama_lengkap,
          kategori_pegawai: oldP.kategori_pegawai,
          jabatan: oldP.jabatan,
          unit_kerja: oldP.unit_kerja,
          divisi: oldP.divisi,
          mata_pelajaran: oldP.mata_pelajaran,
          is_active: oldP.is_active,
          foto_url: oldP.foto_url,
          created_at: oldP.created_at,
          updated_at: oldP.updated_at,
        }
      });
      successCount++;
    }

    // Clean up
    await oldPrisma.$disconnect();

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil menarik ${successCount} data guru dari server lama (SIMPEG)!`
    });
  } catch (error: any) {
    console.error("Migration Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
