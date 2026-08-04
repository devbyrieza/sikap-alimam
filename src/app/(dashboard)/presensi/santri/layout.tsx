import { ReactNode } from "react";
import { getSession } from "@/lib/auth";
import { CheckCircle } from "lucide-react";
import NavTabs from "./NavTabs";

export default async function PresensiSantriLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  const isAdmin = (session?.role || "").toUpperCase().includes("ADMIN");

  return (
    <div>
      <div className="page-header" style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 0 }}>
        <div>
          <h1><CheckCircle size={16} className="inline mr-1" /> Presensi Santri</h1>
          <p>Manajemen absensi dan kehadiran santri per kelas per tanggal</p>
        </div>
        
        {/* Nav Tabs Component */}
        <NavTabs isAdmin={isAdmin} />
      </div>

      <div style={{ paddingTop: 20 }}>
        {children}
      </div>
    </div>
  );
}
