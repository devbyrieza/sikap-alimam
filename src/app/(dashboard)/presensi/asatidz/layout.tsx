import { ReactNode } from "react";
import { getLiveSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PresensiAsatidzLayout({ children }: { children: ReactNode }) {
  const session = await getLiveSession();
  const userRoles = (session?.role || "").toLowerCase().split(",").map(r => r.trim());

  const allowedRoles = [
    "guru", "musyrif", "pengasuh", "pengampu", "pengampu_halaqoh", "wali_kelas",
    "kepala_sekolah", "kepala_kurikulum", "kadiv_kurikulum", "kepala_pengasuhan", "kadiv_pengasuhan",
    "admin_super", "mudir"
  ];
  const hasAccess = userRoles.some(role => allowedRoles.includes(role));

  if (!hasAccess) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
