import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getRoleList } from "@/lib/waliAccess";
import { prosesKenaikanKelasOtomatis } from "@/lib/kenaikanKelasService";

export const dynamic = "force-dynamic";

function isAdminKenaikan(roles: string[]) {
  return roles.some((r) =>
    ["admin_super", "mudir", "kepala_sekolah", "kepala_kurikulum", "kadiv_kurikulum"].includes(r)
  );
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId || !isAdminKenaikan(getRoleList(session))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const tahunAjaranAsal = searchParams.get("tahun_asal") || "2026/2027";
    const tahunAjaranTujuan = searchParams.get("tahun_tujuan") || "2027/2028";

    const [preview, pengecualian, riwayat] = await Promise.all([
      prosesKenaikanKelasOtomatis({
        tahunAjaranAsal,
        tahunAjaranTujuan,
        dryRun: true,
      }),
      prisma.pengecualianKenaikanKelas.findMany({
        where: { tahun_ajaran_asal: tahunAjaranAsal },
        include: { santri: { select: { nama_lengkap: true, nis: true } } },
      }),
      prisma.riwayatKelasSantri.findMany({
        where: { tahun_ajaran: tahunAjaranTujuan },
        include: { santri: { select: { nama_lengkap: true, nis: true } } },
        orderBy: { created_at: "desc" },
        take: 100,
      }),
    ]);

    return NextResponse.json({ success: true, preview, pengecualian, riwayat });
  } catch (error) {
    console.error("GET /api/admin/kenaikan-kelas error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat pratinjau kenaikan kelas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId || !isAdminKenaikan(getRoleList(session))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { action, tahunAjaranAsal = "2026/2027", tahunAjaranTujuan = "2027/2028" } = body;

    if (action === "tambah_pengecualian") {
      const { santri_id, alasan } = body;
      if (!santri_id) {
        return NextResponse.json({ success: false, error: "santri_id wajib diisi" }, { status: 400 });
      }
      const saved = await prisma.pengecualianKenaikanKelas.upsert({
        where: {
          santri_id_tahun_ajaran_asal: {
            santri_id,
            tahun_ajaran_asal: tahunAjaranAsal,
          },
        },
        update: { alasan: alasan || "Tidak naik kelas (pengecualian manual)", created_by: session.userId },
        create: {
          santri_id,
          tahun_ajaran_asal: tahunAjaranAsal,
          alasan: alasan || "Tidak naik kelas (pengecualian manual)",
          created_by: session.userId,
        },
      });
      return NextResponse.json({ success: true, data: saved });
    }

    if (action === "hapus_pengecualian") {
      const { santri_id } = body;
      if (!santri_id) {
        return NextResponse.json({ success: false, error: "santri_id wajib diisi" }, { status: 400 });
      }
      await prisma.pengecualianKenaikanKelas.deleteMany({
        where: { santri_id, tahun_ajaran_asal: tahunAjaranAsal },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "proses") {
      const result = await prosesKenaikanKelasOtomatis({
        tahunAjaranAsal,
        tahunAjaranTujuan,
        dryRun: false,
      });
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ success: false, error: "Action tidak dikenali" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/admin/kenaikan-kelas error:", error);
    return NextResponse.json({ success: false, error: "Gagal memproses kenaikan kelas" }, { status: 500 });
  }
}
