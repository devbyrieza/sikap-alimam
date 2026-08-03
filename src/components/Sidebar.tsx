"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  BookOpen, 
  LayoutDashboard, 
  BookMarked, 
  ClipboardCheck, 
  UserCheck, 
  BarChart3, 
  LogOut, 
  Menu, 
  X, 
  GraduationCap, 
  Users, 
  Settings, 
  Database,
  CreditCard,
  HeartHandshake
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
}

const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    href: "/keuangan",
    label: "SPP & Keuangan",
    icon: <CreditCard size={18} />,
    roles: ["admin_super", "ADMIN_SUPER", "mudir", "MUDIR", "admin_keuangan", "ADMIN_KEUANGAN"],
  },
  {
    href: "/presensi/santri",
    label: "Presensi Santri",
    icon: <ClipboardCheck size={18} />,
    roles: ["guru", "GURU", "wali_kelas", "WALI_KELAS", "admin_wali_kelas", "ADMIN_WALI_KELAS", "admin", "admin_super", "ADMIN_SUPER", "mudir", "MUDIR", "kepala", "KEPALA_SEKOLAH"],
  },
  {
    href: "/jurnal",
    label: "Jurnal Mengajar",
    icon: <BookMarked size={18} />,
    roles: ["guru", "GURU", "admin_super", "ADMIN_SUPER"],
  },
  {
    href: "/nilai",
    label: "Input Nilai",
    icon: <BarChart3 size={18} />,
    roles: ["guru", "GURU", "wali_kelas", "WALI_KELAS", "admin_wali_kelas", "ADMIN_WALI_KELAS", "admin_super", "ADMIN_SUPER"],
  },
  {
    href: "/wali-kelas",
    label: "Hub Wali Kelas",
    icon: <Users size={18} />,
    roles: ["wali_kelas", "WALI_KELAS", "admin_super", "ADMIN_SUPER"],
  },
  {
    href: "/tahfidz/mutabaah",
    label: "Mutabaah Tahfidz",
    icon: <BookOpen size={18} />,
    roles: ["guru", "GURU", "musyrif", "MUSYRIF", "wali_kelas", "WALI_KELAS", "admin_wali_kelas", "ADMIN_WALI_KELAS", "admin_super", "ADMIN_SUPER"],
  },
  {
    href: "/presensi/asatidz",
    label: "Absensi Guru",
    icon: <UserCheck size={18} />,
    roles: ["guru", "GURU", "admin", "admin_super", "ADMIN_SUPER", "mudir", "MUDIR"],
  },
  {
    href: "/master",
    label: "Master Data",
    icon: <Database size={18} />,
    roles: ["admin", "admin_super", "ADMIN_SUPER", "mudir", "MUDIR", "kepala", "KEPALA_SEKOLAH"],
  },
];

interface SidebarProps {
  user: { nama: string; role: string; email: string; originalRole?: string };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (pathname === href) return true;
    if (href === "/dashboard") return false;
    
