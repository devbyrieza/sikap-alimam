import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userRole = (session.role || "").toUpperCase();
    const isAuthorized = 
      userRole.includes("ADMIN") || 
      userRole.includes("MUDIR") || 
      userRole.includes("KEPALA_SEKOLAH") ||
      userRole.includes("KADIV_PENGASUHAN");

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Hanya Admin Super, Mudir, Kepala Sekolah, atau Kadiv Pengasuhan yang berhak mengubah status kesiswaan." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { santri_id, status_kesiswaan, tanggal_keluar, alasan_keluar, no_sk_keluar, catatan_keluar } = body;

    if (!santri_id || !status_kesiswaan) {
      return NextResponse.json({ error: "Santri ID dan Status Kesiswaan wajib diisi" }, { status: 400 });
    }

    const existingSantri = await prisma.santriAktif.findUnique({
      where: { id: santri_id },
      include: { kelas: true, orang_tua: { include: { user: true } } }
    });

    if (!existingSantri) {
      return NextResponse.json({ error: "Data santri tidak ditemukan." }, { status: 404 });
    }

    const isNowActive = status_kesiswaan === "aktif";
    const effectiveDate = isNowActive 
      ? null 
      : (tanggal_keluar ? new Date(tanggal_keluar) : new Date());

    // 1. Update SantriAktif
    const updatedSantri = await prisma.santriAktif.update({
      where: { id: santri_id },
      data: {
        status_kesiswaan,
        is_active: isNowActive,
        tanggal_keluar: effectiveDate,
        alasan_keluar: isNowActive ? null : (alasan_keluar || "Tidak ada keterangan"),
        no_sk_keluar: isNowActive ? null : (no_sk_keluar || null),
        catatan_keluar: isNowActive ? null : (catatan_keluar || null)
      },
      include: { kelas: true }
    });

    const syncLogs: string[] = [];

    // 2. Cascade Halaqoh: Jika dinonaktifkan, keluarkan dari kelompok halaqoh aktif
    if (!isNowActive) {
      const removedHalaqoh = await prisma.halaqohAnggota.deleteMany({
        where: { santri_id: santri_id }
      });
      syncLogs.push("Dikeluarkan dari " + removedHalaqoh.count + " kelompok halaqoh aktif.");
    }

    // 3. Cascade Akses Orang Tua / Wali Santri
    if (!isNowActive && existingSantri.orang_tua.length > 0) {
      for (const ot of existingSantri.orang_tua) {
        if (ot.user) {
          await prisma.user.update({
            where: { id: ot.user.id },
            data: {
              spp_access_blocked: true,
              spp_blocked_reason: "Santri berstatus: " + status_kesiswaan.toUpperCase().replace("_", " ")
            }
          });
        }
      }
      syncLogs.push("Akses portal Wali Santri dibekukan.");
    }

    // 4. Cascade PPDB & SAFINA Sync: Perbarui status di tabel Pendaftar jika ada
    try {
      const matchingPendaftar = await prisma.pendaftar.findFirst({
        where: {
          OR: [
            { nama_lengkap: { equals: existingSantri.nama_lengkap, mode: "insensitive" } },
            ...(existingSantri.nis ? [{ nisn: existingSantri.nis }] : [])
          ]
        }
      });

      if (matchingPendaftar) {
        await prisma.pendaftar.update({
          where: { id: matchingPendaftar.id },
          data: {
            status_pendaftaran: status_kesiswaan
          }
        });
        syncLogs.push("Status pendaftaran di database PPDB disinkronkan ke: " + status_kesiswaan);
      }
    } catch (ppdbErr) {
      console.warn("PPDB sync warning:", ppdbErr);
    }

    return NextResponse.json({
      success: true,
      message: "Status kesiswaan " + updatedSantri.nama_lengkap + " berhasil diubah menjadi: " + status_kesiswaan.toUpperCase().replace("_", " "),
      data: updatedSantri,
      syncLogs
    });

  } catch (error: any) {
    console.error("POST /api/master/santri/status error:", error);
    return NextResponse.json({ error: error.message || "Gagal mengubah status kesiswaan" }, { status: 500 });
  }
}
