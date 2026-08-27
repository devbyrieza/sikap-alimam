import { ReactNode } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HalaqohLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  const userRoles = (session?.role || "").toLowerCase().split(",").map(r => r.trim());
  
  const allowedRoles = [
    "musyrif", "pengampu", "guru",
    "wali_kelas", "kadiv_pengasuhan", "kadiv_asrama",
    "kadiv_kurikulum", "admin_super", "mudir",
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
