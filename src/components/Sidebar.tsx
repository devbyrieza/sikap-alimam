"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, LayoutDashboard, BookMarked, ClipboardCheck, UserCheck, BarChart3, LogOut, Menu, X, GraduationCap, Users } from "lucide-react";
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
  },
  {
    href: "/presensi/santri",
    label: "Presensi Santri",
    icon: <ClipboardCheck size={18} />,
  },
  {
    href: "/presensi/santri/rekap",
    label: "Rekap Presensi Santri",
    icon: <BarChart3 size={18} />,
    roles: ["admin", "kepala"],
  },
  {
    href: "/presensi/asatidz",
    label: "Absensi Asatidz",
    icon: <UserCheck size={18} />,
  },
  {
    href: "/nilai",
    label: "Input Nilai",
    icon: <BarChart3 size={18} />,
  },
  {
    href: "/admin/asatidz",
    label: "Data Asatidz",
    icon: <Users size={18} />,
    roles: ["admin", "kepala"],
  },
];

interface SidebarProps {
  user: { nama: string; role: string; email: string };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const visibleNav = NAV.filter(
    (item) => !item.roles || item.roles.includes(user.role)
  );

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
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
              background: "rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: 14,
              fontWeight: 700,
              color: "white",
            }}
          >
            {user.nama.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "white",
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
                color: "rgba(255,255,255,0.45)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.role}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-ghost btn-sm"
          style={{
            width: "100%",
            justifyContent: "center",
            color: "rgba(255,255,255,0.55)",
            borderColor: "rgba(255,255,255,0.15)",
          }}
        >
          <LogOut size={14} />
          Keluar
        </button>
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
