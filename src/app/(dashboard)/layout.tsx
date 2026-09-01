import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";
import TeacherMapelSetupModal from "@/components/TeacherMapelSetupModal";

export default async function DashboardLayout({
  children }: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const userRoles = (session.role || "").toLowerCase().split(",").map(r => r.trim());
  const isWaliSantri = userRoles.includes("wali_santri") || userRoles.includes("orang_tua") || userRoles.includes("wali");

  let pegawai = null;
  if (!isWaliSantri) {
    try {
      if (session.asatidz_id) {
        pegawai = await prisma.pegawai.findUnique({
          where: { id: session.asatidz_id } });
      }

      if (!pegawai && session.userId) {
        pegawai = await prisma.pegawai.findFirst({
          where: {
            OR: [
              { user_id: session.userId },
              { email: session.email },
              { nama_lengkap: { equals: session.nama || "", mode: "insensitive" } },
            ] } });
      }
    } catch (e) {
      console.error("DashboardLayout: Error fetching pegawai:", e);
    }
  }

  // Check completeness for Civitas & Teachers
  const missingFields: string[] = [];
  let needsSetup = false;

  const isDemoAccount = session.email?.includes("pribadi.guru") || 
                        session.email?.includes("presentasi.guru") || 
                        session.email?.includes("demo");

  if (!isWaliSantri && !isDemoAccount) {
    const isGuru = userRoles.some(r => r.includes("guru") || r.includes("asatidz") || r.includes("pengajar") || r.includes("wali_kelas")) || 
      userRoles.includes("user") ||
      (pegawai?.kategori_pegawai || "").toUpperCase().includes("GURU") ||
      (pegawai?.kategori_pegawai || "").toUpperCase().includes("ASATIDZ");

    if (!pegawai) {
      needsSetup = true;
      missingFields.push("Profil Civitas Belum Terdaftar");
    } else {
      if (!pegawai.nama_lengkap || !pegawai.nama_lengkap.trim()) missingFields.push("Nama Lengkap");
      if (!pegawai.no_hp || !pegawai.no_hp.trim()) {
        needsSetup = true;
        missingFields.push("No. WhatsApp / HP");
      }
      if (!pegawai.jenis_kelamin) missingFields.push("Jenis Kelamin");
      if (isGuru && (!pegawai.mata_pelajaran || !pegawai.mata_pelajaran.trim())) {
        missingFields.push("Penugasan Mata Pelajaran");
      }
    }
  }

  return (
    <div className="app-layout">
      <Sidebar user={{ nama: session.nama || "", role: session.role || "", email: session.email || "", originalRole: session.originalRole }} />
      <main className="app-content">
        {session.is_default_password && (
          <div style={{
            background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
            borderBottom: "1px solid #fed7aa",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            fontSize: "13px",
            color: "#9a3412",
            borderRadius: "12px",
            marginBottom: "16px",
            boxShadow: "0 2px 8px rgba(234, 88, 12, 0.1)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "16px" }}>🔐</span>
              <span>
                <strong>Peringatan Keamanan:</strong> Anda saat ini masih menggunakan Password Default sistem. Disarankan segera memperbarui Kata Sandi Anda demi keamanan data pesantren.
              </span>
            </div>
            <a
              href="/profile"
              style={{
                background: "#ea580c",
                color: "white",
                padding: "6px 14px",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "12px",
                textDecoration: "none",
                whiteSpace: "nowrap"
              }}
            >
              Ganti Password
            </a>
          </div>
        )}
        {children}
      </main>

      {/* Onboarding & Lengkapi Data Civitas Interceptor Modal */}
      {!isWaliSantri && (
        <TeacherMapelSetupModal
          initialPegawai={pegawai ? {
            id: pegawai.id,
            nama_lengkap: pegawai.nama_lengkap,
            nik: pegawai.nik,
            jenis_kelamin: pegawai.jenis_kelamin,
            tempat_lahir: pegawai.tempat_lahir,
            tanggal_lahir: pegawai.tanggal_lahir ? pegawai.tanggal_lahir.toISOString().split("T")[0] : null,
            no_hp: pegawai.no_hp,
            email: pegawai.email,
            alamat: pegawai.alamat,
            kategori_pegawai: pegawai.kategori_pegawai,
            unit_kerja: pegawai.unit_kerja,
            divisi: pegawai.divisi,
            jabatan: pegawai.jabatan,
            mata_pelajaran: pegawai.mata_pelajaran,
            pendidikan_terakhir: pegawai.pendidikan_terakhir,
            status_pernikahan: pegawai.status_pernikahan,
            foto_url: pegawai.foto_url } : null}
          initialMapel={pegawai?.mata_pelajaran || ""}
          needsSetup={needsSetup}
          missingFields={missingFields}
          userName={session.nama || "Ustadz"}
          userRole={session.role || "guru"}
        />
      )}
    </div>
  );
}
