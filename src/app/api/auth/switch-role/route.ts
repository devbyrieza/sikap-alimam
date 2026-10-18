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
  WALI_KELAS_MTS: "/wali-kelas",
  WALI_KELAS_IL: "/wali-kelas",
  WALI_KELAS_MA: "/wali-kelas",
  GURU: "/jurnal",
  MUSYRIF: "/halaqoh",
  WALI_SANTRI: "/wali",
};

export const AVAILABLE_SWITCH_ROLES = [
  {
    role: "ADMIN_SUPER",
    targetRole: "ADMIN_SUPER",
    label: "Admin Super (Rieza)",
    pejabat: "Rieza Eka Tomara, S.Kom.",
    targetEmail: "rieza@pesantren-alimam.com",
    deskripsi: "Akses penuh konfigurasi, master data, dan kendali sistem",
  },
  {
    role: "ADMIN_SUPER_MUDIR",
    targetRole: "ADMIN_SUPER",
    label: "Admin Super (Wahab)",
    pejabat: "Wahab Rajasam, M.Pd.",
    targetEmail: "wahab@pesantren-alimam.com",
    deskripsi: "Mudir Pesantren & Super Administrator",
  },
  {
    role: "ADMIN_KEUANGAN",
    targetRole: "ADMIN_KEUANGAN",
    label: "Admin Keuangan",
    pejabat: "Maulidin Bachtiar",
    targetEmail: "keuangan@pesantren-alimam.com",
    deskripsi: "Kelola SPP, verifikasi bukti transfer, dan kendali portal santri",
  },
  {
    role: "KADIV_KURIKULUM",
    targetRole: "KADIV_KURIKULUM",
    label: "Kadiv Kurikulum",
    pejabat: "Imron Abdillah, S.Pd.",
    targetEmail: "kurikulum@pesantren-alimam.com",
    deskripsi: "Kepala Kurikulum, monitoring jurnal mengajar, dan kurikulum",
  },
  {
    role: "KADIV_PENGASUHAN",
    targetRole: "KADIV_PENGASUHAN",
    label: "Kadiv Kepengasuhan",
    pejabat: "Wahyudi Pranata, B.A.",
    targetEmail: "pengasuhan@pesantren-alimam.com",
    deskripsi: "Kadiv Kepengasuhan, pembinaan santri, mutabaah, dan kedisiplinan",
  },
  {
    role: "WALI_KELAS_MTS",
    targetRole: "WALI_KELAS",
    label: "Wali Kelas MTs",
    pejabat: "Agus Cahyono",
    targetEmail: "walikelas.mts@pesantren-alimam.com",
    deskripsi: "Wali Kelas 7 MTs, pantau nilai, presensi, dan rapor santri MTs",
  },
  {
    role: "WALI_KELAS_IL",
    targetRole: "WALI_KELAS",
    label: "Wali Kelas IL",
    pejabat: "Imron Abdillah, S.Pd.",
    targetEmail: "kurikulum@pesantren-alimam.com",
    deskripsi: "Wali Kelas I'dad Lughowi (IL), pantau nilai & rapor kelas IL",
  },
  {
    role: "WALI_KELAS_MA",
    targetRole: "WALI_KELAS",
    label: "Wali Kelas MA",
    pejabat: "Muhammad Thoriq Ibn Ziyad, Lc., M.Ag.",
    targetEmail: "walikelas.ma@pesantren-alimam.com",
    deskripsi: "Wali Kelas Madrasah Aliyah (MA), pantau nilai & rapor kelas MA",
  },
  {
    role: "GURU",
    targetRole: "GURU",
    label: "Guru Mapel",
    pejabat: "Abdil Aziz, B.A.",
    targetEmail: "guru@pesantren-alimam.com",
    deskripsi: "Asatidz pengampu pelajaran, input jurnal, presensi, dan nilai",
  },
  {
    role: "MUSYRIF",
    targetRole: "MUSYRIF",
    label: "Pengampu Halaqoh",
    pejabat: "Muhammad Iqbal, S.Pd.",
    targetEmail: "musyrif@pesantren-alimam.com",
    deskripsi: "Musyrif tahfidz Al-Qur'an, setoran mutabaah, dan ujian tahfidz",
  },
  {
    role: "WALI_SANTRI",
    targetRole: "WALI_SANTRI",
    label: "Portal Wali Santri",
    pejabat: "Wali Santri Al-Imam",
    targetEmail: "wali_2602070023@pesantren-alimam.com",
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
      currentEmail: session.email,
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

    const matchedConfig = AVAILABLE_SWITCH_ROLES.find(
      (r) => r.role === target_role || r.targetRole === target_role
    );

    const targetEffectiveRole = matchedConfig?.targetRole || target_role.toUpperCase();

    // Cari user spesifik berdasarkan targetEmail
    let targetUser = null;
    if (matchedConfig?.targetEmail) {
      targetUser = await prisma.user.findFirst({
        where: { email: matchedConfig.targetEmail },
        include: { pegawai: true },
      });
    }

    // Jika belum ketemu via email, cari via nama pejabat
    if (!targetUser && matchedConfig?.pejabat) {
      targetUser = await prisma.user.findFirst({
        where: {
          nama: { contains: matchedConfig.pejabat.split(",")[0].trim(), mode: "insensitive" },
        },
        include: { pegawai: true },
      });
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
      role: targetEffectiveRole,
      asatidz_id: newAsatidzId,
      originalRole,
      originalUserId,
      originalNama,
    };

    await createSession(newPayload);

    const redirectTo =
      ROLE_DESTINATIONS[target_role] || ROLE_DESTINATIONS[targetEffectiveRole] || "/dashboard";

    return NextResponse.json({
      success: true,
      switched: true,
      role: targetEffectiveRole,
      selectedKey: target_role,
      nama: newNama,
      redirectTo,
    });
  } catch (error: any) {
    console.error("POST /api/auth/switch-role error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
