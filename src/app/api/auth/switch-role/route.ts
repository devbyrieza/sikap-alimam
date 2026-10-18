import { NextRequest, NextResponse } from "next/server";
import { getLiveSession, createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const ROLE_DESTINATIONS: Record<string, string> = {
  ADMIN_SUPER: "/dashboard",
  ADMIN_KEUANGAN: "/keuangan",
  KADIV_KURIKULUM: "/jurnal",
  KADIV_PENGASUHAN: "/halaqoh",
  WALI_KELAS: "/wali-kelas",
  GURU: "/jurnal",
  MUSYRIF: "/halaqoh",
  WALI_SANTRI: "/wali",
};

export const AVAILABLE_SWITCH_ROLES = [
  {
    role: "ADMIN_SUPER",
    label: "Admin Super",
    pejabat: "Administrator Sistem",
    deskripsi: "Akses penuh seluruh konfigurasi, master data, dan kendali sistem",
  },
  {
    role: "ADMIN_KEUANGAN",
    label: "Admin Keuangan",
    pejabat: "Ustadz Maulidin Bachtiar",
    deskripsi: "Kelola SPP, verifikasi bukti transfer, dan kendali portal santri",
  },
  {
    role: "KADIV_KURIKULUM",
    label: "Kadiv Kurikulum",
    pejabat: "Ustadz Agus Cahyono, S.Pd.",
    deskripsi: "Kepala Madrasah, monitoring jurnal mengajar, dan kurikulum",
  },
  {
    role: "KADIV_PENGASUHAN",
    label: "Kadiv Pengasuhan",
    pejabat: "Ustadz Wahab Rajasam, M.Pd.",
    deskripsi: "Mudir & Kepala Divisi Pengasuhan, halaqoh, ibadah, dan kedisiplinan",
  },
  {
    role: "WALI_KELAS",
    label: "Wali Kelas",
    pejabat: "Ustadz Imron Fathillah, S.Pd.",
    deskripsi: "Wali Kelas IL / 7 MTs, pantau nilai, presensi, dan rapor kelas",
  },
  {
    role: "GURU",
    label: "Guru Mapel",
    pejabat: "Ustadz Abdil Aziz, S.Pd.",
    deskripsi: "Asatidz pengampu pelajaran, input jurnal, presensi, dan nilai",
  },
  {
    role: "MUSYRIF",
    label: "Pengampu Halaqoh",
    pejabat: "Ustadz Muhammad Iqbal, S.Pd.",
    deskripsi: "Musyrif tahfidz Al-Qur'an, setoran mutabaah, dan ujian tahfidz",
  },
  {
    role: "WALI_SANTRI",
    label: "Portal Wali Santri",
    pejabat: "Wali Santri Al-Imam",
    deskripsi: "Akses laporan rapor, akademik, setoran halaqoh, dan tagihan SPP",
  },
];

export async function GET() {
  try {
    const session = await getLiveSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentRoleUpper = (session.role || "").toUpperCase();
    const originalRoleUpper = (session.originalRole || "").toUpperCase();
    const isSuperOrSwitched =
      currentRoleUpper === "ADMIN_SUPER" ||
      originalRoleUpper === "ADMIN_SUPER" ||
      currentRoleUpper === "MUDIR";

    return NextResponse.json({
      success: true,
      canSwitch: isSuperOrSwitched,
      currentRole: session.role,
      originalRole: session.originalRole || null,
      originalNama: session.originalNama || null,
      roles: AVAILABLE_SWITCH_ROLES,
    });
  } catch (error: any) {
    console.error("GET /api/auth/switch-role error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getLiveSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { target_role, switch_back } = body;

    const currentRoleUpper = (session.role || "").toUpperCase();
    const originalRoleUpper = (session.originalRole || "").toUpperCase();
    const isSuperOrSwitched =
      currentRoleUpper === "ADMIN_SUPER" ||
      originalRoleUpper === "ADMIN_SUPER" ||
      currentRoleUpper === "MUDIR";

    if (!isSuperOrSwitched && !session.originalRole) {
      return NextResponse.json(
        { error: "Fitur beralih akun hanya diizinkan untuk Admin Super dan peran berwewenang." },
        { status: 403 }
      );
    }

    // Alur 1: KEMBALI KE AKUN UTAMA (Switch Back)
    if (switch_back) {
      const restoredRole = session.originalRole || "ADMIN_SUPER";
      const restoredUserId = session.originalUserId || session.userId;
      const restoredNama = session.originalNama || "Administrator Sistem";

      // Cari user asli di database untuk mengembalikan email/profil lengkap
      const originalUser = await prisma.user.findUnique({
        where: { id: restoredUserId },
        include: { pegawai: true },
      });

      const updatedPayload = {
        userId: originalUser?.id || restoredUserId,
        email: originalUser?.email || session.email,
        nama: originalUser?.nama || restoredNama,
        role: restoredRole,
        asatidz_id: originalUser?.pegawai?.id || undefined,
        // Bersihkan tracking originalRole agar kembali normal
        originalRole: undefined,
        originalUserId: undefined,
        originalNama: undefined,
      };

      await createSession(updatedPayload);

      const redirectTo = ROLE_DESTINATIONS[restoredRole] || "/dashboard";
      return NextResponse.json({
        success: true,
        switchedBack: true,
        role: restoredRole,
        redirectTo,
      });
    }

    // Alur 2: BERALIH KE PERAN TARGET (Switch Role / Impersonate)
    if (!target_role) {
      return NextResponse.json({ error: "target_role wajib diisi" }, { status: 400 });
    }

    const targetUpper = target_role.toUpperCase();
    const matchedConfig = AVAILABLE_SWITCH_ROLES.find((r) => r.role === targetUpper);

    // Cari user spesifik yang memegang peran tersebut di DB
    let targetUser = await prisma.user.findFirst({
      where: {
        role: { equals: targetUpper, mode: "insensitive" },
        is_active: true,
      },
      include: { pegawai: true },
    });

    // Jika belum ada user khusus dengan role tersebut, cari pegawai yang sesuai
    if (!targetUser) {
      if (targetUpper === "ADMIN_KEUANGAN") {
        targetUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { contains: "keuangan", mode: "insensitive" } },
              { username: { contains: "keuangan", mode: "insensitive" } },
              { nama: { contains: "Bachtiar", mode: "insensitive" } },
            ],
          },
          include: { pegawai: true },
        });
      } else if (targetUpper === "KADIV_KURIKULUM") {
        targetUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { contains: "kurikulum", mode: "insensitive" } },
              { nama: { contains: "Agus Cahyono", mode: "insensitive" } },
            ],
          },
          include: { pegawai: true },
        });
      } else if (targetUpper === "KADIV_PENGASUHAN") {
        targetUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { contains: "pengasuhan", mode: "insensitive" } },
              { nama: { contains: "Wahab", mode: "insensitive" } },
            ],
          },
          include: { pegawai: true },
        });
      } else if (targetUpper === "WALI_KELAS") {
        targetUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { contains: "imran", mode: "insensitive" } },
              { nama: { contains: "Imran", mode: "insensitive" } },
            ],
          },
          include: { pegawai: true },
        });
      } else if (targetUpper === "MUSYRIF") {
        targetUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { contains: "iqbal", mode: "insensitive" } },
              { nama: { contains: "Iqbal", mode: "insensitive" } },
            ],
          },
          include: { pegawai: true },
        });
      }
    }

    // Simpan originalRole dan originalUserId pertama kali beralih
    const originalRole = session.originalRole || session.role;
    const originalUserId = session.originalUserId || session.userId;
    const originalNama = session.originalNama || session.nama;

    const newNama = targetUser?.nama || matchedConfig?.pejabat || session.nama;
    const newUserId = targetUser?.id || session.userId;
    const newEmail = targetUser?.email || session.email;
    const newAsatidzId = targetUser?.pegawai?.id || session.asatidz_id;

    const newPayload = {
      ...session,
      userId: newUserId,
      email: newEmail,
      nama: newNama,
      role: targetUpper,
      asatidz_id: newAsatidzId,
      originalRole,
      originalUserId,
      originalNama,
    };

    await createSession(newPayload);

    const redirectTo = ROLE_DESTINATIONS[targetUpper] || "/dashboard";

    return NextResponse.json({
      success: true,
      switched: true,
      role: targetUpper,
      nama: newNama,
      redirectTo,
    });
  } catch (error: any) {
    console.error("POST /api/auth/switch-role error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
