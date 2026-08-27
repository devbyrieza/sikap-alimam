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
  HeartHandshake,
  BookHeart
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
    icon: <LayoutDashboard size={18} /> },
  {
    href: "/keuangan",
    label: "Keuangan",
    icon: <CreditCard size={18} />,
    roles: ["admin_keuangan", "ADMIN_KEUANGAN", "admin_super", "ADMIN_SUPER", "mudir", "MUDIR"] },
  {
    href: "/presensi/santri",
    label: "Presensi Santri",
    icon: <ClipboardCheck size={18} />,
    roles: ["guru", "GURU", "wali_kelas", "WALI_KELAS", "kabid_kedisiplinan", "KABID_KEDISIPLINAN", "kabid_kurikulum", "KABID_KURIKULUM", "kepala_sekolah", "KEPALA_SEKOLAH", "admin_super", "ADMIN_SUPER", "mudir", "MUDIR"] },
  {
    href: "/jurnal",
    label: "Jurnal Mengajar",
    icon: <BookMarked size={18} />,
    roles: ["guru", "GURU", "kabid_kurikulum", "KABID_KURIKULUM", "kepala_sekolah", "KEPALA_SEKOLAH", "admin_super", "ADMIN_SUPER", "mudir", "MUDIR"] },
  {
    href: "/nilai",
    label: "Input Nilai",
    icon: <BarChart3 size={18} />,
    roles: ["guru", "GURU", "wali_kelas", "WALI_KELAS", "kabid_kurikulum", "KABID_KURIKULUM", "kepala_sekolah", "KEPALA_SEKOLAH", "admin_super", "ADMIN_SUPER", "mudir", "MUDIR"] },
  {
    href: "/wali-kelas",
    label: "Hub Wali Kelas",
    icon: <Users size={18} />,
    roles: ["wali_kelas", "WALI_KELAS", "kabid_kurikulum", "KABID_KURIKULUM", "kepala_sekolah", "KEPALA_SEKOLAH", "admin_super", "ADMIN_SUPER", "mudir", "MUDIR"] },
  {
    href: "/halaqoh",
    label: "Halaqoh & Mutabaah",
    icon: <BookHeart size={18} />,
    roles: [
      "musyrif", "MUSYRIF",
      "pengampu", "PENGAMPU",
      "guru", "GURU",
      "wali_kelas", "WALI_KELAS",
      "kabid_pengasuhan", "KABID_PENGASUHAN",
      "kabid_asrama", "KABID_ASRAMA",
      "kabid_kurikulum", "KABID_KURIKULUM",
      "admin_super", "ADMIN_SUPER",
      "mudir", "MUDIR",
    ] },
  {
    href: "/presensi/asatidz",
    label: "Absensi Guru",
    icon: <UserCheck size={18} />,
    roles: ["guru", "GURU", "wali_kelas", "WALI_KELAS", "kepala_sekolah", "KEPALA_SEKOLAH", "kabid_kurikulum", "KABID_KURIKULUM", "kabid_pengasuhan", "KABID_PENGASUHAN", "admin_super", "ADMIN_SUPER", "mudir", "MUDIR"] },
  {
    href: "/master",
    label: "Master Data",
    icon: <Database size={18} />,
    roles: ["admin_super", "ADMIN_SUPER", "mudir", "MUDIR"] },
];

interface SidebarProps {
  user: { nama: string; role: string; email: string; foto_url?: string; originalRole?: string };
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

  const userRoles = (user?.role || "").toLowerCase().split(",").map(r => r.trim());
  const visibleNav = NAV.filter(
    (item) => !item.roles || item.roles.some((r) => userRoles.includes(r.toLowerCase()))
  );

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const formatRoleDisplay = (roleStr: string) => {
    if (!roleStr) return "Pengguna";
    const mapping: Record<string, string> = {
      ADMIN_SUPER: "Admin Super",
      GURU: "Guru Mapel",
      MUSYRIF: "Pengampu Halaqoh",
      WALI_KELAS: "Wali Kelas",
      MUDIR: "Mudir Pesantren",
      KEPALA_SEKOLAH: "Kepala Sekolah",
      KABID_PENGASUHAN: "Kabid Pengasuhan",
      KABID_ASRAMA: "Kabid Asrama",
      KABID_KEDISIPLINAN: "Kabid Kedisiplinan",
      KABID_KURIKULUM: "Kabid Kurikulum",
      ADMIN_KEUANGAN: "Admin Keuangan",
      WALI_SANTRI: "Wali Santri" };
    
    return roleStr
      .toUpperCase()
      .split(",")
      .map(r => mapping[r.trim()] || r.trim())
      .join(" & ");
  };

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
          borderBottom: "1px solid var(--border)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.png" alt="Logo Al-Imam" style={{ width: 44, height: 44, objectFit: "contain" }} />
          <div>
            <h1 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#550000", letterSpacing: "-0.02em", lineHeight: 1.2 }}>SIKAP</h1>
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
            transition: "all 0.15s ease" }}
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
            style={{
              transform: isActive(item.href) ? "none" : undefined,
              transition: "all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
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
            marginBottom: 12 }}
        >
          {user?.foto_url ? (
            <img
              src={user.foto_url}
              alt={user.nama || "Profile"}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                objectFit: "cover",
                border: "1.5px solid #ebdcc3",
                flexShrink: 0,
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
              }}
            />
          ) : (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#fdf5f5",
                border: "1px solid #ebdcc3",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 14,
                fontWeight: 800,
                color: "#550000" }}
            >
              {((user?.nama) || "U").charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#550000",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap" }}
            >
              {user?.nama || "User"}
            </p>
            <p
              style={{
                fontSize: 11,
                color: (user?.role || "").toUpperCase().includes("ADMIN") ? "#550000" : "var(--text-muted)",
                fontWeight: (user?.role || "").toUpperCase().includes("ADMIN") ? 700 : 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap" }}
            >
              {formatRoleDisplay(user?.role || "")}
            </p>
          </div>
        </div>
          
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
              color: "#380000",
              background: "#ffffff",
              borderColor: "#ebdcc3",
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
                background: "#fcfaf8",
                borderColor: "#ebdcc3",
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
                color: "#550000",
                background: "#fdf5f5",
                borderColor: "#ebdcc3",
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
          background: "#550000",
          borderBottom: "1px solid rgba(221, 193, 146, 0.2)",
          zIndex: 50,
          padding: "0 16px",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 12px rgba(85,0,0,0.25)" }}
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
            padding: 4 }}
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
              zIndex: 1000 }}
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
              flexDirection: "column" }}
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
