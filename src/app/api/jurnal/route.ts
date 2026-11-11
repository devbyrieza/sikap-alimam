import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseDateOnlyUTC(raw: string): Date | null {
  const match = String(raw || "").match(/^\d{4}-\d{2}-\d{2}/);
  if (!match) return null;
  const iso = match[0];
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return dt;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tanggal = searchParams.get("tanggal");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");
    const kelas_id = searchParams.get("kelas_id");
    const pegawai_id = searchParams.get("pegawai_id");

    const where: Record<string, unknown> = {};
    if (tanggal) {
      const start = parseDateOnlyUTC(tanggal);
      if (start) {
        const end = new Date(start.getTime() + 86_399_999);
        where.tanggal = { gte: start, lte: end };
      }
    } else if (start_date || end_date) {
      const range: Record<string, Date> = {};
      if (start_date) {
        const s = parseDateOnlyUTC(start_date);
        if (s) range.gte = s;
      }
      if (end_date) {
        const e = parseDateOnlyUTC(end_date);
        if (e) range.lte = new Date(e.getTime() + 86_399_999);
      }
      if (Object.keys(range).length > 0) {
        where.tanggal = range;
      }
    }

    if (kelas_id && kelas_id !== "all") {
      where.kelas_id = kelas_id;
    }
    if (pegawai_id && pegawai_id !== "all") {
      where.pegawai_id = pegawai_id;
    }

    const jurnal = await prisma.jurnalMengajar.findMany({
      where,
      orderBy: [{ tanggal: "desc" }, { created_at: "desc" }],
      include: {
        pegawai: { select: { id: true, nama_lengkap: true } },
        mapel: { select: { id: true, nama: true } },
        kelas: { select: { id: true, nama: true, jenjang: true } },
      },
    });

    return NextResponse.json({ data: jurnal });
  } catch (err) {
    console.error("[GET /api/jurnal]", err);
    return NextResponse.json(
      { error: "Gagal mengambil data jurnal" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      pegawai_id,
      mapel_id,
      kelas_id,
      tanggal,
      jam_ke,
      materi,
      sub_materi,
      learning_outcome,
      kegiatan,
      catatan,
      nama_mapel_custom,
    } = body;

    let finalMapelId = mapel_id;

    if (!finalMapelId && nama_mapel_custom) {
      const cleanName = String(nama_mapel_custom).trim();
      const existing = await prisma.mataPelajaran.findFirst({
        where: {
          nama: { equals: cleanName, mode: "insensitive" },
          kelas_id,
        },
      });
      if (existing) {
        finalMapelId = existing.id;
      } else {
        const newMapel = await prisma.mataPelajaran.create({
          data: { nama: cleanName, kelas_id, is_active: true },
        });
        finalMapelId = newMapel.id;
      }
    }

    const tanggalDate = parseDateOnlyUTC(String(tanggal || ""));
    if (
      !pegawai_id ||
      !finalMapelId ||
      !kelas_id ||
      !tanggalDate ||
      !materi ||
      !kegiatan
    ) {
      return NextResponse.json(
        { error: "Field wajib tidak lengkap atau tanggal tidak valid" },
        { status: 400 },
      );
    }

    const jamNormalized = Array.isArray(jam_ke)
      ? jam_ke
          .map((x) => String(x).trim())
          .filter(Boolean)
          .join(", ") || null
      : jam_ke
        ? String(jam_ke).trim()
        : null;

    const jurnal = await prisma.jurnalMengajar.create({
      data: {
        pegawai_id,
        mapel_id: finalMapelId,
        kelas_id,
        tanggal: tanggalDate,
        jam_ke: jamNormalized,
        materi: String(materi).trim(),
        sub_materi: sub_materi ? String(sub_materi).trim() : null,
        learning_outcome: learning_outcome
          ? String(learning_outcome).trim()
          : null,
        kegiatan: String(kegiatan).trim(),
        catatan: catatan ? String(catatan).trim() : null,
      },
    });

    return NextResponse.json({ data: jurnal }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/jurnal]", err);
    return NextResponse.json(
      { error: "Gagal menyimpan jurnal" },
      { status: 500 },
    );
  }
}
