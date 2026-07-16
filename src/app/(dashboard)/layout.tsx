import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="app-layout">
      <Sidebar user={{ nama: session.nama, role: session.role, email: session.email }} />
      <main className="app-content" style={{ paddingTop: 0 }}>
        {children}
      </main>
    </div>
  );
}
