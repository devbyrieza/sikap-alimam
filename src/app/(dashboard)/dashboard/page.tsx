import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookMarked, ClipboardCheck, UserCheck, BarChart3, TrendingUp, Clock, Hand, Zap, BookOpen, AlertTriangle, ArrowRight, FileText, Award, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import RealtimeClock from "@/components/RealtimeClock";
import { syncScheduleFromPDF } from "@/lib/syncScheduleFromPDF";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatJam(date: Date) {
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit", minute: "2-digit",
    timeZone: "Asia/Jakarta"
  });
}

/* ── Komponen kecil (tampilan saja) ─────────────────────────────────────── */

function StatCard({ icon: Icon, tone, label, value, sub, subClass }: {
  icon: LucideIcon; tone: "maroon" | "gold"; label: string; value: ReactNode; sub: string; subClass?: string;
}) {
  const toneClass = tone === "maroon"
    ? "bg-[#fdf5f5] text-primary border border-[#fae4e4]"
    : "bg-[#fdf8f0] text-[#b89758] border border-[#f6ecd9]";
  return (
    <div className="stat-card">
      <div className={`stat-icon ${toneClass}`}><Icon size={28} /></div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        <div className={`mt-1.5 text-xs font-semibold ${subClass || "text-slate-400"}`}>{sub}</div>
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, iconClass, href, linkLabel, children }: {
  title: string; icon: LucideIcon; iconClass: string; href?: string; linkLabel?: string; children: ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-3xl border border-[#ebdcc3] bg-white p-6 shadow-sm shadow-primary/5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <Icon size={18} className={iconClass} /> {title}
        </h3>
        {href && (
          <Link href={href} className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
            {linkLabel} <ArrowRight size={14} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[#ebdcc3] bg-[#fcfaf8] p-8 text-center text-sm text-slate-400">
      {children}
    </div>
  );
}

function QuickLink({ href, icon: Icon, primary, children }: {
  href: string; icon: LucideIcon; primary?: boolean; children: ReactNode;
}) {
  const cls = primary
    ? "border-[#751414] bg-primary text-white shadow-md shadow-primary/25 hover:bg-primary-light"
    : "border-[#ebdcc3] bg-[#fdf8f0] text-primary hover:bg-[#fdf5f5]";
  return (
    <Link href={href} className={`inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-[13px] font-bold transition-colors ${cls}`}>
      <Icon size={16} className={primary ? "text-[#ddc192]" : "text-primary"} /> {children}
    </Link>
  );
}

export default async function DashboardPage() {
  const session = await getSession();
  const userRoles = (session?.role || "").toLowerCase().split(",").map(r => r.trim());
  const isWaliSantri = userRoles.includes("wali_santri") || userRoles.includes("orang_tua") || userRoles.includes("wali");
  if (isWaliSantri) { const { redirect } = await import("next/navigation"); redirect("/wali/rapor"); }
  
  // Auto-sync database jadwal pelajaran jika belum terisi
  await syncScheduleFromPDF().catch(() => {});

  // Load current user for password check
  const currentUser = session?.userId ? await prisma.user.findUnique({ where: { id: session.userId } }) : null;
  const isDefaultPassword = currentUser?.plain_password === "GuruAlimam2026!" || 
                            currentUser?.plain_password === "AdminAlimam2026!" || 
                            currentUser?.plain_password === "HalaqohAlimam2026!" || 
                            currentUser?.plain_password === "Sikap2026!";

  const today = new Date();
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(today);

  // Stats paralel
  let totalAsatidz = 0;
  let totalSantri = 0;
  let jurnalHariIni = 0;
  let hadirAsatidz = 0;
  let jurnalTerbaru: any[] = [];
  let absenHariIni: any[] = [];
  let presensiSantri: any[] = [];
  let jadwalHariIni: any[] = [];
  let asatidzId: string | null = session?.asatidz_id || null;

  try {
    const todayDate = new Date(todayStr);
    
    // Cari nama hari dalam bahasa Indonesia
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const currentDayName = dayNames[today.getDay()];

    // Resolved Asatidz ID untuk user yang sedang login
    if (!asatidzId && session?.userId) {
      const p = await prisma.pegawai.findFirst({
        where: {
          OR: [
            { user_id: session.userId },
            { email: session.email },
            ...(session.nama ? [{ nama_lengkap: { contains: session.nama.split(" ")[0], mode: "insensitive" as const } }] : [])
          ]
        },
        select: { id: true, nama_lengkap: true, mata_pelajaran: true }
      });
      if (p) asatidzId = p.id;
    }

    const results = await Promise.allSettled([
      prisma.pegawai.count({
        where: {
          OR: [
            { kategori_pegawai: { in: ["ASATIDZ", "GURU", "Guru", "asatidz", "guru", "PENGAJAR"] } },
            { kategori_pegawai: { contains: "ASATIDZ", mode: "insensitive" } },
            { kategori_pegawai: { contains: "GURU", mode: "insensitive" } },
            { jabatan: { contains: "Guru", mode: "insensitive" } },
            { jabatan: { contains: "Pengajar", mode: "insensitive" } },
          ] } }),
      prisma.santriAktif.count({ where: { is_active: true } }),
      prisma.jurnalMengajar.count({ where: { tanggal: todayDate } }),
      prisma.presensiAsatidz.count({
        where: { tanggal: todayDate, status: { in: ["hadir", "telat"] } } }),
      prisma.jurnalMengajar.findMany({
        take: 5, orderBy: { created_at: "desc" },
        include: { pegawai: { select: { nama_lengkap: true } }, mapel: { select: { nama: true } }, kelas: { select: { nama: true } } } }),
      prisma.presensiAsatidz.findMany({
        where: { tanggal: todayDate },
        include: { pegawai: { select: { nama_lengkap: true } } },
        orderBy: { jam_masuk: "desc" }, take: 8 }),
      prisma.presensiSiswa.findMany({
        where: { tanggal: todayDate }, select: { status: true } }),
      // Query 7: Jadwal Mengajar Guru
      asatidzId ? prisma.jadwalPelajaran.findMany({
        where: { pegawai_id: asatidzId, hari: currentDayName },
        include: { mapel: { select: { nama: true } }, kelas: { select: { nama: true } } },
        orderBy: { jam_ke: "asc" }
      }) : Promise.resolve([])
    ]);

    if (results[0].status === "fulfilled") totalAsatidz = results[0].value;
    if (results[1].status === "fulfilled") totalSantri = results[1].value;
    if (results[2].status === "fulfilled") jurnalHariIni = results[2].value;
    if (results[3].status === "fulfilled") hadirAsatidz = results[3].value;
    if (results[4].status === "fulfilled") jurnalTerbaru = results[4].value || [];
    if (results[5].status === "fulfilled") absenHariIni = results[5].value || [];
    if (results[6].status === "fulfilled") presensiSantri = results[6].value || [];
    if (results[7].status === "fulfilled") jadwalHariIni = (results[7].value || []) as any[];

  } catch (err) {
    console.error("DashboardPage: error fetching stats:", err);
  }

  const totalPresensiSantri = presensiSantri.length;
  const santriHadir = presensiSantri.filter((p) => p.status === "hadir").length;
  const santriSakit = presensiSantri.filter((p) => p.status === "sakit").length;
  const santriIzin = presensiSantri.filter((p) => p.status === "izin").length;
  const santriAlpha = presensiSantri.filter((p) => p.status === "alpha").length;
  const pctHadir = totalAsatidz > 0 ? Math.round((hadirAsatidz / totalAsatidz) * 100) : 0;
  
  const userRolesStr = (session?.role || "").toUpperCase();
  const isSuperAdmin = userRolesStr.includes("ADMIN_SUPER");
  const isGuru = userRolesStr.includes("GURU") || userRolesStr.includes("TEACHER");
  const isPengampu = userRolesStr.includes("MUSYRIF") || userRolesStr.includes("PENGAMPU");
  const isWaliKelas = userRolesStr.includes("WALI_KELAS");

  let greetingName = "Ust. User";
  if (session?.nama_panggilan) {
    greetingName = `Ust. ${session.nama_panggilan}`;
  } else if (session?.nama) {
    const parts = session.nama.split(" ");
    if (parts[0].toLowerCase().startsWith("ust")) {
      greetingName = `${parts[0]} ${parts[1] || ""}`.trim();
    } else {
      greetingName = `Ust. ${parts[0]}`;
    }
  }

  const pct = (n: number) => (totalPresensiSantri > 0 ? (n / totalPresensiSantri) * 100 : 0);
  const statusSantri = [
    { label: "Hadir", count: santriHadir, dot: "bg-[#16a34a]", text: "text-[#16a34a]", bg: "bg-[#f0fdf4]" },
    { label: "Sakit", count: santriSakit, dot: "bg-[#d97706]", text: "text-[#d97706]", bg: "bg-[#fffbeb]" },
    { label: "Izin", count: santriIzin, dot: "bg-[#b89758]", text: "text-[#b89758]", bg: "bg-[#fdf8f0]" },
    { label: "Alpha", count: santriAlpha, dot: "bg-[#dc2626]", text: "text-[#dc2626]", bg: "bg-[#fef2f2]" },
  ];

  return (
    <div className="page-container">

      {isDefaultPassword && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:px-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle size={18} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-amber-900">Peringatan keamanan</h3>
              <p className="mt-0.5 text-[13px] text-amber-800">
                Anda masih memakai kata sandi default. Segera ganti demi keamanan akun.
              </p>
            </div>
          </div>
          <Link href="/profile" className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600">
            Ganti password
          </Link>
        </div>
      )}

      {/* Hero */}
      <div className="hero-banner">
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-[30%] rounded-full bg-[#ddc192]/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 -translate-x-1/4 translate-y-1/2 rounded-full bg-[#ddc192]/10 blur-3xl" />

        <div className="relative z-10 w-full min-w-0 flex-1">
          <div className="mb-3 inline-flex flex-wrap items-center gap-2 rounded-full border border-[#ddc192]/40 bg-[#ddc192]/20 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#fdf8f0] backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-[#ddc192] shadow-[0_0_8px_rgba(221,193,146,0.9)]" />
            SIKAP • Sistem Informasi Kependidikan Akademik dan Pengasuhan
          </div>
          <h1 className="mb-2 flex flex-wrap items-center gap-2.5 break-words text-[clamp(20px,4vw,32px)] font-extrabold">
            Ahlan wa Sahlan, {greetingName} <Hand size={24} color="#ddc192" />
          </h1>
          <RealtimeClock />
        </div>

        <div
          className="font-arabic relative z-10 text-left text-[clamp(20px,4vw,28px)] font-semibold text-[#ddc192]"
          style={{ textShadow: "0 2px 12px rgba(221, 193, 146, 0.4)" }}
        >
          بسم الله الرحمن الرحيم
        </div>
      </div>

      {/* Metrik utama */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {isSuperAdmin && (
          <StatCard
            icon={UserCheck} tone="maroon" label="Guru hadir hari ini"
            value={<>{hadirAsatidz} <span className="text-base font-semibold text-slate-400">/ {totalAsatidz}</span></>}
            sub={`${pctHadir}% kehadiran`}
            subClass={pctHadir >= 80 ? "!text-[#16a34a] !font-bold" : "!text-[#d97706] !font-bold"}
          />
        )}
        <StatCard icon={BookMarked} tone="gold" label="Jurnal terisi" value={jurnalHariIni} sub="Entri hari ini" />
        <StatCard icon={ClipboardCheck} tone="maroon" label="Total santri aktif" value={totalSantri} sub="Terdaftar di sistem" />
        {isSuperAdmin && (
          <StatCard icon={TrendingUp} tone="gold" label="Total asatidz / guru" value={totalAsatidz} sub="Aktif mengajar" />
        )}
      </div>

      {/* Jadwal mengajar */}
      {(asatidzId || !isSuperAdmin) && (
        <SectionCard title="Jadwal mengajar hari ini" icon={Clock} iconClass="text-primary">
          {jadwalHariIni.length === 0 ? (
            <Empty>Alhamdulillah, tidak ada jadwal mengajar untuk hari ini.</Empty>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {jadwalHariIni.map((j) => (
                <div key={j.id} className="flex items-center gap-4 rounded-2xl border border-l-4 border-[#ebdcc3] border-l-primary bg-[#fdfaf7] p-4">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full bg-primary/5 text-primary">
                    <span className="text-[10px] font-semibold uppercase">Jam</span>
                    <span className="text-base font-extrabold leading-none">{j.jam_ke}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 truncate text-sm font-bold text-slate-900">{j.mapel?.nama || "Mapel kosong"}</div>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      <span className="rounded bg-[#fdf5f5] px-1.5 py-0.5 font-semibold text-primary">Kelas {j.kelas?.nama}</span>
                      <span>{j.waktu_mulai} - {j.waktu_selesai}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* Aksi cepat */}
      <SectionCard title="Aksi cepat" icon={Zap} iconClass="text-[#b89758]">
        <div className="flex flex-wrap gap-3">
          {(isGuru || isSuperAdmin) && (
            <>
              <QuickLink href="/jurnal/tambah" icon={BookMarked} primary>Tambah jurnal</QuickLink>
              <QuickLink href="/presensi/santri" icon={ClipboardCheck}>Presensi kelas</QuickLink>
              <QuickLink href="/nilai" icon={BarChart3}>Input nilai</QuickLink>
            </>
          )}
          {(isPengampu || isSuperAdmin) && (
            <>
              <QuickLink href="/halaqoh" icon={BookOpen} primary={!isGuru}>Setoran halaqoh</QuickLink>
              <QuickLink href="/halaqoh/ujian" icon={Award}>Ujian tahfidz</QuickLink>
              <QuickLink href="/halaqoh/laporan" icon={FileText}>Laporan halaqoh</QuickLink>
            </>
          )}
          {(isWaliKelas || isSuperAdmin) && (
            <QuickLink href="/wali-kelas" icon={Users}>Hub wali kelas</QuickLink>
          )}
          {(isGuru || isSuperAdmin) && (
            <QuickLink href="/presensi/asatidz" icon={UserCheck}>Absensi guru</QuickLink>
          )}
          {isSuperAdmin && (
            <QuickLink href="/master/kelas" icon={UserCheck} primary>Assign wali kelas</QuickLink>
          )}
        </div>
      </SectionCard>

      {/* Bagian utama */}
      <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">

        {/* Jurnal terbaru */}
        <SectionCard title="Jurnal terbaru" icon={BookOpen} iconClass="text-primary" href="/jurnal" linkLabel="Lihat semua">
          {jurnalTerbaru.length === 0 ? (
            <Empty>Belum ada entri jurnal hari ini</Empty>
          ) : (
            <div className="flex flex-col gap-3">
              {jurnalTerbaru.map((j) => (
                <div key={j.id} className="rounded-2xl border border-l-4 border-[#ebdcc3] border-l-primary bg-[#fdfaf7] p-4">
                  <div className="mb-1 text-sm font-bold text-slate-900">
                    {j.mapel?.nama || "Mapel kosong"} — Kelas {j.kelas?.nama || "?"}
                  </div>
                  <div className="mb-2 text-xs text-slate-500">
                    <span className="font-semibold text-primary">{j.pegawai?.nama_lengkap || "Guru"}</span>
                    {" • "}
                    {j.tanggal.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                  </div>
                  <div className="line-clamp-1 text-[13px] text-slate-600">{j.materi}</div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Presensi santri */}
        <SectionCard title="Presensi santri hari ini" icon={BarChart3} iconClass="text-[#b89758]" href="/presensi/santri" linkLabel="Kelola">
          {totalPresensiSantri === 0 ? (
            <Empty>Belum ada presensi santri hari ini</Empty>
          ) : (
            <div>
              <div className="mb-6 flex items-end gap-4">
                <div className="flex-1">
                  <div className="text-[40px] font-extrabold leading-none text-primary">
                    {Math.round(pct(santriHadir))}%
                  </div>
                  <div className="mt-2 text-[13px] font-semibold text-slate-500">Tingkat kehadiran santri</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold text-slate-900">{totalPresensiSantri}</div>
                  <div className="text-xs font-semibold text-slate-400">Total diabsen</div>
                </div>
              </div>

              <div className="mb-6 flex h-4 overflow-hidden rounded-lg bg-slate-100">
                {statusSantri.map((s) => (
                  <div key={s.label} className={s.dot} style={{ width: `${pct(s.count)}%` }} title={`${s.label}: ${s.count}`} />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {statusSantri.map((s) => (
                  <div key={s.label} className={`flex items-center justify-between rounded-xl border border-[#ebdcc3] px-4 py-3 ${s.bg}`}>
                    <div className="flex items-center gap-2 text-[13px] font-bold text-slate-900">
                      <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} /> {s.label}
                    </div>
                    <span className={`text-sm font-extrabold ${s.text}`}>{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        {/* Kehadiran guru */}
        <SectionCard title="Log kehadiran guru" icon={Clock} iconClass="text-primary" href="/presensi/asatidz" linkLabel="Lihat semua">
          {absenHariIni.length === 0 ? (
            <Empty>Belum ada guru yang presensi</Empty>
          ) : (
            <div className="flex flex-col gap-2.5">
              {absenHariIni.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#ebdcc3] bg-[#fdfaf7] px-4 py-3">
                  <div className="min-w-0 truncate text-[13px] font-bold text-slate-900">
                    {a.pegawai?.nama_lengkap || "Tanpa nama"}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {a.jam_masuk && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                        <Clock size={12} /> {formatJam(new Date(a.jam_masuk))}
                      </span>
                    )}
                    <span
                      className={`rounded-md px-2 py-1 text-[10px] font-extrabold uppercase ${
                        a.status === "hadir"
                          ? "bg-green-100 text-green-800"
                          : a.status === "telat"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

      </div>
    </div>
  );
}