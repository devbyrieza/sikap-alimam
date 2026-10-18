"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Award,
  BarChart3,
  BookHeart,
  BookMarked,
  BookOpen,
  ChevronDown,
  ClipboardCheck,
  CreditCard,
  Database,
  FileSpreadsheet,
  FileText,
  HeartHandshake,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  RotateCcw,
  Settings,
  Shield,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ═══════════════════════════ Konfigurasi menu ═══════════════════════════ */

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Peran yang boleh melihat menu (huruf kecil semua; pencocokan tidak peka huruf besar/kecil). */
  roles: string[];
  /** Menu dengan aturan akses khusus (lihat canSeeRestricted). */
  restricted?: boolean;
}

const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: [
      "admin_super", "guru", "musyrif", "pengampu_halaqoh", "wali_kelas", "mudir",
      "kepala_sekolah", "kadiv_pengasuhan", "kadiv_asrama", "kadiv_kedisiplinan",
      "kadiv_kurikulum", "admin_keuangan",
    ],
  },
  { href: "/wali", label: "Beranda", icon: LayoutDashboard, roles: ["wali_santri", "orang_tua", "wali"] },
  { href: "/wali/rapor", label: "Rapor Santri", icon: FileText, roles: ["wali_santri", "orang_tua", "wali"] },
  { href: "/wali/akademik", label: "Akademik & Mapel", icon: BookOpen, roles: ["wali_santri", "orang_tua", "wali"] },
  { href: "/wali/tahfidz", label: "Halaqoh & Tahfidz", icon: BookHeart, roles: ["wali_santri", "orang_tua", "wali"] },
  { href: "/wali/spp", label: "SPP & Keuangan", icon: CreditCard, roles: ["wali_santri", "orang_tua", "wali"] },
  { href: "/keuangan", label: "Keuangan", icon: CreditCard, roles: ["admin_keuangan", "admin_super", "mudir"] },
  {
    href: "/presensi/santri",
    label: "Presensi Santri",
    icon: ClipboardCheck,
    roles: ["guru", "wali_kelas", "kadiv_kedisiplinan", "kadiv_kurikulum", "kepala_sekolah", "admin_super", "mudir"],
  },
  {
    href: "/jurnal",
    label: "Jurnal Mengajar",
    icon: BookMarked,
    roles: ["guru", "kadiv_kurikulum", "kepala_sekolah", "admin_super", "mudir"],
  },
  {
    href: "/nilai",
    label: "Input Nilai",
    icon: BarChart3,
    roles: ["guru", "wali_kelas", "kadiv_kurikulum", "kepala_sekolah", "admin_super", "mudir"],
  },
  {
    href: "/nilai/rekap",
    label: "Laporan Nilai",
    icon: FileSpreadsheet,
    roles: ["wali_kelas", "kadiv_kurikulum", "kepala_sekolah", "admin_super", "mudir"],
    restricted: true,
  },
  {
    href: "/akademik/pantau-nilai",
    label: "Pantau Nilai",
    icon: BarChart3,
    roles: ["wali_kelas", "kadiv_kurikulum", "kepala_sekolah", "admin_super", "mudir"],
    restricted: true,
  },
  {
    href: "/wali-kelas",
    label: "Hub Wali Kelas",
    icon: Users,
    roles: ["wali_kelas", "kadiv_kurikulum", "kepala_sekolah", "admin_super", "mudir"],
  },
  {
    href: "/halaqoh",
    label: "Halaqoh & Mutabaah",
    icon: BookHeart,
    roles: [
      "pengampu", "musyrif", "guru", "wali_kelas", "kadiv_pengasuhan", "kadiv_asrama",
      "kadiv_kurikulum", "admin_super", "mudir",
    ],
  },
  {
    href: "/halaqoh/monitoring",
    label: "Pantau Ujian Tahfidz",
    icon: Award,
    roles: ["wali_kelas", "kadiv_kurikulum", "admin_super", "mudir"],
    restricted: true,
  },
  {
    href: "/ibadah",
    label: "Ibadah & Adab (BPI)",
    icon: HeartHandshake,
    roles: [
      "musyrif", "pengasuh", "kadiv_pengasuhan", "kadiv_asrama", "kadiv_kedisiplinan",
      "wali_kelas", "admin_super", "mudir",
    ],
  },
  {
    href: "/presensi/asatidz",
    label: "Absensi Pegawai",
    icon: UserCheck,
    roles: [
      "guru", "musyrif", "pengampu", "wali_kelas", "kepala_sekolah", "kadiv_kurikulum",
      "kadiv_pengasuhan", "admin_super", "mudir",
    ],
  },
  {
    href: "/pengaturan/kendali",
    label: "Pusat Kendali",
    icon: Settings,
    roles: ["admin_super", "kadiv_kurikulum", "mudir"],
  },
  { href: "/master", label: "Master Data", icon: Database, roles: ["admin_super", "mudir", "kadiv_kurikulum"] },
];

