"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, BarChart3 } from "lucide-react";

export default function NavTabs({ isAdmin }: { isAdmin: boolean | undefined }) {
  const pathname = usePathname();

  const isRekap = pathname.includes("/rekap");

  return (
    <div style={{ display: "flex", gap: 24, borderBottom: "1px solid var(--border)" }}>
      <Link
        href="/presensi/santri"
        style={{
          padding: "12px 4px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 14,
          fontWeight: !isRekap ? 700 : 500,
          color: !isRekap ? "var(--primary-dark)" : "var(--text-muted)",
          borderBottom: !isRekap ? "2px solid var(--primary-dark)" : "2px solid transparent",
          textDecoration: "none"
        }}
      >
        <ClipboardCheck size={16} />
        Input Presensi Harian
      </Link>
      
      {isAdmin && (
        <Link
          href="/presensi/santri/rekap"
          style={{
            padding: "12px 4px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
            fontWeight: isRekap ? 700 : 500,
            color: isRekap ? "var(--primary-dark)" : "var(--text-muted)",
            borderBottom: isRekap ? "2px solid var(--primary-dark)" : "2px solid transparent",
            textDecoration: "none"
          }}
        >
          <BarChart3 size={16} />
          Rekap Presensi
        </Link>
      )}
    </div>
  );
}
