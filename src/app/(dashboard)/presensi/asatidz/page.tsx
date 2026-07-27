import { prisma } from '@/lib/prisma';
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

  // Asatidz yang belum absen
  const sudahAbsen = presensi.map((p) => p.pegawai_id);
  const belumAbsen = await prisma.pegawai.findMany({
    where: {
      kategori_pegawai: { contains: "GURU" },
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
  const allAsatidz = await prisma.pegawai.findMany({
    where: {
      kategori_pegawai: { contains: "GURU" } },
    select: { id: true, nama_lengkap: true },
    orderBy: { nama_lengkap: 'asc' },
  });

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
