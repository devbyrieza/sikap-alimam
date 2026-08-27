"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, BookOpen, Users } from "lucide-react";

export default function NavTabs() {
  const pathname = usePathname();

  const getStyle = (path: string) => {
    const isActive = pathname.startsWith(path);
    return {
      padding: "12px 4px",
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 14,
      fontWeight: isActive ? 700 : 500,
      color: isActive ? "var(--primary-dark)" : "var(--text-muted)",
      borderBottom: isActive ? "2px solid var(--primary-dark)" : "2px solid transparent",
      textDecoration: "none"
    };
  };

  return (
    <div style={{ display: "flex", gap: 24, borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
      <Link href="/master/kelas" style={getStyle("/master/kelas")}>
        <GraduationCap size={16} />
        Data Kelas
      </Link>
      
      <Link href="/master/mapel" style={getStyle("/master/mapel")}>
        <BookOpen size={16} />
        Data Mapel
      </Link>
      
      <Link href="/master/guru" style={getStyle("/master/guru")}>
        <Users size={16} />
        Data Guru
      </Link>

      <Link href="/master/distribusi-mapel" style={getStyle("/master/distribusi-mapel")}>
        <BookOpen size={16} />
        Distribusi Mengajar
      </Link>
    </div>
  );
}
