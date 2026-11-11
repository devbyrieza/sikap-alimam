import { NextResponse } from "next/server";
import { getLiveSession } from "@/lib/auth";
import { syncScheduleFromPDF } from "@/lib/syncScheduleFromPDF";

export const dynamic = "force-dynamic";

async function canSyncSchedule() {
  const session = await getLiveSession();
  if (!session) return { allowed: false, status: 401 as const };
  const roleStr = (session.role || "").toLowerCase();
  const namaStr = (session.nama || "").toLowerCase();
  const allowed =
    roleStr.includes("admin_super") ||
    roleStr.includes("mudir") ||
    roleStr.includes("kepala_sekolah") ||
    roleStr.includes("kepala_kurikulum") ||
    roleStr.includes("kadiv_kurikulum") ||
    namaStr.includes("imron");
  return {
    allowed,
    status: allowed ? (200 as const) : (403 as const),
  };
}

export async function GET() {
  return executeSync();
}

export async function POST() {
  return executeSync();
}

async function executeSync() {
  try {
    const auth = await canSyncSchedule();
    if (!auth.allowed) {
      return NextResponse.json(
        {
          error:
            auth.status === 401
              ? "Unauthorized"
              : "Akses ditolak. Khusus Admin Super, Mudir, Kepala Sekolah, dan Kepala Kurikulum.",
        },
        { status: auth.status },
      );
    }

    const result = await syncScheduleFromPDF({
      force: true,
      syncTeacherSubjects: true,
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil menyinkronkan ${result.countCreated} dari ${result.totalTemplate} jadwal pelajaran resmi!`,
      countCreated: result.countCreated,
      totalTemplate: result.totalTemplate,
      skippedEntries: result.skippedEntries,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal sync jadwal";
    console.error("Error syncing schedule:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
