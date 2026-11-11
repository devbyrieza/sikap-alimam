import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLiveSession } from "@/lib/auth";
import { syncScheduleFromPDF } from "@/lib/syncScheduleFromPDF";

const DAY_ORDER: Record<string, number> = {
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
  sabtu: 6,
  ahad: 7,
  minggu: 7,
};

const DEFAULT_BELL_TIMES: Record<number, { mulai: string; selesai: string }> = {
  1: { mulai: "04:50", selesai: "05:30" },
  2: { mulai: "05:30", selesai: "06:10" },
  3: { mulai: "07:00", selesai: "07:40" },
  4: { mulai: "07:40", selesai: "08:20" },
  5: { mulai: "08:20", selesai: "09:00" },
  6: { mulai: "09:00", selesai: "09:40" },
  7: { mulai: "10:00", selesai: "10:40" },
  8: { mulai: "10:40", selesai: "11:20" },
  9: { mulai: "11:20", selesai: "12:00" },
};

async function canManageKurikulum() {
  const session = await getLiveSession();
  if (!session) return { allowed: false, status: 401 as const };
  const roleStr = (session.role || "").toLowerCase();
  const namaStr = (session.nama || "").toLowerCase();
  const isAllowed =
    roleStr.includes("admin_super") ||
    roleStr.includes("mudir") ||
    roleStr.includes("kepala_sekolah") ||
    roleStr.includes("kepala_kurikulum") ||
    roleStr.includes("kadiv_kurikulum") ||
    namaStr.includes("imron");
  return { allowed: isAllowed, status: isAllowed ? (200 as const) : (403 as const) };
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const kelas_id = searchParams.get("kelas_id");
  const pegawai_id = searchParams.get("pegawai_id");
  const hari = searchParams.get("hari");
  const tipe_pekan = searchParams.get("tipe_pekan"); // 'all' | 'semua' | 'ganjil' | 'genap'

  try {
    await syncScheduleFromPDF().catch(() => {});

    const whereClause: Record<string, unknown> = {};

    if (kelas_id && kelas_id !== "all") whereClause.kelas_id = kelas_id;
    if (pegawai_id && pegawai_id !== "all") whereClause.pegawai_id = pegawai_id;
    if (hari && hari !== "all") {
      whereClause.hari = { equals: hari, mode: "insensitive" };
    }

    if (tipe_pekan && tipe_pekan !== "all" && tipe_pekan !== "semua") {
      whereClause.OR = [{ tipe_pekan: "semua" }, { tipe_pekan }];
    }

    const jadwal = await prisma.jadwalPelajaran.findMany({
      where: whereClause,
      include: {
        kelas: { select: { id: true, nama: true, jenjang: true } },
        pegawai: { select: { id: true, nama_lengkap: true, jabatan: true } },
        mapel: { select: { id: true, nama: true, kategori: true } },
      },
      orderBy: [{ jam_ke: "asc" }],
    });

    const sorted = [...jadwal].sort((a, b) => {
      const da = DAY_ORDER[a.hari.toLowerCase()] ?? 99;
      const db = DAY_ORDER[b.hari.toLowerCase()] ?? 99;
      if (da !== db) return da - db;
      if (a.jam_ke !== b.jam_ke) return a.jam_ke - b.jam_ke;
      return (a.kelas?.nama || "").localeCompare(b.kelas?.nama || "", "id");
    });

    return NextResponse.json(sorted);
  } catch (error) {
    console.error("Error fetching jadwal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await canManageKurikulum();
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? "Unauthorized" : "Forbidden" }, { status: auth.status });
    }

    const body = await req.json();
    const { hari, jam_ke, waktu_mulai, waktu_selesai, kelas_id, pegawai_id, mapel_id, tipe_pekan } = body;

    const jamInt = Number.parseInt(String(jam_ke), 10);
    if (!hari || !Number.isFinite(jamInt) || !kelas_id || !pegawai_id || !mapel_id) {
      return NextResponse.json({ error: "Hari, Jam Ke, Kelas, Guru, dan Mapel wajib diisi" }, { status: 400 });
    }

    let mulai = String(waktu_mulai || "").trim();
    let selesai = String(waktu_selesai || "").trim();
    if (!mulai || !selesai) {
      const sesi = await prisma.masterSesiWaktu.findUnique({ where: { jam_ke: jamInt } }).catch(() => null);
      mulai = sesi?.waktu_mulai || DEFAULT_BELL_TIMES[jamInt]?.mulai || "07:00";
      selesai = sesi?.waktu_selesai || DEFAULT_BELL_TIMES[jamInt]?.selesai || "07:40";
    }

    const normalizedTipe = ["ganjil", "genap", "semua"].includes(String(tipe_pekan || "").toLowerCase())
      ? String(tipe_pekan).toLowerCase()
      : "semua";

    const duplicate = await prisma.jadwalPelajaran.findFirst({
      where: {
        hari: { equals: String(hari).trim(), mode: "insensitive" },
        jam_ke: jamInt,
        kelas_id: String(kelas_id),
        OR:
          normalizedTipe === "semua"
            ? [{ tipe_pekan: "semua" }, { tipe_pekan: "ganjil" }, { tipe_pekan: "genap" }]
            : [{ tipe_pekan: "semua" }, { tipe_pekan: normalizedTipe }],
      },
      include: { pegawai: { select: { nama_lengkap: true } }, mapel: { select: { nama: true } } },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          error: `Bentrok jadwal pada ${hari} Jam ke-${jamInt}: sudah terisi ${duplicate.mapel?.nama || "Mapel"} (${duplicate.pegawai?.nama_lengkap || "Guru"}) [${duplicate.tipe_pekan}]`,
        },
        { status: 409 },
      );
    }

    const created = await prisma.jadwalPelajaran.create({
      data: {
        hari: String(hari).trim(),
        jam_ke: jamInt,
        waktu_mulai: mulai,
        waktu_selesai: selesai,
        kelas_id: String(kelas_id),
        pegawai_id: String(pegawai_id),
        mapel_id: String(mapel_id),
        tipe_pekan: normalizedTipe,
      },
      include: {
        kelas: { select: { id: true, nama: true, jenjang: true } },
        pegawai: { select: { id: true, nama_lengkap: true, jabatan: true } },
        mapel: { select: { id: true, nama: true, kategori: true } },
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating jadwal:", error);
    return NextResponse.json({ error: "Gagal menambahkan jadwal pelajaran" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await canManageKurikulum();
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.status === 401 ? "Unauthorized" : "Forbidden" }, { status: auth.status });
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID jadwal wajib disertakan" }, { status: 400 });
    }

    await prisma.jadwalPelajaran.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting jadwal:", error);
    return NextResponse.json({ error: "Gagal menghapus jadwal pelajaran" }, { status: 500 });
  }
}