const ROLE_LABEL: Record<string, string> = {
  ADMIN_SUPER: "Admin Super",
  GURU: "Guru Mapel",
  GURU_ADE: "Guru Bahasa Indonesia",
  GURU_ARIFIN: "Guru Akidah",
  GURU_HARDIANSYAH: "Guru IPA Terpadu",
  GURU_TEGUH: "Guru Entrepreneurship",
  GURU_IMAM: "Guru Asatidz",
  GURU_SAIF: "Guru Asatidz",
  GURU_BACHTIAR: "Guru Bahasa Inggris (Bachtiar)",
  MUSYRIF: "Pengampu Halaqoh",
  PENGAMPU: "Pengampu Halaqoh",
  PENGAMPU_HALAQOH: "Pengampu Halaqoh",
  WALI_KELAS: "Wali Kelas",
  WALI_KELAS_MTS: "Wali Kelas MTs",
  WALI_KELAS_IL: "Wali Kelas IL",
  WALI_KELAS_MA: "Wali Kelas MA",
  MUDIR: "Mudir Pesantren",
  KEPALA_SEKOLAH: "Kepala Sekolah",
  KADIV_PENGASUHAN: "Kadiv Kepengasuhan",
  KADIV_ASRAMA: "Kadiv Asrama",
  KADIV_KEDISIPLINAN: "Kadiv Kedisiplinan",
  KADIV_KURIKULUM: "Kadiv Kurikulum",
  ADMIN_KEUANGAN: "Admin Keuangan",
  WALI_SANTRI: "Portal Wali Santri",
};

// TODO: pengecualian berdasarkan nama ini sebaiknya diganti dengan peran "wali_kelas"
// / "kadiv_kurikulum" langsung di database, lalu daftar nama di bawah dihapus.
const WALI_KELAS_BY_NAME = ["agus cahyono", "imron", "thoriq"];
const KURIKULUM_BY_NAME = ["imron"];

/* ═══════════════════════════ Helper ═══════════════════════════ */

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#550000]/40 focus-visible:ring-offset-1";

function formatRoleDisplay(roleStr: string, email?: string, nama?: string): string {
  if (!roleStr) return "Pengguna";
  const emailLower = (email || "").toLowerCase();
  const namaLower = (nama || "").toLowerCase();
  const isBachtiar = emailLower.includes("keuangan") || namaLower.includes("bachtiar");

  if (isBachtiar) {
    if (roleStr.toUpperCase() === "ADMIN_KEUANGAN") return "Admin Keuangan";
    if (roleStr.toUpperCase() === "GURU" || roleStr.toUpperCase() === "GURU_BACHTIAR") return "Guru Mapel (Bahasa Inggris)";
    if (roleStr.includes(",")) return "Admin Keuangan";
  }

  if (roleStr.includes(",")) {
    return roleStr
      .toUpperCase()
      .split(",")
      .map((r) => ROLE_LABEL[r.trim()] || r.trim())
      .join(" & ");
  }
  return ROLE_LABEL[roleStr.toUpperCase()] || roleStr;
}

/* ═══════════════════════════ Tipe ═══════════════════════════ */

interface SidebarUser {
  nama: string;
  role: string;
  email: string;
  foto_url?: string;
  originalRole?: string;
  originalNama?: string;
}

interface SidebarProps {
  user: SidebarUser;
}

