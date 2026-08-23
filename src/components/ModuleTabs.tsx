"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export interface TabItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  exact?: boolean;
}

interface ModuleTabsProps {
  tabs: TabItem[];
}

export default function ModuleTabs({ tabs }: ModuleTabsProps) {
  const pathname = usePathname();

  return (
    <div style={{ marginBottom: 24, maxWidth: "100%", overflow: "hidden" }}>
      <div
        className="hide-scrollbar"
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          background: "var(--bg)",
          padding: "6px",
          borderRadius: 14,
          border: "1px solid var(--border)",
          WebkitOverflowScrolling: "touch" }}
      >
        {tabs.map((tab, idx) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={idx}
              href={tab.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: isActive ? 700 : 600,
                color: isActive ? "#ffffff" : "var(--text-muted)",
                background: isActive ? "var(--primary)" : "transparent",
                textDecoration: "none",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 0.2s ease",
                boxShadow: isActive ? "0 4px 12px rgba(155, 27, 34, 0.25)" : "none" }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "var(--primary-pale)";
                  e.currentTarget.style.color = "var(--primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-muted)";
                }
              }}
            >
              {tab.icon && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    color: isActive ? "#ffffff" : "var(--text-muted)",
                    opacity: isActive ? 1 : 0.7,
                    transition: "color 0.2s ease" }}
                >
                  {tab.icon}
                </span>
              )}
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
