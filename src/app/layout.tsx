import type { Metadata } from "next";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SIKAP — Al-Imam Al-Islami",
  description:
    "Sistem Informasi Akademik dan Pengasuhan Pesantren Al-Imam Al-Islami. Jurnal mengajar, presensi santri, absensi asatidz, dan input nilai.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Amiri:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Lock to light mode — dark mode CSS not implemented, enabling it would cause broken mixed appearance */}
        <meta name="color-scheme" content="light only" />
        <meta name="theme-color" content="#7b0f14" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
