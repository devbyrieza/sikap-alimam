import { getSession } from "@/lib/auth";
import ComingSoonPage from "@/components/ComingSoonPage";

export default async function KeuanganLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const userRoles = (session?.role || "").toLowerCase().split(",").map(r => r.trim());
  
  if (!userRoles.includes("admin_super")) {
    return <ComingSoonPage title="Modul Keuangan" />;
  }
  
  return <>{children}</>;
}
