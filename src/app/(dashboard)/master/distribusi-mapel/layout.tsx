import { ReactNode } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DistribusiMapelLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  const userRoles = (session?.role || "").toLowerCase().split(",").map(r => r.trim());

  const allowedRoles = ["admin_super", "mudir", "kadiv_kurikulum"];
  const hasAccess = userRoles.some(role => allowedRoles.includes(role));

  if (!hasAccess) {
    redirect("/master");
  }

  return <>{children}</>;
}