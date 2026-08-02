import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PresensiAsatidz from './PresensiAsatidz';

export const dynamic = 'force-dynamic';

export type PresensiItem = {
  id: string;
  pegawai_id: string;
  tanggal: Date;
  jam_masuk: Date | null;
  jam_keluar: Date | null;
  status: string;
  metode: string;
  lat: number | null;
  lng: number | null;
  foto_url: string | null;
  keterangan: string | null;
  pegawai: { id: string; nama_lengkap: string; jabatan: string | null };
};

export default async function PresensiAsatidz_Page() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const userRole = (session.role || '').toLowerCase().trim();
  const allowedRoles = ['admin', 'admin_super', 'mudir'];
  if (!allowedRoles.includes(userRole)) {
    redirect('/dashboard');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Data presensi hari ini
  const presensi = await prisma.presensiAsatidz.findMany({
    where: { tanggal: today },
    include: {
      pegawai: { select: { id: true, nama_lengkap: true, jabatan: true } },
    },
    orderBy: { jam_masuk: 'asc' },
  });

  const guruWhere = {
    OR: [
      { kategori_pegawai: { in: ["ASATIDZ", "GURU", "Guru", "asatidz", "guru", "PENGAJAR"] } },
      { kategori_pegawai: { contains: "ASATIDZ", mode: "insensitive" as const } },
      { kategori_pegawai: { contains: "GURU", mode: "insensitive" as const } },
      { jabatan: { contains: "Guru", mode: "insensitive" as const } },
      { jabatan: { contains: "Pengajar", mode: "insensitive" as const } },
      { mata_pelajaran: { not: null } },
    ],
  };

  // Asatidz yang belum absen
  const sudahAbsen = presensi.map((p) => p.pegawai_id);
  let belumAbsen = await prisma.pegawai.findMany({
    where: {
      ...guruWhere,
      id: sudahAbsen.length > 0 ? { notIn: sudahAbsen } : undefined,
    },
    select: { id: true, nama_lengkap: true, jabatan: true },
    orderBy: { nama_lengkap: 'asc' },
  });

  // Token hari ini
  const token = await prisma.tokenHarian.findUnique({
    where: { tanggal: today },
  });

  // Semua asatidz untuk modal input manual
  let allAsatidz = await prisma.pegawai.findMany({
    where: guruWhere,
    select: { id: true, nama_lengkap: true },
    orderBy: { nama_lengkap: 'asc' },
  });

  if (allAsatidz.length === 0) {
    allAsatidz = await prisma.pegawai.findMany({
      select: { id: true, nama_lengkap: true },
      orderBy: { nama_lengkap: 'asc' },
    });
    belumAbsen = allAsatidz.filter(a => !sudahAbsen.includes(a.id)).map(a => ({ ...a, jabatan: null }));
  }

  return (
    <PresensiAsatidz
      presensiHariIni={presensi as PresensiItem[]}
      belumAbsen={belumAbsen}
      tokenHariIni={
        token
          ? {
              token: token.token,
              expires_at: token.expires_at.toISOString(),
            }
          : null
      }
      allAsatidz={allAsatidz}
      tanggal={today.toISOString()}
    />
  );
}
