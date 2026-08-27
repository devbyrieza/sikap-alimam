import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let logs = [];

    // 1. Cari atau buat Azzam Aghnia Ilman
    let azzam = await prisma.pegawai.findFirst({
      where: { nama_lengkap: { contains: 'Azzam Aghnia Ilman', mode: 'insensitive' } }
    });
    
    if (!azzam) {
      azzam = await prisma.pegawai.create({
        data: {
          nama_lengkap: 'Ust. Azzam Aghnia Ilman',
          jenis_kelamin: 'L',
          kategori_pegawai: 'ASATIDZ',
          jabatan: 'Pengasuh & Pengampu Halaqoh'
        }
      });
      logs.push('Created new Pengampu Halaqoh: Azzam Aghnia Ilman');
    } else {
      logs.push('Found existing Azzam: ' + azzam.nama_lengkap);
    }

    // 2. Cari Imron Abdillah
    const imron = await prisma.pegawai.findFirst({
      where: { nama_lengkap: { contains: 'imran abdillah', mode: 'insensitive' } }
    }) || await prisma.pegawai.findFirst({
      where: { nama_lengkap: { contains: 'imron abdillah', mode: 'insensitive' } }
    });
    
    if (!imron) throw new Error('Imron Abdillah not found in database');
    logs.push('Found Imron: ' + imron.nama_lengkap);

    // 3. Cari Wahyudi Pranata
    const wahyudi = await prisma.pegawai.findFirst({
      where: { nama_lengkap: { contains: 'wahyudi pranata', mode: 'insensitive' } }
    }) || await prisma.pegawai.findFirst({
      where: { nama_lengkap: { contains: 'wahyudi', mode: 'insensitive' } }
    });

    if (!wahyudi) throw new Error('Wahyudi not found in database');
    logs.push('Found Wahyudi: ' + wahyudi.nama_lengkap);

    // ACTION 1: Pindahkan semua kelompok Imron ke Azzam
    const kelompokImron = await prisma.halaqohKelompok.findMany({
      where: { pegawai_id: imron.id }
    });

    let countImronToAzzam = 0;
    for (const kel of kelompokImron) {
      await prisma.halaqohKelompok.update({
        where: { id: kel.id },
        data: {
          pegawai_id: azzam.id,
          nama_kelompok: kel.nama_kelompok.replace(/Imran Abdillah/i, 'Azzam Aghnia Ilman').replace(/Imron Abdillah/i, 'Azzam Aghnia Ilman')
        }
      });
      countImronToAzzam++;
    }
    logs.push(`Moved ${countImronToAzzam} groups from Imron to Azzam`);

    // ACTION 2: Pindahkan kelompok Wahyudi SESI MAGHRIB ke Imron
    const kelompokWahyudiMaghrib = await prisma.halaqohKelompok.findMany({
      where: {
        pegawai_id: wahyudi.id,
        sesi: 'maghrib'
      }
    });

    let countWahyudiToImron = 0;
    for (const kel of kelompokWahyudiMaghrib) {
      await prisma.halaqohKelompok.update({
        where: { id: kel.id },
        data: {
          pegawai_id: imron.id,
          nama_kelompok: kel.nama_kelompok.replace(/Wahyudi/i, 'Imran Abdillah') // Rename to show it belongs to Imron now
        }
      });
      countWahyudiToImron++;
    }
    logs.push(`Moved ${countWahyudiToImron} Maghrib groups from Wahyudi to Imron`);

    return NextResponse.json({ success: true, logs });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}