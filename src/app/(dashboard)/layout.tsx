import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";
import TeacherMapelSetupModal from "@/components/TeacherMapelSetupModal";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const userRole = (session.role || "").toLowerCase().trim();
  // Role pengajar / guru
  const isGuru = userRole.includes("guru") || userRole.includes("asatidz") || userRole.includes("pengajar") || userRole === "user";

  let pegawai = null;
  if (session.asatidz_id) {
    pegawai = await prisma.pegawai.findUnique({
      where: { id: session.asatidz_id },
      select: { id: true, nama_lengkap: true, mata_pelajaran: true, kategori_pegawai: true },
    });
  }

  if (!pegawai && session.userId) {
    pegawai = await prisma.pegawai.findFirst({
      where: {
        OR: [
          { user_id: session.userId },
          { email: session.email },
          { nama_lengkap: { equals: session.nama, mode: "insensitive" } },
        ],
      },
      select: { id: true, nama_lengkap: true, mata_pelajaran: true, kategori_pegawai: true },
    });
  }

  const hasMapel = Boolean(pegawai?.mata_pelajaran && pegawai.mata_pelajaran.trim().length > 0);
  const needsSetup = isGuru && !hasMapel;

  return (
    <div className="app-layout">
      <Sidebar user={{ nama: session.nama, role: session.role, email: session.email }} />
      <main className="app-content">
        {children}
      </main>

      {/* Onboarding / Penugasan Mapel Interceptor Modal */}
      <TeacherMapelSetupModal
        initialMapel={pegawai?.mata_pelajaran || ""}
        needsSetup={needsSetup}
        userName={session.nama}
        userRole={session.role}
      />
    </div>
  );
}