    return pathname.startsWith(href);
  };

  const userRole = (user?.role || "").toLowerCase().trim();
  const visibleNav = NAV.filter(
    (item) => !item.roles || item.roles.some((r) => r.toLowerCase() === userRole)
  );

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function handleSwitchRole() {
    const targetRole = user.role === "ADMIN_SUPER" ? "GURU" : "ADMIN_SUPER";
    try {
      const res = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole }),
      });
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        alert("Gagal mengganti role");
      }
    } catch {
      alert("Terjadi kesalahan");
    }
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div
        className="sidebar-logo"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          paddingTop: "max(18px, env(safe-area-inset-top))",
          paddingBottom: "16px",
          paddingLeft: "18px",
          paddingRight: "14px",
          background: "#ffffff",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "linear-gradient(135deg, var(--secondary), var(--secondary-light))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 2px 6px rgba(217, 119, 6, 0.2)",
            }}
          >
            <GraduationCap size={22} color="#3d0a0a" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--primary-dark)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>SIKAP</h1>
            <p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginTop: "2px" }}>Al-Imam Al-Islami</p>
          </div>
        </div>

        {/* Mobile close button inside drawer header */}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="sm:hidden"
          style={{
            background: "#f1f5f9",
            border: "none",
            color: "var(--text-main)",
            width: 32,
            height: 32,
            borderRadius: 8,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "all 0.15s ease",
          }}
          aria-label="Tutup Menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Menu Utama</div>
        {visibleNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link ${isActive(item.href) ? "active" : ""}`}
            onClick={() => setMobileOpen(false)}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--primary-pale)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: 14,
              fontWeight: 700,
              color: "var(--primary)",
            }}
          >
            {user.nama.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--primary-dark)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.nama}
            </p>
            <p
              style={{
                fontSize: 11,
                color: user.role?.toUpperCase().includes("ADMIN") ? "var(--primary)" : "var(--text-muted)",
                fontWeight: user.role?.toUpperCase().includes("ADMIN") ? 700 : 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.role?.toUpperCase().includes("ADMIN") ? "Admin Super & Guru" : (user.role?.toUpperCase() === "GURU" ? "Guru Pengajar" : user.role)}
            </p>
          </div>
        </div>
          
          {user.originalRole === "ADMIN_SUPER" && (
            <button
              type="button"
              onClick={handleSwitchRole}
              className="btn btn-ghost btn-sm"
              style={{
                width: "100%",
                justifyContent: "center",
                color: "var(--primary)",
                background: "var(--primary-pale)",
                borderColor: "rgba(155, 27, 34, 0.2)",
                padding: "7px 0",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                marginBottom: 6
              }}
            >
              <UserCheck size={13} style={{ marginRight: 4 }} />
              Ganti ke Mode {user.role === "ADMIN_SUPER" ? "Guru" : "Admin"}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              window.dispatchEvent(new CustomEvent("open-teacher-mapel-modal"));
            }}
            className="btn btn-ghost btn-sm"
            style={{
              width: "100%",
              justifyContent: "center",
              color: "var(--primary-dark)",
              background: "var(--surface-50)",
              borderColor: "var(--border)",
              padding: "7px 0",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            <BookOpen size={13} style={{ marginRight: 4 }} />
            Atur Profil &amp; Mapel
          </button>
          
          <div style={{ display: "flex", gap: "6px", width: "100%" }}>
            <Link
              href="/profile"
              className="btn btn-ghost btn-sm"
              onClick={() => setMobileOpen(false)}
              style={{
                flex: 1,
                justifyContent: "center",
                color: "var(--text-muted)",
                background: "#f8fafc",
                borderColor: "var(--border)",
                padding: "7px 0",
                fontSize: "11px"
              }}
            >
              <Settings size={13} />
              Profil
            </Link>
            <button
              onClick={handleLogout}
              className="btn btn-ghost btn-sm"
              style={{
                flex: 1,
                justifyContent: "center",
                color: "#ef4444",
                background: "#fef2f2",
                borderColor: "#fee2e2",
                padding: "7px 0",
                fontSize: "11px",
                cursor: "pointer"
              }}
            >
              <LogOut size={13} />
              Keluar
            </button>
          </div>
        </div>
    </>
  );

  return (
    <>
      {/* Mobile header */}
      <div
        style={{
          display: "none",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          background: "var(--primary-dark)",
          zIndex: 50,
          padding: "0 16px",
          alignItems: "center",
          justifyContent: "space-between",
        }}
        className="mobile-header"
      >
        <span
          style={{ color: "white", fontWeight: 800, fontSize: 16 }}
        >
          SIKAP
        </span>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            background: "none",
            border: "none",
            color: "white",
            cursor: "pointer",
            display: "flex",
            padding: 4,
          }}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="app-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay & drawer */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              zIndex: 1000,
            }}
          />
          <aside
            className="app-sidebar"
            style={{
              position: "fixed",
              top: 0,
              bottom: 0,
              left: 0,
              height: "100dvh",
              transform: "translateX(0)",
              zIndex: 1001,
              width: "290px",
              maxWidth: "86vw",
              background: "#ffffff",
              boxShadow: "10px 0 40px rgba(0,0,0,0.35)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <SidebarContent />
          </aside>
        </>
      )}

      <style>{`
        @media (max-width: 768px) {
          .mobile-header { display: flex !important; }
        }
      `}</style>
    </>
  );
}
