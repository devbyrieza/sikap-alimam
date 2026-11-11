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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
    const resolvedParams = await params;

    let finalMapelId = mapel_id;
    if (!finalMapelId && nama_mapel_custom && kelas_id) {
      const cleanName = String(nama_mapel_custom).trim();
      if (cleanName) {
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
    }

    const tanggalDate = tanggal ? parseDateOnlyUTC(String(tanggal)) : undefined;
    if (tanggal && !tanggalDate) {
      return NextResponse.json(
        { error: "Format tanggal tidak valid" },
        { status: 400 },
      );
    }

    if (!finalMapelId) {
      return NextResponse.json(
        { error: "Mata pelajaran wajib dipilih atau diisi" },
        { status: 400 },
      );
    }

    const jamNormalized =
      jam_ke === undefined
        ? undefined
        : Array.isArray(jam_ke)
          ? jam_ke
              .map((x) => String(x).trim())
              .filter(Boolean)
              .join(", ") || null
          : jam_ke
            ? String(jam_ke).trim()
            : null;

    const jurnal = await prisma.jurnalMengajar.update({
      where: { id: resolvedParams.id },
      data: {
        pegawai_id,
        mapel_id: finalMapelId,
        kelas_id,
        tanggal: tanggalDate ?? undefined,
        jam_ke: jamNormalized,
        materi: materi !== undefined ? String(materi).trim() : undefined,
        sub_materi: sub_materi ? String(sub_materi).trim() : null,
        learning_outcome: learning_outcome
          ? String(learning_outcome).trim()
          : null,
        kegiatan: kegiatan !== undefined ? String(kegiatan).trim() : undefined,
        catatan: catatan ? String(catatan).trim() : null,
      },
    });

    return NextResponse.json({ data: jurnal }, { status: 200 });
  } catch (err) {
    console.error("[PATCH /api/jurnal]", err);
    return NextResponse.json(
      { error: "Gagal memperbarui jurnal" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    await prisma.jurnalMengajar.delete({
      where: { id: resolvedParams.id },
    });
    return NextResponse.json(
      { message: "Jurnal berhasil dihapus" },
      { status: 200 },
    );
  } catch (err) {
    console.error("[DELETE /api/jurnal]", err);
    return NextResponse.json(
      { error: "Gagal menghapus jurnal" },
      { status: 500 },
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const jurnal = await prisma.jurnalMengajar.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!jurnal) {
      return NextResponse.json(
        { error: "Jurnal tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: jurnal }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/jurnal]", err);
    return NextResponse.json(
      { error: "Gagal mengambil jurnal" },
      { status: 500 },
    );
  }
}
