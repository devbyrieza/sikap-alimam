import { ReactNode } from "react";
import { Database } from "lucide-react";
import NavTabs from "./NavTabs";

export default function MasterLayout({ children }: { children: ReactNode }) {
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
