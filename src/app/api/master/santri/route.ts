import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: Ambil daftar santri dengan filter kelas, status_kesiswaan, dan pencarian
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const kelas_id = searchParams.get("kelas_id");
    const status = searchParams.get("status"); // 'all' | 'aktif' | 'dikeluarkan' | 'mengundurkan_diri' | 'mutasi' | 'lulus'
    const q = searchParams.get("q")?.trim();

    const whereClause: any = {};

    if (kelas_id && kelas_id !== "all") {
      whereClause.kelas_id = kelas_id;
    }

    if (status && status !== "all") {
      whereClause.status_kesiswaan = status;
    }

    if (q) {
      whereClause.OR = [
        { nama_lengkap: { contains: q, mode: "insensitive" } },
        { nis: { contains: q, mode: "insensitive" } }
      ];
    }

    const [santriList, totalCount, activeCount, keluarCount, mutasiCount, doCount] = await Promise.all([
      prisma.santriAktif.findMany({
        where: whereClause,
        include: {
          kelas: { select: { id: true, nama: true, jenjang: true } },
          halaqoh_anggota: {
            where: { is_active: true },
            include: {
              kelompok: {
                select: { id: true, nama_kelompok: true, sesi: true, pegawai: { select: { nama_lengkap: true } } }
              }
            }
          }
        },
        orderBy: [{ kelas: { nama: "asc" } }, { nama_lengkap: "asc" }]
      }),
      prisma.santriAktif.count(),
      prisma.santriAktif.count({ where: { status_kesiswaan: "aktif" } }),
      prisma.santriAktif.count({ where: { status_kesiswaan: "mengundurkan_diri" } }),
      prisma.santriAktif.count({ where: { status_kesiswaan: "mutasi" } }),
      prisma.santriAktif.count({ where: { status_kesiswaan: "dikeluarkan" } })
    ]);

    return NextResponse.json({
      success: true,
      data: santriList,
      stats: {
        total: totalCount,
        aktif: activeCount,
        mengundurkan_diri: keluarCount,
        mutasi: mutasiCount,
        dikeluarkan: doCount
      }
    });
  } catch (error: any) {
    console.error("GET /api/master/santri error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// POST: Tambah Santri Baru
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { nis, nama_lengkap, kelas_id, jenis_kelamin, foto_url } = body;

    if (!nama_lengkap || !kelas_id) {
      return NextResponse.json({ error: "Nama lengkap dan Kelas wajib diisi" }, { status: 400 });
    }

    const newSantri = await prisma.santriAktif.create({
      data: {
        nis: nis || null,
        nama_lengkap: nama_lengkap.trim(),
        kelas_id,
        jenis_kelamin: jenis_kelamin || "L",
        foto_url: foto_url || null,
        status_kesiswaan: "aktif",
        is_active: true
      },
      include: { kelas: true }
    });

    return NextResponse.json({ success: true, data: newSantri }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/master/santri error:", error);
    return NextResponse.json({ error: error.message || "Gagal menambahkan santri" }, { status: 500 });
  }
}
