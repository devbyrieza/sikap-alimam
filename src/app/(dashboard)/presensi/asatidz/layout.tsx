import { ReactNode } from "react";
import { getSession } from "@/lib/auth";
import ComingSoonPage from "@/components/ComingSoonPage";

export default async function PresensiAsatidzLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  const userRoles = (session?.role || "").toLowerCase().split(",").map(r => r.trim());

  if (!userRoles.includes("admin_super")) {
    return <ComingSoonPage title="Absensi Guru" />;
  }

  return <>{children}</>;
}
