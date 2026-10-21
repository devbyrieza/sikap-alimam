import { ReactNode } from "react";
import { getLiveSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HalaqohLayout({ children }: { children: ReactNode }) {
  const session = await getLiveSession();
  const userRoles = (session?.role || "").toLowerCase().split(",").map(r => r.trim());
  
  const allowedRoles = [
    "musyrif", "pengasuh", "pengampu", "pengampu_halaqoh", "guru",
    "wali_kelas", "kepala_pengasuhan", "kadiv_pengasuhan", "kepala_asrama", "kadiv_asrama",
    "kepala_kurikulum", "kadiv_kurikulum", "kepala_sekolah", "admin_super", "mudir",
  ];
  const hasAccess = userRoles.some(role => allowedRoles.includes(role));
  
  if (!hasAccess) {
    redirect("/dashboard");
  }

  return (
    <div className="w-full min-h-screen">
      {children}
    </div>
  );
}
