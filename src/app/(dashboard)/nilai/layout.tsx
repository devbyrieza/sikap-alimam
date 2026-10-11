import { ReactNode } from "react";
import { getLiveSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NilaiLayout({ children }: { children: ReactNode }) {
  const session = await getLiveSession();
  const userRoles = (session?.role || "").toLowerCase().split(",").map(r => r.trim());
  
  const allowedRoles = ["guru", "wali_kelas", "kadiv_kurikulum", "kepala_sekolah", "admin_super", "mudir"];
  const hasAccess = userRoles.some(role => allowedRoles.includes(role));
  
  if (!hasAccess) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