interface SidebarContentProps {
  user: SidebarUser;
  items: NavItem[];
  activeHref: string | null;
  onNavigate: () => void;
  onLogout: () => void;
  /** Hanya diisi pada drawer mobile: menampilkan tombol tutup. */
  onClose?: () => void;
}

/* ═══════════════════════════ Isi sidebar ═══════════════════════════ */
/* Didefinisikan di luar komponen Sidebar agar tidak dibuat ulang (dan di-remount) pada setiap render. */

function SidebarContent({ user, items, activeHref, onNavigate, onLogout, onClose }: SidebarContentProps) {
  const roleUpper = (user?.role || "").toUpperCase();
  const originalRoleUpper = (user?.originalRole || "").toUpperCase();
  const isSuperAdmin = roleUpper === "ADMIN_SUPER" || originalRoleUpper === "ADMIN_SUPER" || roleUpper === "MUDIR" || originalRoleUpper === "MUDIR";
  const isRealSuperSwitched = Boolean(
    user?.originalRole &&
    (originalRoleUpper === "ADMIN_SUPER" || originalRoleUpper === "MUDIR") &&
    originalRoleUpper !== roleUpper
  );

  const isWaliSantri =
    roleUpper === "WALI_SANTRI" ||
    roleUpper.includes("WALI_SANTRI") ||
    (user?.nama || "").toLowerCase().startsWith("wali dari");
  const isWaliRole = isWaliSantri;
  const isAdminRole = roleUpper.includes("ADMIN");
  const isBachtiar =
    (user?.email || "").toLowerCase().includes("keuangan") ||
    (user?.nama || "").toLowerCase().includes("bachtiar");

  const BACHTIAR_STATIC_ROLES = [
    { role: "ADMIN_KEUANGAN", label: "Admin Keuangan", pejabat: "Maulidin Bachtiar" },
    { role: "GURU_BACHTIAR", label: "Guru Mapel (B. Inggris)", pejabat: "Maulidin Bachtiar" },
  ];

  const [waliSppLocked, setWaliSppLocked] = useState<boolean>(false);
  const [switchRoles, setSwitchRoles] = useState<any[]>(isBachtiar ? BACHTIAR_STATIC_ROLES : []);
  const [canSwitch, setCanSwitch] = useState<boolean>(isSuperAdmin || isRealSuperSwitched || isBachtiar);
  const [switching, setSwitching] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/auth/switch-role")
      .then((r) => r.json())
      .then((res) => {
        if (res?.success) {
          setSwitchRoles(res.roles || []);
          if (res.canSwitch !== undefined) {
            setCanSwitch(Boolean(res.canSwitch));
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleRoleSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const targetRole = e.target.value;
    if (!targetRole || targetRole === roleUpper) return;
    setSwitching(true);
    try {
      const res = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_role: targetRole }),
      });
      const data = await res.json();
      if (data.success && data.redirectTo) {
        window.location.href = data.redirectTo;
      } else {
        alert(data.error || "Gagal beralih akun");
        setSwitching(false);
      }
    } catch (err) {
      console.error("Gagal beralih akun:", err);
      setSwitching(false);
    }
  };

  const handleSwitchBack = async () => {
    setSwitching(true);
    try {
      const res = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ switch_back: true }),
      });
      const data = await res.json();
      if (data.success && data.redirectTo) {
        window.location.href = data.redirectTo;
      } else {
        alert(data.error || "Gagal kembali ke akun utama");
        setSwitching(false);
      }
    } catch (err) {
      console.error("Gagal kembali ke akun utama:", err);
      setSwitching(false);
    }
  };

  useEffect(() => {
    if (!isWaliRole && !isWaliSantri) return;
    fetch("/api/wali/anak")
      .then((r) => r.json())
      .then((res) => {
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          const hasLockedChild = res.data.some((s: any) => {
            const spp = s.spp;
            const verifying = spp?.status === "menunggu_verifikasi";
            const unlockedManual = spp?.isUnlockedManual;
            return !s.lunas && !verifying && !unlockedManual;
          });
          setWaliSppLocked(hasLockedChild);
        }
      })
      .catch(() => {});
  }, [isWaliRole, isWaliSantri]);

  const displayName = isWaliRole
    ? (user?.nama || "User").replace(/^Wali dari\s+/i, "")
    : user?.nama || "User";
  const initial = (displayName || "U").charAt(0).toUpperCase();

  const selectedRoleKey = useMemo(() => {
    const emailLower = (user?.email || "").toLowerCase();
    const namaLower = (user?.nama || "").toLowerCase();
    const isUserBachtiar = emailLower.includes("keuangan") || namaLower.includes("bachtiar");

    if (isUserBachtiar) {
      if (roleUpper === "GURU" || roleUpper === "GURU_BACHTIAR") return "GURU_BACHTIAR";
      return "ADMIN_KEUANGAN";
    }

    if (roleUpper === "ADMIN_SUPER") {
      if (emailLower.includes("wahab") || namaLower.includes("wahab")) return "ADMIN_SUPER_MUDIR";
      return "ADMIN_SUPER";
    }
    if (roleUpper === "WALI_KELAS") {
      if (emailLower.includes("mts") || namaLower.includes("agus")) return "WALI_KELAS_MTS";
      if (emailLower.includes("ma") || namaLower.includes("thoriq")) return "WALI_KELAS_MA";
      return "WALI_KELAS_IL";
    }
    if (roleUpper === "GURU") {
      if (emailLower.includes("ade") || namaLower.includes("ade")) return "GURU_ADE";
      if (emailLower.includes("arifin") || namaLower.includes("arifin")) return "GURU_ARIFIN";
      if (emailLower.includes("hardian") || namaLower.includes("hardian")) return "GURU_HARDIANSYAH";
      if (emailLower.includes("teguh") || namaLower.includes("teguh")) return "GURU_TEGUH";
      if (emailLower.includes("imam") || namaLower.includes("imam")) return "GURU_IMAM";
      if (emailLower.includes("saif") || namaLower.includes("saif")) return "GURU_SAIF";
      return "GURU_ADE";
    }
    return roleUpper;
  }, [roleUpper, user?.email, user?.nama]);

  return (
    <>
      {/* Logo */}
      <div
        className="sidebar-logo flex items-center justify-between gap-2.5 border-b bg-white pb-4 pl-[18px] pr-3.5"
        style={{
          paddingTop: "max(18px, env(safe-area-inset-top))",
          borderBottomColor: "var(--border)",
        }}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <img src="/logo.png" alt="Logo Al-Imam" width={44} height={44} className="h-11 w-11 shrink-0 object-contain" />
          <div className="min-w-0">
            <h1 className="m-0 text-base font-extrabold leading-tight tracking-tight text-[#550000]">SIKAP</h1>
            <p className="m-0 mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Al-Imam Al-Islami
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 ${focusRing}`}
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Role Switcher & Mode Akses (Platinum Standard Multi-User Switcher) */}
      {(canSwitch || isRealSuperSwitched) && (
        <div className="border-b border-slate-200/80 bg-gradient-to-b from-slate-50/90 to-white px-3.5 py-3">
          {/* Switched Mode Banner (Khusus Super Admin yang impersonasi akun lain) */}
          {isRealSuperSwitched && (
            <div className="mb-2.5 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/60 p-2.5 shadow-sm">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-900">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  Mode Akses Aktif
                </span>
                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-800">
                  Impersonasi
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-700 truncate mb-2">
                Sebagai: <span className="font-extrabold text-[#550000]">{formatRoleDisplay(user.role, user?.email, user?.nama)}</span>
              </p>
              <button
                type="button"
                onClick={handleSwitchBack}
                disabled={switching}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100/60 text-[11px] font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
              >
                <RotateCcw size={12} className={switching ? "animate-spin" : ""} />
                <span>Kembali ke {ROLE_LABEL[user.originalRole || "ADMIN_SUPER"] || "Admin Super"}</span>
              </button>
            </div>
          )}

          {/* Quick Role Switcher Dropdown */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-0.5">
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <ArrowLeftRight size={11} className="text-[#550000]" />
                Beralih Akun / Peran
              </span>
              {switching && (
                <span className="text-[9px] font-bold text-slate-400 animate-pulse">Memuat...</span>
              )}
            </div>
            <div className="relative">
              <select
                value={selectedRoleKey}
                onChange={handleRoleSelect}
                disabled={switching}
                aria-label="Pilih akun atau peran"
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-[11px] font-bold text-slate-800 shadow-xs transition-colors hover:border-[#550000]/40 focus:border-[#550000] focus:outline-none focus:ring-2 focus:ring-[#550000]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {switchRoles.length > 0 ? (
                  switchRoles.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.label} — {r.pejabat}
                    </option>
                  ))
                ) : isBachtiar ? (
                  <>
                    <option value="ADMIN_KEUANGAN">Admin Keuangan — Maulidin Bachtiar</option>
                    <option value="GURU_BACHTIAR">Guru Mapel (B. Inggris) — Maulidin Bachtiar</option>
                  </>
                ) : (
                  <option value={selectedRoleKey}>Memuat opsi peran...</option>
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                <ChevronDown size={13} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigasi */}
      <nav className="sidebar-nav sidebar-scroll-menu overscroll-contain" aria-label="Menu utama">
        <div className="sidebar-section-title">Menu Utama</div>
        {items.map(({ href, label, icon: Icon }) => {
          const active = activeHref === href;
          const isLockedWaliMenu = waliSppLocked && (href === "/wali/rapor" || href === "/wali/akademik" || href === "/wali/tahfidz");
          const isSppMenu = href === "/wali/spp";

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`sidebar-link ${active ? "active" : ""} ${focusRing} ${
                isLockedWaliMenu ? "text-rose-800 bg-rose-50/50 hover:bg-rose-100/50" : ""
              }`}
            >
              <Icon size={18} aria-hidden="true" className={isLockedWaliMenu ? "text-rose-600 shrink-0" : "shrink-0"} />
              <span className="flex-1 truncate">{label}</span>
              {isLockedWaliMenu && (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-700">
                  <Lock size={10} /> Terkunci
                </span>
              )}
              {waliSppLocked && isSppMenu && (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white animate-pulse">
                  Bayar SPP
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="mb-3 flex items-center gap-2.5">
          {user?.foto_url ? (
            <img
              src={user.foto_url}
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-full border-[1.5px] border-[#ebdcc3] object-cover shadow-sm"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#ebdcc3] bg-[#fdf5f5] text-sm font-extrabold text-[#550000]"
            >
              {initial}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-[#550000]" title={displayName}>
              {displayName}
            </p>
            <p
              className={`truncate text-[11px] ${
                isAdminRole ? "font-bold text-[#550000]" : "font-medium text-slate-500"
              }`}
            >
              {formatRoleDisplay(user?.role || "", user?.email, user?.nama)}
            </p>
            {isRealSuperSwitched && (
              <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-black bg-amber-100 text-amber-800">
                Mode Beralih (Asli: {ROLE_LABEL[user.originalRole || "ADMIN_SUPER"] || user.originalRole})
              </span>
            )}
          </div>
        </div>

        {!isWaliSantri && (
          <button
            type="button"
            onClick={() => {
              onNavigate();
              window.dispatchEvent(new CustomEvent("open-teacher-mapel-modal"));
            }}
            className={`btn btn-ghost btn-sm mb-1.5 w-full cursor-pointer justify-center border-[#ebdcc3] bg-white py-[7px] text-[11px] font-bold text-[#380000] transition-colors hover:bg-[#fdf5f5] ${focusRing}`}
          >
            <BookOpen size={13} className="mr-1" aria-hidden="true" />
            Atur Profil &amp; Mapel
          </button>
        )}

        <div className="flex w-full gap-1.5">
          <Link
            href="/profile"
            onClick={onNavigate}
            className={`btn btn-ghost btn-sm flex-1 justify-center border-[#ebdcc3] bg-[#fcfaf8] py-[7px] text-[11px] text-slate-500 ${focusRing}`}
          >
            <Settings size={13} aria-hidden="true" />
            Profil
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className={`btn btn-ghost btn-sm flex-1 cursor-pointer justify-center border-[#ebdcc3] bg-[#fdf5f5] py-[7px] text-[11px] text-[#550000] ${focusRing}`}
          >
            <LogOut size={13} aria-hidden="true" />
            Keluar
          </button>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════ Sidebar ═══════════════════════════ */

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Menu yang boleh dilihat pengguna
  const visibleNav = useMemo(() => {
    const userRoles = (user?.role || "")
      .toLowerCase()
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
    const userName = (user?.nama || "").toLowerCase();
    const isWaliByName = WALI_KELAS_BY_NAME.some((n) => userName.includes(n));
    const hasRole = (list: string[]) => userRoles.some((r) => list.includes(r));

    const canSeeRestricted = () => {
      const isSuper = hasRole(["admin_super", "mudir", "kepala_sekolah", "admin_rapor"]);
      const isKurikulum =
        hasRole(["kadiv_kurikulum", "kepala_kurikulum"]) || KURIKULUM_BY_NAME.some((n) => userName.includes(n));
      const isWali = userRoles.includes("wali_kelas") || isWaliByName;
      return isSuper || isKurikulum || isWali;
    };

    return NAV.filter((item) => {
      if (item.restricted) return canSeeRestricted();
      return hasRole(item.roles) || (item.roles.includes("wali_kelas") && isWaliByName);
    });
  }, [user?.role, user?.nama]);

  // Satu menu aktif saja: kecocokan terpanjang (mis. /halaqoh/monitoring tidak ikut menyalakan /halaqoh)
  const activeHref = useMemo(() => {
    let best: string | null = null;
    for (const { href } of visibleNav) {
      const match = (href === "/dashboard" || href === "/wali") ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
      if (match && (best === null || href.length > best.length)) best = href;
    }
    return best;
  }, [pathname, visibleNav]);

  // Tutup drawer saat pindah halaman
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Drawer mobile: kunci scroll latar + tutup dengan Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      router.push("/login");
      router.refresh();
    }
  }, [router]);

  const contentProps = { user, items: visibleNav, activeHref, onLogout: handleLogout };

  return (
    <>
      {/* Header mobile (ditampilkan lewat CSS di layar ≤ 768px) */}
      <div
        className="mobile-header no-print print:hidden fixed inset-x-0 top-0 z-50 h-14 items-center justify-between bg-[#550000] px-4 shadow-[0_2px_12px_rgba(85,0,0,0.25)]"
        style={{ display: "none", borderBottom: "1px solid rgba(221, 193, 146, 0.2)" }}
      >
        <span className="text-base font-extrabold tracking-tight text-white">SIKAP</span>
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
          aria-expanded={mobileOpen}
          aria-controls="sidebar-drawer"
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-xl text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          {mobileOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>

      {/* Sidebar desktop */}
      <aside className="app-sidebar no-print print:hidden overscroll-contain">
        <SidebarContent {...contentProps} onNavigate={() => undefined} />
      </aside>

      {/* Overlay + drawer mobile */}
      {mobileOpen && (
        <>
          <div
            className="no-print print:hidden fixed inset-0 z-[1000] bg-slate-900/65 backdrop-blur-[6px]"
            onClick={closeMobile}
            aria-hidden="true"
          />
          <aside
            id="sidebar-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
            className="app-sidebar no-print print:hidden"
            // Inline agar menimpa gaya .app-sidebar versi desktop
            style={{
              position: "fixed",
              top: 0,
              bottom: 0,
              left: 0,
              height: "100dvh",
              transform: "translateX(0)",
              zIndex: 1001,
              width: 290,
              maxWidth: "86vw",
              background: "#ffffff",
              boxShadow: "10px 0 40px rgba(0,0,0,0.35)",
              display: "flex",
              flexDirection: "column",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            <SidebarContent {...contentProps} onNavigate={closeMobile} onClose={closeMobile} />
          </aside>
        </>
      )}

      <style>{`
        @media screen and (max-width: 768px) {
          .mobile-header { display: flex !important; }
        }
        @media print {
          .mobile-header,
          .app-sidebar,
          nav,
          header,
          aside {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            width: 0 !important;
            position: absolute !important;
            top: -9999px !important;
            left: -9999px !important;
          }
        }
      `}</style>
    </>
  );
}