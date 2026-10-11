import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OFFICIAL_SANTRI_LIST, getOfficialNis, getOfficialNisn } from '@/lib/officialSantri';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs: any[] = [];

    // 1. Ambil semua santri yang ada di database saat ini
    const allDbSantri = await prisma.santriAktif.findMany({
      include: { kelas: true }
    });

    // 2. Untuk menghindari bentrok unique constraint `nis` dan `nisn`:
    //    Ubah dulu semua NIS dan NISN ke temporary prefix
    for (const s of allDbSantri) {
      await prisma.santriAktif.update({
        where: { id: s.id },
        data: {
          nis: s.nis ? `TMP_${s.id.substring(0, 8)}_${s.nis}` : null,
          nisn: s.nisn ? `TMP_${s.id.substring(0, 8)}_${s.nisn}` : null,
        }
      });
    }

    // 3. Update atau sinkronkan setiap santri dengan data resmi dari Excel
    for (const official of OFFICIAL_SANTRI_LIST) {
      // Cari santri di DB: prioritaskan exact match, baru substring
      const officialClean = official.nama.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matched = allDbSantri.find(dbS => {
        const dbClean = dbS.nama_lengkap.toLowerCase().replace(/[^a-z0-9]/g, '');
        return dbClean === officialClean;
      }) || allDbSantri.find(dbS => {
        const dbClean = dbS.nama_lengkap.toLowerCase().replace(/[^a-z0-9]/g, '');
        return dbClean.includes(officialClean) || officialClean.includes(dbClean);
      });

      if (matched) {
        await prisma.santriAktif.update({
          where: { id: matched.id },
          data: {
            nis: official.nis,
            nisn: official.nisn || null,
            nama_lengkap: official.nama,
            jenis_kelamin: official.jk
          }
        });
        logs.push({
          status: 'UPDATED',
          nama: official.nama,
          oldNis: matched.nis,
          newNis: official.nis,
          newNisn: official.nisn,
          kelas: official.kelas
        });
      } else {
        // Cari kelas ID yang sesuai
        const kelasObj = await prisma.kelas.findFirst({
          where: {
            OR: [
              { nama: official.kelas },
              { nama: { contains: official.kelas, mode: 'insensitive' } }
            ]
          }
        });

        if (kelasObj) {
          const created = await prisma.santriAktif.create({
            data: {
              nis: official.nis,
              nisn: official.nisn || null,
              nama_lengkap: official.nama,
              kelas_id: kelasObj.id,
              jenis_kelamin: official.jk,
              is_active: true
            }
          });
          logs.push({
            status: 'CREATED',
            nama: official.nama,
            nis: official.nis,
            nisn: official.nisn,
            kelas: official.kelas
          });
        } else {
          logs.push({
            status: 'SKIPPED_NO_KELAS',
            nama: official.nama,
            kelas: official.kelas
          });
        }
      }
    }

    // Kembalikan santri yang mungkin tidak ada di daftar official ke NIS/NISN awal (hilangkan TMP_)
    const remainingNis = await prisma.santriAktif.findMany({
      where: { nis: { startsWith: 'TMP_' } }
    });
    for (const rem of remainingNis) {
      const orig = rem.nis?.replace(/^TMP_[^_]+_/, '') || null;
      try {
        await prisma.santriAktif.update({
          where: { id: rem.id },
          data: { nis: orig }
        });
      } catch (e) {
        // Abaikan jika bentrok
      }
    }

    const remainingNisn = await prisma.santriAktif.findMany({
      where: { nisn: { startsWith: 'TMP_' } }
    });
    for (const rem of remainingNisn) {
      const orig = rem.nisn?.replace(/^TMP_[^_]+_/, '') || null;
      try {
        await prisma.santriAktif.update({
          where: { id: rem.id },
          data: { nisn: orig }
        });
      } catch (e) {
        // Abaikan jika bentrok
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menyinkronkan NIS santri Al-Imam dengan data resmi Excel (03_Data_Santri_Fix & Gelombang 2)!`,
      totalOfficial: OFFICIAL_SANTRI_LIST.length,
      syncedCount: logs.filter(l => l.status === 'UPDATED' || l.status === 'CREATED').length,
      details: logs
    });

  } catch (error: any) {
    console.error('Error syncing NIS:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
