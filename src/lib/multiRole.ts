import { prisma } from "@/lib/prisma";

export interface UserRoleOption {
  role: string;
  label: string;
  pejabat?: string;
  deskripsi: string;
  redirectTo: string;
}

export const ROLE_DESTINATIONS: Record<string, string> = {
  ADMIN_SUPER: "/dashboard",
  MUDIR: "/dashboard",
  ADMIN_KEUANGAN: "/keuangan",
  KADIV_KURIKULUM: "/jurnal",
  KADIV_PENGASUHAN: "/halaqoh",
  WALI_KELAS: "/wali-kelas",
  GURU: "/jurnal",
  MUSYRIF: "/halaqoh",
  WALI_SANTRI: "/wali",
};

/**
 * Mengambil daftar peran pribadi (Multi-Role) yang sah HANYA milik pengguna yang sedang login.
 * Keamanan Ketat: Pengguna TIDAK BOLEH dan TIDAK BISA beralih ke akun civitas / orang lain.
 */
export async function getUserMultiRoles(userId: string): Promise<UserRoleOption[]> {
  if (!userId) return [];

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      pegawai: {
        include: {
          kelas_wali: true,
          halaqoh_kelompok: true,
        },
      },
    },
  });

  if (!user) return [];

  const primaryRole = (user.role || "").toUpperCase();
  const namaLower = (user.nama || "").toLowerCase();
  const p = user.pegawai;

  const roles: UserRoleOption[] = [];
  const addedRoleKeys = new Set<string>();

  const addRole = (roleKey: string, label: string, deskripsi: string, redirectTo: string) => {
    if (!addedRoleKeys.has(roleKey)) {
      addedRoleKeys.add(roleKey);
      roles.push({
        role: roleKey,
        label,
        pejabat: user.nama,
        deskripsi,
        redirectTo,
      });
    }
  };

  // 1. Peran Utama (berdasarkan user.role di database)
  if (primaryRole === "ADMIN_SUPER" || primaryRole === "MUDIR") {
    const isWahab = namaLower.includes("wahab");
    addRole(
      "ADMIN_SUPER",
      isWahab ? "Mudir Pesantren" : "Admin Super",
      "Akses penuh konfigurasi, master data, dan kendali sistem",
      "/dashboard"
    );
  } else if (primaryRole === "ADMIN_KEUANGAN") {
    addRole(
      "ADMIN_KEUANGAN",
      "Admin Keuangan",
      "Kelola SPP santri, verifikasi bukti transfer, & kendali saklar portal",
      "/keuangan"
    );
  } else if (primaryRole === "KADIV_KURIKULUM") {
    addRole(
      "KADIV_KURIKULUM",
      "Kadiv Kurikulum",
      "Monitoring jurnal mengajar dan kurikulum pesantren",
      "/jurnal"
    );
  } else if (primaryRole === "KADIV_PENGASUHAN") {
    addRole(
      "KADIV_PENGASUHAN",
      "Kadiv Kepengasuhan",
      "Kepala Kepengasuhan, pembinaan adab & ibadah santri",
      "/halaqoh"
    );
  } else if (primaryRole === "WALI_KELAS") {
    const kName = p?.kelas_wali?.[0]?.nama || (p?.jabatan?.includes("MA") ? "MA" : p?.jabatan?.includes("IL") ? "IL" : "7 MTs");
    addRole(
      "WALI_KELAS",
      `Wali Kelas ${kName}`,
      `Wali Kelas ${kName}, pantau nilai, presensi, & rapor santri`,
      "/wali-kelas"
    );
  } else if (primaryRole === "MUSYRIF") {
    addRole(
      "MUSYRIF",
      "Pengampu Halaqoh",
      "Musyrif tahfidz Al-Qur'an & mutabaah halaqoh santri",
      "/halaqoh"
    );
  } else if (primaryRole === "GURU") {
    const mapelClean = p?.mata_pelajaran ? ` (${p.mata_pelajaran.split(";")[0].replace(/.*:\s*/, "")})` : "";
    addRole(
      "GURU",
      `Guru Mapel${mapelClean}`,
      "Input jurnal mengajar dan penilaian harian santri",
      "/jurnal"
    );
  } else if (primaryRole === "WALI_SANTRI") {
    addRole(
      "WALI_SANTRI",
      "Portal Wali Santri",
      "Akses rapor resmi, mutabaah, dan informasi santri",
      "/wali"
    );
  } else {
    addRole(primaryRole, primaryRole, `Akses sebagai ${primaryRole}`, ROLE_DESTINATIONS[primaryRole] || "/dashboard");
  }

  // 2. Peran Tambahan sebagai GURU (jika mengampu mata pelajaran)
  if (primaryRole !== "GURU" && p?.mata_pelajaran && p.mata_pelajaran.trim()) {
    let cleanMapel = p.mata_pelajaran.split(";")[0].trim();
    if (cleanMapel.includes(":")) {
      const parts = cleanMapel.split(":");
      const mapelPart = parts[1].trim().split(",")[0].trim();
      cleanMapel = mapelPart;
    }

    let mapelLabel = `Guru Mapel (${cleanMapel})`;
    if (namaLower.includes("rieza") || namaLower.includes("reza")) {
      mapelLabel = "Guru Mapel (Matematika MTs)";
    } else if (namaLower.includes("bachtiar")) {
      mapelLabel = "Guru Mapel (Bahasa Inggris)";
    } else if (namaLower.includes("wahab")) {
      mapelLabel = "Guru Mapel (Fiqh)";
    } else if (namaLower.includes("imron")) {
      mapelLabel = "Guru Mapel (Nahwu & Tahsin)";
    } else if (namaLower.includes("wahyudi")) {
      mapelLabel = "Guru Mapel (Bahasa Arab)";
    } else if (namaLower.includes("iqbal")) {
      mapelLabel = "Guru Mapel (Shorf & Tahsin)";
    }

    addRole(
      "GURU",
      mapelLabel,
      `Input jurnal mengajar, presensi kelas, & nilai santri`,
      "/jurnal"
    );
  }

  // 3. Peran Tambahan sebagai WALI_KELAS (jika ditugaskan sebagai wali kelas)
  if (primaryRole !== "WALI_KELAS" && (p?.kelas_wali?.length || p?.jabatan?.includes("Wali Kelas"))) {
    const kName = p?.kelas_wali?.[0]?.nama || (p?.jabatan?.includes("MA") ? "MA" : p?.jabatan?.includes("IL") ? "IL" : "MTs");
    addRole(
      "WALI_KELAS",
      `Wali Kelas ${kName}`,
      `Kelola kelas binaan & pantau rapor santri ${kName}`,
      "/wali-kelas"
    );
  }

  // 4. Peran Tambahan sebagai PENGAMPU HALAQOH / MUSYRIF
  if (primaryRole !== "MUSYRIF" && (p?.halaqoh_kelompok?.length || p?.jabatan?.includes("Musyrif") || p?.jabatan?.includes("Halaqoh"))) {
    addRole(
      "MUSYRIF",
      "Pengampu Halaqoh",
      "Pembinaan tahfidz Al-Qur'an & mutabaah halaqoh santri",
      "/halaqoh"
    );
  }

  return roles;
}
