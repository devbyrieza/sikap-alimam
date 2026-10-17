import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { getLiveSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";
import TeacherMapelSetupModal from "@/components/TeacherMapelSetupModal";

/** Banner peringatan bila pengguna masih memakai password bawaan sistem. */
function DefaultPasswordBanner() {
  return (
    <div
      role="alert"
      className="no-print print:hidden mb-4 flex flex-col gap-3 rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 p-4 text-[13px] text-orange-900 shadow-md shadow-orange-600/10 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6"
    >
      <div className="flex items-start gap-3 sm:items-center">
        <span className="shrink-0 rounded-xl bg-orange-500 p-2 text-white shadow-sm" aria-hidden="true">
          <ShieldAlert size={18} />
        </span>
        <p className="leading-relaxed">
          <strong>Peringatan Keamanan:</strong> Anda masih menggunakan password default sistem. Segera perbarui
          kata sandi Anda demi keamanan data pesantren.
        </p>
      </div>
      <a
        href="/profile"
        className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2 sm:w-auto"
      >
        Ganti Password
      </a>
    </div>
  );
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getLiveSession();
  if (!session) redirect("/login");

  const liveRole = session.role || "";
  const userRoles = liveRole.toLowerCase().split(",").map((r) => r.trim());
  const isWaliSantri =
    userRoles.includes("wali_santri") || userRoles.includes("orang_tua") || userRoles.includes("wali");

  let pegawai = null;
  if (!isWaliSantri) {
    try {
      if (session.asatidz_id) {
        pegawai = await prisma.pegawai.findUnique({
          where: { id: session.asatidz_id },
        });
      }

      if (!pegawai && session.userId) {
        pegawai = await prisma.pegawai.findFirst({
          where: {
            OR: [
              { user_id: session.userId },
              { email: session.email },
              { nama_lengkap: { equals: session.nama || "", mode: "insensitive" } },
            ],
          },
        });
      }
    } catch (e) {
      console.error("DashboardLayout: Error fetching pegawai:", e);
    }
  }

  // Cek kelengkapan data civitas & guru
  const missingFields: string[] = [];
  let needsSetup = false;

  const isDemoAccount =
    session.email?.includes("pribadi.guru") ||
    session.email?.includes("presentasi.guru") ||
    session.email?.includes("demo");

  if (!isWaliSantri && !isDemoAccount) {
    const kategori = (pegawai?.kategori_pegawai || "").toUpperCase();
    const isGuru =
      userRoles.some(
        (r) => r.includes("guru") || r.includes("asatidz") || r.includes("pengajar") || r.includes("wali_kelas"),
      ) ||
      userRoles.includes("user") ||
      kategori.includes("GURU") ||
      kategori.includes("ASATIDZ");

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
      <Sidebar
        user={{
          nama: session.nama || "",
          role: liveRole,
          email: session.email || "",
          originalRole: session.originalRole,
          // Foto profil dipakai Sidebar bila ada; bila kosong, Sidebar menampilkan inisial.
          foto_url: pegawai?.foto_url || undefined,
        }}
      />

      <main className="app-content">
        {session.is_default_password && <DefaultPasswordBanner />}
        {children}
      </main>

      {/* Modal onboarding & kelengkapan data civitas */}
      {!isWaliSantri && (
        <TeacherMapelSetupModal
          initialPegawai={
            pegawai
              ? {
                  id: pegawai.id,
                  nama_lengkap: pegawai.nama_lengkap,
                  nama_panggilan: pegawai.nama_panggilan,
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
                  foto_url: pegawai.foto_url,
                }
              : null
          }
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