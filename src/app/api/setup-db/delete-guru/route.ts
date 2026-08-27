import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Client } from 'pg';

const prisma = new PrismaClient();

export async function GET() {
  const targetNames = ['Abdil Aziz', 'Muhammad Maulana Rizki', 'Ust. Presentasi (Resmi), Lc.', 'Ust. Presensi (Resmi), Lc.'];
  const results = [];

  try {
    // 1. DELETE DARI SIKAP
    const sikapPegawai = await prisma.pegawai.findMany({
      where: {
        OR: targetNames.map(name => ({ nama_lengkap: { contains: name, mode: 'insensitive' } }))
      }
    });

    for (const p of sikapPegawai) {
      // Hapus relasi SIKAP
      await prisma.jadwalPelajaran.deleteMany({ where: { pegawai_id: p.id } });
      await prisma.asatidzmMapel.deleteMany({ where: { pegawai_id: p.id } });
      await prisma.jurnalMengajar.deleteMany({ where: { pegawai_id: p.id } });
      await prisma.presensiAsatidz.deleteMany({ where: { pegawai_id: p.id } });
      await prisma.capaianTahfidz.deleteMany({ where: { pegawai_id: p.id } });
      await prisma.ibadahAdabSantri.deleteMany({ where: { pegawai_id: p.id } });
      
      await prisma.pegawai.delete({ where: { id: p.id } });
      results.push(Dihapus dari SIKAP:  + p.nama_lengkap);

      if (p.user_id) {
        await prisma.user.delete({ where: { id: p.user_id } }).catch(() => {});
      }
    }

    // 2. DELETE DARI SIMPEG (Pusat)
    if (process.env.SIMPEG_DATABASE_URL) {
      const pgClient = new Client({ connectionString: process.env.SIMPEG_DATABASE_URL });
      await pgClient.connect();
      
      for (const name of targetNames) {
        const res = await pgClient.query(DELETE FROM public.pegawai WHERE nama_lengkap ILIKE  RETURNING nama_lengkap, ['%' + name + '%']);
        if (res.rowCount && res.rowCount > 0) {
          results.push(Dihapus dari SIMPEG:  + res.rows.map(r => r.nama_lengkap).join(', '));
        }
      }
      
      await pgClient.end();
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
