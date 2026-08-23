import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { pegawai, users } = data;
    
    let count = 0;

    for (const u of users) {
      await prisma.user.upsert({
        where: { id: u.id },
        update: {
          email: u.email,
          password: u.password,
          nama: u.nama,
          role: u.role,
          is_active: u.is_active },
        create: {
          id: u.id,
          email: u.email,
          password: u.password,
          nama: u.nama,
          role: u.role,
          is_active: u.is_active,
          created_at: u.created_at }
      });
    }

    for (const p of pegawai) {
      await prisma.pegawai.upsert({
        where: { id: p.id },
        update: {
          user_id: p.user_id,
          nama_lengkap: p.nama_lengkap,
          kategori_pegawai: p.kategori_pegawai,
          jabatan: p.jabatan,
          unit_kerja: p.unit_kerja,
          divisi: p.divisi,
          mata_pelajaran: p.mata_pelajaran,
          foto_url: p.foto_url },
        create: {
          id: p.id,
          user_id: p.user_id,
          nama_lengkap: p.nama_lengkap,
          kategori_pegawai: p.kategori_pegawai,
          jabatan: p.jabatan,
          unit_kerja: p.unit_kerja,
          divisi: p.divisi,
          mata_pelajaran: p.mata_pelajaran,
          foto_url: p.foto_url,
          created_at: p.created_at,
          updated_at: p.updated_at }
      });
      count++;
    }

    return NextResponse.json({ success: true, imported: count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
