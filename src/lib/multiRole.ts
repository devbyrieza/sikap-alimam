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
  KEPALA_SEKOLAH: "/dashboard",
  KEPALA_KURIKULUM: "/jurnal",
  KADIV_KURIKULUM: "/jurnal",
  KEPALA_PENGASUHAN: "/pengasuhan",
  KADIV_PENGASUHAN: "/pengasuhan",
  WALI_KELAS: "/wali-kelas",
  GURU: "/jurnal",
  PENGASUH: "/pengasuhan",
  PENGAMPU_HALAQOH: "/halaqoh",
  MUSYRIF: "/pengasuhan",
  WALI_SANTRI: "/wali",
};

/**
 * Mengambil daftar peran pribadi (Multi-Role) yang sah HANYA milik pengguna yang sedang login.
 * Keamanan Ketat: Pengguna TIDAK BOLEH dan TIDAK BISA beralih ke akun civitas / orang lain.
 * 
 * Jenis-jenis Akun Role Resmi SIKAP Pesantren Al-Basyir:
 * 1. Admin Super
 * 2. Admin Keuangan
 * 3. Mudir
 * 4. Kepala Sekolah
 * 5. Kepala Pengasuhan
 * 6. Kepala Kurikulum
 * 7. Wali Kelas (tergantung kelas apa)
 * 8. Guru Mapel (tergantung mapel apa)
 * 9. Pengasuh (istilah resmi untuk pembina asrama/kesantrian pengganti musyrif)
 * 10. Pengampu Halaqoh (pembimbing tahfidz Al-Qur'an halaqoh)
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
  const rawRoles = (user.role || "")
    .split(",")
    .map((r) => r.trim().toUpperCase())
    .filter(Boolean);
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

  // 1. Peran Utama (berdasarkan user.role di database, mendukung multi-role dengan koma)
  for (const roleItem of rawRoles) {
    if (roleItem === "ADMIN_SUPER" || roleItem === "MUDIR") {
      const isWahab = namaLower.includes("wahab");
      addRole(
        isWahab ? "MUDIR" : "ADMIN_SUPER",
        isWahab ? "Mudir Pesantren" : "Admin Super",
        "Akses penuh konfigurasi, master data, dan kendali sistem",
        "/dashboard"
      );
    } else if (roleItem === "ADMIN_KEUANGAN") {
      addRole(
        "ADMIN_KEUANGAN",
        "Admin Keuangan",
        "Kelola SPP santri, verifikasi bukti transfer, & kendali saklar portal",
        "/keuangan"
      );
    } else if (roleItem === "KEPALA_SEKOLAH") {
      addRole(
        "KEPALA_SEKOLAH",
        "Kepala Sekolah",
        "Supervisi akademik & operasional pembelajaran madrasah",
        "/dashboard"
      );
    } else if (roleItem === "KEPALA_KURIKULUM" || roleItem === "KADIV_KURIKULUM") {
      addRole(
        "KEPALA_KURIKULUM",
        "Kepala Kurikulum",
        "Monitoring jurnal mengajar dan kurikulum pesantren",
        "/jurnal"
      );
    } else if (roleItem === "KEPALA_PENGASUHAN" || roleItem === "KADIV_PENGASUHAN") {
      addRole(
        "KEPALA_PENGASUHAN",
        "Kepala Pengasuhan",
        "Kepala Pengasuhan, pembinaan adab, asrama & ibadah santri",
        "/pengasuhan"
      );
    } else if (roleItem === "WALI_KELAS") {
      const kName = p?.kelas_wali?.[0]?.nama || (p?.jabatan?.includes("SMA") || p?.jabatan?.includes("MA") ? "SMA IT" : p?.jabatan?.includes("IL") ? "IL" : "7 SMP IT");
      addRole(
        "WALI_KELAS",
        `Wali Kelas ${kName}`,
        `Wali Kelas ${kName}, pantau nilai, presensi, & rapor santri`,
        "/wali-kelas"
      );
    } else if (roleItem === "PENGASUH") {
      addRole(
        "PENGASUH",
        "Pengasuh",
        "Pembinaan adab santri, kedisiplinan asrama, & ibadah harian",
        "/ibadah"
      );
    } else if (roleItem === "PENGAMPU_HALAQOH") {
      addRole(
        "PENGAMPU_HALAQOH",
        "Pengampu Halaqoh",
        "Pembimbingan tahfidz Al-Qur'an & mutabaah halaqoh santri",
        "/halaqoh"
      );
    } else if (roleItem === "MUSYRIF") {
      const isPengasuhOnly = p?.jabatan?.toLowerCase().includes("pengasuh") && !p?.jabatan?.toLowerCase().includes("halaqoh");
      const roleKey = isPengasuhOnly ? "PENGASUH" : "PENGAMPU_HALAQOH";
      const roleLabel = isPengasuhOnly ? "Pengasuh" : "Pengampu Halaqoh";
      addRole(
        roleKey,
        roleLabel,
        isPengasuhOnly
          ? "Pembinaan adab santri, kedisiplinan asrama, & ibadah harian"
          : "Pembimbingan tahfidz Al-Qur'an & mutabaah halaqoh santri",
        isPengasuhOnly ? "/ibadah" : "/halaqoh"
      );
    } else if (roleItem === "GURU") {
      const mapelClean = p?.mata_pelajaran ? ` (${p.mata_pelajaran.split(";")[0].replace(/.*:\s*/, "")})` : "";
      addRole(
        "GURU",
        `Guru Mapel${mapelClean}`,
        "Input jurnal mengajar dan penilaian harian santri",
        "/jurnal"
      );
    } else if (roleItem === "WALI_SANTRI") {
      addRole(
        "WALI_SANTRI",
        "Portal Wali Santri",
        "Akses rapor resmi, mutabaah, dan informasi santri",
        "/wali"
      );
    } else if (ROLE_DESTINATIONS[roleItem]) {
      addRole(roleItem, roleItem, `Akses sebagai ${roleItem}`, ROLE_DESTINATIONS[roleItem]);
    }
  }

  // 2. Peran Tambahan sebagai GURU (jika mengampu mata pelajaran)
  if (primaryRole !== "GURU" && p?.mata_pelajaran && p.mata_pelajaran.trim()) {
    let cleanMapel = p.mata_pelajaran.split(";")[0].trim();
    if (cleanMapel.includes(":")) {
      const parts = cleanMapel.split(":");
      cleanMapel = parts[1].trim().split(",")[0].trim();
    }

    let mapelLabel = `Guru Mapel (${cleanMapel})`;
    if (namaLower.includes("zakaria")) {
      mapelLabel = "Guru Mapel (Bahasa Indonesia)";
    } else if (namaLower.includes("rifqi")) {
      mapelLabel = "Guru Mapel (Fiqh)";
    } else if (namaLower.includes("mahfudh")) {
      mapelLabel = "Guru Mapel (Akidah)";
    } else if (namaLower.includes("hasan")) {
      mapelLabel = "Guru Mapel (Nahwu & Bahasa Arab)";
    } else if (namaLower.includes("sulaiman")) {
      mapelLabel = "Guru Mapel (Hadits)";
    } else if (namaLower.includes("fauzan")) {
      mapelLabel = "Guru Mapel (Ushul Fikih)";
    } else if (namaLower.includes("jauhari")) {
      mapelLabel = "Guru Mapel (Siroh)";
    } else if (namaLower.includes("dimasqy")) {
      mapelLabel = "Guru Mapel (Informatika)";
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
    let kName = p?.kelas_wali?.[0]?.nama;
    if (!kName) {
      if (p?.jabatan?.includes("SMA") || p?.jabatan?.includes("MA")) kName = "SMA IT";
      else if (p?.jabatan?.includes("IL")) kName = "IL";
      else if (p?.jabatan?.includes("SMP") || p?.jabatan?.includes("MTs")) kName = "7 SMP IT";
      else if (namaLower.includes("zakaria")) kName = "7 SMP IT";
      else if (namaLower.includes("hasan")) kName = "IL";
      else if (namaLower.includes("fauzan")) kName = "SMA IT";
      else kName = "Binaan";
    }
    addRole(
      "WALI_KELAS",
      `Wali Kelas ${kName}`,
      `Kelola kelas binaan & pantau rapor santri ${kName}`,
      "/wali-kelas"
    );
  }

  // 4. Peran Tambahan sebagai PENGAMPU HALAQOH (jika mengampu halaqoh / tahfidz)
  if (
    primaryRole !== "PENGAMPU_HALAQOH" &&
    primaryRole !== "MUSYRIF" &&
    (p?.halaqoh_kelompok?.length || p?.jabatan?.includes("Halaqoh") || p?.jabatan?.includes("Tahfidz"))
  ) {
    addRole(
      "PENGAMPU_HALAQOH",
      "Pengampu Halaqoh",
      "Pembimbingan tahfidz Al-Qur'an & mutabaah halaqoh santri",
      "/halaqoh"
    );
  }

  // 5. Peran Tambahan sebagai PENGASUH (jika membina asrama / kepengasuhan)
  if (
    primaryRole !== "PENGASUH" &&
    (p?.jabatan?.includes("Pengasuh") || p?.jabatan?.includes("Asrama") || p?.divisi?.includes("Pengasuh"))
  ) {
    addRole(
      "PENGASUH",
      "Pengasuh",
      "Pembinaan adab santri, kedisiplinan asrama, & ibadah harian",
      "/ibadah"
    );
  }

  return roles;
}
