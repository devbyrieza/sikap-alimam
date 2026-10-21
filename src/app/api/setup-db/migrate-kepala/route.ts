import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs: string[] = [];

    // 1. Update roles in Users (KADIV -> KEPALA)
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { role: { contains: 'KADIV', mode: 'insensitive' } },
          { role: { contains: 'KABID', mode: 'insensitive' } },
        ]
      }
    });

    let userUpdates = 0;
    for (const u of users) {
      let newRole = u.role
        .replace(/KADIV/gi, 'KEPALA')
        .replace(/KABID/gi, 'KEPALA')
        .toUpperCase();

      if (newRole !== u.role) {
        await prisma.user.update({
          where: { id: u.id },
          data: { role: newRole }
        });
        logs.push(`User ${u.nama} role changed: ${u.role} -> ${newRole}`);
        userUpdates++;
      }
    }
    logs.push(`Updated roles for ${userUpdates} Users.`);

    // 2. Update Pegawai jabatan and kategori_pegawai
    const pegawais = await prisma.pegawai.findMany({
      where: {
        OR: [
          { jabatan: { contains: 'Kadiv', mode: 'insensitive' } },
          { jabatan: { contains: 'Kabid', mode: 'insensitive' } },
          { jabatan: { contains: 'Kepala Divisi', mode: 'insensitive' } },
          { kategori_pegawai: { contains: 'KADIV', mode: 'insensitive' } },
          { kategori_pegawai: { contains: 'KABID', mode: 'insensitive' } },
        ]
      }
    });

    let pegUpdates = 0;
    for (const p of pegawais) {
      const updateData: any = {};

      if (p.jabatan) {
        let newJabatan = p.jabatan
          .replace(/Kadiv Kurikulum/gi, 'Kepala Kurikulum')
          .replace(/Kadiv Kepengasuhan/gi, 'Kepala Pengasuhan')
          .replace(/Kadiv Pengasuhan/gi, 'Kepala Pengasuhan')
          .replace(/Kepala Kepengasuhan/gi, 'Kepala Pengasuhan')
          .replace(/Kadiv Asrama/gi, 'Kepala Asrama')
          .replace(/Kadiv Kedisiplinan/gi, 'Kepala Kedisiplinan')
          .replace(/Kepala Divisi Keuangan/gi, 'Kepala Keuangan')
          .replace(/Kadiv/gi, 'Kepala')
          .replace(/Kabid/gi, 'Kepala');

        if (newJabatan !== p.jabatan) {
          updateData.jabatan = newJabatan;
        }
      }

      if (p.kategori_pegawai) {
        let newKategori = p.kategori_pegawai
          .replace(/KADIV/gi, 'KEPALA')
          .replace(/KABID/gi, 'KEPALA');
        if (newKategori !== p.kategori_pegawai) {
          updateData.kategori_pegawai = newKategori;
        }
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.pegawai.update({
          where: { id: p.id },
          data: updateData
        });
        logs.push(`Pegawai ${p.nama_lengkap} updated: ${JSON.stringify(updateData)}`);
        pegUpdates++;
      }
    }
    logs.push(`Updated jabatan/kategori for ${pegUpdates} Pegawai.`);

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
