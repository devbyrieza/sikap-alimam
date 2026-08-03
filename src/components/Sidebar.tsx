"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, LayoutDashboard, BookMarked, ClipboardCheck, UserCheck, BarChart3, LogOut, Menu, X, GraduationCap, Users, Settings, Database } from "lucide-react";
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
    href: "/jurnal",
    label: "Jurnal Mengajar",
    icon: <BookMarked size={18} />,
    roles: ["guru"],
  },
  {
    href: "/presensi/santri",
    label: "Presensi Santri",
    icon: <ClipboardCheck size={18} />,
    roles: ["guru", "admin", "admin_super", "ADMIN_SUPER", "mudir", "MUDIR", "kepala", "KEPALA_SEKOLAH"],
  },
  {
    href: "/presensi/asatidz",
    label: "Absensi Guru",
    icon: <UserCheck size={18} />,
    roles: ["guru", "admin", "admin_super", "ADMIN_SUPER", "mudir", "MUDIR"],
  },
  {
    href: "/tahfidz/mutabaah",
    label: "Mutabaah Tahfidz",
    icon: <BookOpen size={18} />,
    roles: ["guru", "musyrif"],
  },
  {
    href: "/nilai",
    label: "Input Nilai",
    icon: <BarChart3 size={18} />,
    roles: ["guru"],
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
      <div className="sidebar-logo">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "linear-gradient(135deg, var(--secondary), var(--secondary-light))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <GraduationCap size={22} color="#3d0a0a" />
          </div>
          <div>
            <h1>SIKAP</h1>
            <p>Al-Imam Al-Islami</p>
          </div>
        </div>
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

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 39,
            }}
          />
          <aside
            className="app-sidebar"
            style={{ transform: "translateX(0)", zIndex: 40 }}
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
