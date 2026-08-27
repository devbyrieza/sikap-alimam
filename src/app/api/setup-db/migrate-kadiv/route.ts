import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let logs = [];

    // 1. Update roles in Users
    const users = await prisma.user.findMany({
      where: { role: { contains: 'KABID', mode: 'insensitive' } }
    });

    let userUpdates = 0;
    for (const u of users) {
      const newRole = u.role.replace(/KABID/g, 'KADIV').replace(/kabid/g, 'kadiv');
      if (newRole !== u.role) {
        await prisma.user.update({
          where: { id: u.id },
          data: { role: newRole }
        });
        userUpdates++;
      }
    }
    logs.push(`Updated roles for ${userUpdates} Users.`);

    // 2. Update Pegawai jabatan and kategori_pegawai
    const pegawai = await prisma.pegawai.findMany({
      where: {
        OR: [
          { jabatan: { contains: 'Kabid', mode: 'insensitive' } },
          { jabatan: { contains: 'Bidang', mode: 'insensitive' } },
          { divisi: { contains: 'Bidang', mode: 'insensitive' } },
          { kategori_pegawai: { contains: 'KABID', mode: 'insensitive' } }
        ]
      }
    });

    let pegUpdates = 0;
    for (const p of pegawai) {
      let updateData: any = {};
      
      if (p.jabatan) {
        updateData.jabatan = p.jabatan
          .replace(/Kabid/gi, 'Kadiv')
          .replace(/Kepala Bidang/gi, 'Kepala Divisi')
          .replace(/Bidang/gi, 'Divisi');
      }
      
      if (p.divisi) {
        updateData.divisi = p.divisi
          .replace(/Bidang/gi, 'Divisi')
          .replace(/bidang/gi, 'divisi');
      }

      if (p.kategori_pegawai) {
        updateData.kategori_pegawai = p.kategori_pegawai.replace(/KABID/g, 'KADIV');
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.pegawai.update({
          where: { id: p.id },
          data: updateData
        });
        pegUpdates++;
      }
    }
    logs.push(`Updated jabatan/divisi for ${pegUpdates} Pegawai.`);

    return NextResponse.json({ success: true, logs });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}