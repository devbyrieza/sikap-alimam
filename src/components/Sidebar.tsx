"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  BarChart3,
  BookHeart,
  BookMarked,
  BookOpen,
  ClipboardCheck,
  CreditCard,
  Database,
  FileSpreadsheet,
  FileText,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
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
  MUSYRIF: "Pengasuh Asrama",
  PENGAMPU: "Pengampu Halaqoh",
  PENGAMPU_HALAQOH: "Pengampu Halaqoh",
  WALI_KELAS: "Wali Kelas",
  MUDIR: "Mudir Pesantren",
  KEPALA_SEKOLAH: "Kepala Sekolah",
  KADIV_PENGASUHAN: "Kadiv Pengasuhan",
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

function formatRoleDisplay(roleStr: string): string {
  if (!roleStr) return "Pengguna";
  return roleStr
    .toUpperCase()
    .split(",")
    .map((r) => ROLE_LABEL[r.trim()] || r.trim())
    .join(" & ");
}

/* ═══════════════════════════ Tipe ═══════════════════════════ */

interface SidebarUser {
  nama: string;
  role: string;
  email: string;
  foto_url?: string;
  originalRole?: string;
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
  const isWaliRole = roleUpper.includes("WALI");
  const isAdminRole = roleUpper.includes("ADMIN");
  const isWaliSantri = (user?.role || "").toLowerCase() === "wali_santri";

  const displayName = isWaliRole
    ? (user?.nama || "User").replace(/^Wali dari\s+/i, "")
    : user?.nama || "User";
  const initial = (displayName || "U").charAt(0).toUpperCase();

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

      {/* Navigasi */}
      <nav className="sidebar-nav sidebar-scroll-menu overscroll-contain" aria-label="Menu utama">
        <div className="sidebar-section-title">Menu Utama</div>
        {items.map(({ href, label, icon: Icon }) => {
          const active = activeHref === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`sidebar-link ${active ? "active" : ""} ${focusRing}`}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
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
              {formatRoleDisplay(user?.role || "")}
            </p>
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