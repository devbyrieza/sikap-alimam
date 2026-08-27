import { ReactNode } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PresensiAsatidzLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  const userRoles = (session?.role || "").toLowerCase().split(",").map(r => r.trim());

  const allowedRoles = ["guru", "musyrif", "wali_kelas", "kepala_sekolah", "kadiv_kurikulum", "kadiv_pengasuhan", "admin_super", "mudir"];
  const hasAccess = userRoles.some(role => allowedRoles.includes(role));

  if (!hasAccess) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
