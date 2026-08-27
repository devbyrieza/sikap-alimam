import { ReactNode } from "react";
import { Database } from "lucide-react";
import NavTabs from "./NavTabs";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function MasterLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  const userRoles = (session?.role || "").toLowerCase().split(",").map(r => r.trim());

  const allowedRoles = ["admin_super", "mudir", "kadiv_kurikulum"];
  const hasAccess = userRoles.some(role => allowedRoles.includes(role));

  if (!hasAccess) {
    redirect("/dashboard");
  }

  return (
    <div>
      <div className="page-header" style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 0 }}>
        <div>
          <h1><Database size={16} className="inline mr-1" /> Master Data</h1>
          <p>Kelola data referensi utama sistem</p>
        </div>
        
        {/* Nav Tabs Component */}
        <NavTabs />
      </div>

      <div style={{ paddingTop: 20 }}>
        {children}
      </div>
    </div>
  );
}
