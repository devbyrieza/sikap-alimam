import { ReactNode } from "react";
import { getSession } from "@/lib/auth";
import { Hammer } from "lucide-react";

export default async function MutabaahLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (session?.role === "GURU") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", padding: 24, textAlign: "center" }}>
        <div style={{ width: 80, height: 80, backgroundColor: "var(--primary-pale)", color: "var(--primary)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <Hammer size={40} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>Coming Soon</h2>
        <p style={{ color: "var(--text-muted)", maxWidth: 450, marginBottom: 24, lineHeight: 1.6 }}>
          Modul <b>Mutabaah Tahfidz</b> untuk Guru saat ini sedang dalam tahap pengembangan. Kami sedang menyiapkan antarmuka yang terbaik untuk Anda.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
