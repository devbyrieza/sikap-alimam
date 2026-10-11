import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs: string[] = [];

    // 1. Create or Update User for Azzam
    const passwordHash = await bcrypt.hash('PAAS2026!', 10);
    const email = 'azzam@pesantren-alimam.com';
    const username = 'azzam';

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
          { nama: { contains: 'Azzam', mode: 'insensitive' } }
        ]
      }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          username,
          nama: 'Ust. Azzam Aghnia Ilman Azzauhari',
          role: 'MUSYRIF,GURU',
          password: passwordHash,
          plain_password: 'PAAS2026!',
          is_active: true,
        }
      });
      logs.push('Created User account: ' + user.email);
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          nama: 'Ust. Azzam Aghnia Ilman Azzauhari',
          username: user.username || username,
          role: user.role.includes('MUSYRIF') ? user.role : user.role + ',MUSYRIF',
          password: passwordHash,
          plain_password: 'PAAS2026!',
          is_active: true
        }
      });
      logs.push('Updated existing User: ' + user.email);
    }

    // 2. Create or Update Pegawai for Azzam
    let pegawai = await prisma.pegawai.findFirst({
      where: {
        OR: [
          { nik: '3205223112040001' },
          { user_id: user.id },
          { nama_lengkap: { contains: 'Azzam', mode: 'insensitive' } }
        ]
      }
    });

    const azzamMapel = "[IL] Tahsin Al-Qur'an, [IL] Nahwu, [11 MA] Tafsir, [12 MA] Tafsir, [11 MA] Nahwu";

    const pegawaiData = {
      nama_lengkap: 'Ust. Azzam Aghnia Ilman Azzauhari',
      nama_panggilan: 'Azzam',
      nik: '3205223112040001',
      no_hp: '082119136590',
      jenis_kelamin: 'L',
      tempat_lahir: 'Garut',
      tanggal_lahir: new Date('2004-12-31'),
      email: 'azzam@pesantren-alimam.com',
      kategori_pegawai: 'ASATIDZ,MUSYRIF',
      divisi: 'Kepengasuhan',
      jabatan: 'Pengasuh & Pengampu Halaqoh',
      mata_pelajaran: azzamMapel,
      unit_kerja: 'Pesantren Al-Imam',
      user_id: user.id
    };

    if (!pegawai) {
      pegawai = await prisma.pegawai.create({
        data: pegawaiData
      });
      logs.push('Created Pegawai record: ' + pegawai.nama_lengkap);
    } else {
      pegawai = await prisma.pegawai.update({
        where: { id: pegawai.id },
        data: pegawaiData
      });
      logs.push('Updated Pegawai record: ' + pegawai.nama_lengkap);
    }

    // 3. Ensure Kelas IL exists
    let classIL = await prisma.kelas.findFirst({
      where: {
        is_active: true,
        OR: [
          { nama: 'IL' },
          { jenjang: 'IL' },
          { nama: { contains: "I'dad", mode: "insensitive" } }
        ]
      }
    });

    if (!classIL) {
      classIL = await prisma.kelas.create({
        data: {
          nama: 'IL',
          jenjang: 'IL',
          is_active: true
        }
      });
      logs.push('Created Kelas IL');
    } else {
      logs.push(`Found Kelas IL (ID: ${classIL.id}, Nama: ${classIL.nama})`);
    }

    // 4. Sync Asatidz Mapel for Azzam (IL & MA)
    const { syncAsatidzMapel } = await import('@/lib/syncAsatidzMapel');
    await syncAsatidzMapel(pegawai.id, azzamMapel);
    logs.push('Synced asatidz_mapel for Ust. Azzam: ' + azzamMapel);

    const teacherAssignments = await prisma.asatidzmMapel.findMany({
      where: { pegawai_id: pegawai.id },
      include: { kelas: true, mapel: true }
    });
    logs.push(`Total relational assignments: ${teacherAssignments.length} (${teacherAssignments.map(a => `[${a.kelas.nama}] ${a.mapel.nama}`).join(', ')})`);

    // 5. Sync Halaqoh Groups for Azzam
    const groups = await prisma.halaqohKelompok.findMany();
    let updatedGroupsCount = 0;

    for (const g of groups) {
      if (
        g.nama_kelompok.toLowerCase().includes('azzam') ||
        g.nama_kelompok.toLowerCase().includes('imran') ||
        g.nama_kelompok.toLowerCase().includes('imron')
      ) {
        await prisma.halaqohKelompok.update({
          where: { id: g.id },
          data: {
            pegawai_id: pegawai.id,
            nama_kelompok: g.nama_kelompok
              .replace(/Imran Abdillah/gi, 'Azzam Aghnia Ilman')
              .replace(/Imron Abdillah/gi, 'Azzam Aghnia Ilman')
          }
        });
        updatedGroupsCount++;
      }
    }
    logs.push("Linked " + updatedGroupsCount + " Halaqoh groups to Ust. Azzam Aghnia Ilman Azzauhari");

    return NextResponse.json({
      success: true,
      message: 'Sinkronisasi data Azzam Aghnia Ilman Azzauhari di SIKAP berhasil!',
      logs,
      pegawai,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        nama: user.nama,
        role: user.role
      }
    });

  } catch (err: any) {
    console.error('Error syncing Azzam:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
