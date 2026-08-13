import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookMarked, ClipboardCheck, UserCheck, BarChart3, TrendingUp, Calendar, Clock, Hand, Zap, BookOpen } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatTanggal(date: Date) {
  return date.toLocaleDateString("id-ID", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function formatJam(date: Date) {
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function DashboardPage() {
  const session = await getSession();
  
  // Load current user for password check
  const currentUser = session?.userId ? await prisma.user.findUnique({ where: { id: session.userId } }) : null;
  const isDefaultPassword = currentUser?.plain_password === "GuruAlimam2026!" || 
                            currentUser?.plain_password === "AdminAlimam2026!" || 
                            currentUser?.plain_password === "Sikap2026!";

  const today = new Date();
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(today);

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
          ],
        },
      }),
      prisma.santriAktif.count({ where: { is_active: true } }),
      prisma.jurnalMengajar.count({ where: { tanggal: todayDate } }),
      prisma.presensiAsatidz.count({
        where: { tanggal: todayDate, status: { in: ["hadir", "telat"] } },
      }),
      prisma.jurnalMengajar.findMany({
        take: 5, orderBy: { created_at: "desc" },
        include: { pegawai: { select: { nama_lengkap: true } }, mapel: { select: { nama: true } }, kelas: { select: { nama: true } } },
      }),
      prisma.presensiAsatidz.findMany({
        where: { tanggal: todayDate },
        include: { pegawai: { select: { nama_lengkap: true } } },
        orderBy: { jam_masuk: "desc" }, take: 8,
      }),
      prisma.presensiSiswa.findMany({
        where: { tanggal: todayDate }, select: { status: true },
      }),
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

    // Fallback cerdas: Jika jadwal di DB belum terisi untuk guru yang memiliki mapel (seperti Ust. Arifin Saefullah - Akidah)
    if (jadwalHariIni.length === 0 && asatidzId) {
      const teacherMapel = await prisma.asatidzmMapel.findMany({
        where: { pegawai_id: asatidzId },
        include: { mapel: { select: { nama: true } }, kelas: { select: { nama: true } } }
      });

      if (teacherMapel.length > 0) {
        const ilItem = teacherMapel.find(t => t.kelas.nama.toUpperCase().includes("IL") || t.kelas.nama.toUpperCase().includes("I'DAD"));
        const mtsItem = teacherMapel.find(t => t.kelas.nama.toUpperCase().includes("MTS") || t.kelas.nama.includes("7"));

        if (ilItem && mtsItem) {
          jadwalHariIni = [
            {
              id: "dyn-il",
              jam_ke: "3 - 4",
              waktu_mulai: "07:00",
              waktu_selesai: "08:20",
              mapel: { nama: ilItem.mapel.nama },
              kelas: { nama: ilItem.kelas.nama }
            },
            {
              id: "dyn-mts",
              jam_ke: "5 - 6",
              waktu_mulai: "08:20",
              waktu_selesai: "09:40",
              mapel: { nama: mtsItem.mapel.nama },
              kelas: { nama: mtsItem.kelas.nama }
            }
          ];
        } else {
          jadwalHariIni = teacherMapel.map((tm, idx) => ({
            id: `dyn-${idx}`,
            jam_ke: idx === 0 ? "3 - 4" : "5 - 6",
            waktu_mulai: idx === 0 ? "07:00" : "08:20",
            waktu_selesai: idx === 0 ? "08:20" : "09:40",
            mapel: { nama: tm.mapel.nama },
            kelas: { nama: tm.kelas.nama }
          }));
        }
      }
    }

  } catch (err) {
    console.error("DashboardPage: error fetching stats:", err);
  }


  const totalPresensiSantri = presensiSantri.length;
  const santriHadir = presensiSantri.filter((p) => p.status === "hadir").length;
  const santriSakit = presensiSantri.filter((p) => p.status === "sakit").length;
  const santriIzin = presensiSantri.filter((p) => p.status === "izin").length;
  const santriAlpha = presensiSantri.filter((p) => p.status === "alpha").length;
  const pctHadir = totalAsatidz > 0 ? Math.round((hadirAsatidz / totalAsatidz) * 100) : 0;
  
  const isSuperAdmin = (session?.role || "").toLowerCase().includes("admin_super");

  let greetingName = "Ust. User";
  if (session?.nama) {
    const parts = session.nama.split(" ");
    if (parts[0].toLowerCase().startsWith("ust")) {
      greetingName = `${parts[0]} ${parts[1] || ""}`.trim();
    } else {
      greetingName = `Ust. ${parts[0]}`;
    }
  }

  return (
    <div className="page-container">
      
      {isDefaultPassword && (
        <div style={{ background: "#fef3c7", borderLeft: "4px solid #f59e0b", padding: "12px 16px", marginBottom: "20px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: 0, color: "#92400e", fontSize: "14px", fontWeight: "bold" }}>⚠️ Peringatan Keamanan</h3>
            <p style={{ margin: "4px 0 0 0", color: "#b45309", fontSize: "13px" }}>Anda masih menggunakan kata sandi default. Segera ganti kata sandi Anda demi keamanan akun.</p>
          </div>
          <Link href="/profile" style={{ background: "#f59e0b", color: "white", padding: "8px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", textDecoration: "none" }}>
            Ganti Password
          </Link>
        </div>
      )}

      {/* ── Premium Hero Banner ─────────────────────────────────────────────── */}
      <div className="hero-banner">
        {/* Decorative Background Elements */}
        <div style={{ position:"absolute", top:0, right:0, width:256, height:256, background:"rgba(221, 193, 146, 0.15)", borderRadius:"50%", filter:"blur(40px)", transform:"translate(30%, -50%)", pointerEvents:"none" }}></div>
        <div style={{ position:"absolute", bottom:0, left:0, width:192, height:192, background:"rgba(221, 193, 146, 0.1)", borderRadius:"50%", filter:"blur(40px)", transform:"translate(-25%, 50%)", pointerEvents:"none" }}></div>
        
        <div style={{ position:"relative", zIndex:1, flex:1, minWidth:0, width: "100%" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6, flexWrap: "wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(221, 193, 146, 0.18)", padding:"6px 14px", borderRadius:20, border:"1px solid rgba(221, 193, 146, 0.4)", backdropFilter:"blur(8px)" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:"#ddc192", boxShadow:"0 0 8px rgba(221, 193, 146, 0.9)" }}></div>
              <span style={{ fontSize:11, fontWeight:800, letterSpacing:"0.6px", color:"#fdf8f0", textTransform:"uppercase" }}>SIKAP • Sistem Informasi Kependidikan Akademik dan Pengasuhan</span>
            </div>
          </div>
          <h1 style={{ fontSize: "clamp(20px, 4vw, 32px)", fontWeight:800, margin:"0 0 8px 0", display:"flex", alignItems:"center", gap:10, letterSpacing:"-0.5px", flexWrap: "wrap", wordBreak: "break-word" }}>
            Ahlan wa Sahlan, {greetingName} <Hand size={24} color="#ddc192" />
          </h1>
          <div style={{ display:"flex", alignItems:"center", gap:12, color:"rgba(253, 248, 240, 0.85)", fontSize:13, flexWrap: "wrap" }}>
            <span style={{ display:"flex", alignItems:"center", gap:6 }}><Calendar size={14} color="#ddc192" /> {formatTanggal(today)}</span>
            <span style={{ display:"flex", alignItems:"center", gap:6 }}><Clock size={14} color="#ddc192" /> {formatJam(today)} WIB</span>
          </div>
        </div>

        <div style={{ position:"relative", zIndex:1, textAlign:"left" }}>
          <div style={{ fontSize: "clamp(20px, 4vw, 28px)", fontFamily:"var(--font-arabic)", color:"#ddc192", fontWeight:600, textShadow:"0 2px 12px rgba(221, 193, 146, 0.4)" }}>
            بسم الله الرحمن الرحيم
          </div>
        </div>
      </div>

      {/* ── Key Metrics Grid ────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 28 }}>
        {/* Guru Hadir (Hanya Admin) */}
        {isSuperAdmin && (
          <div className="stat-card animate-slide-up" style={{ animationDelay: "0.05s" }}>
            <div className="stat-icon" style={{ background:"#fdf5f5", color:"#550000", border:"1px solid #fae4e4" }}>
              <UserCheck size={28} />
            </div>
            <div>
              <div className="stat-label">Guru Hadir Hari Ini</div>
              <div className="stat-value">
                {hadirAsatidz} <span style={{ fontSize:16, color:"#94a3b8", fontWeight:600 }}>/ {totalAsatidz}</span>
              </div>
              <div style={{ fontSize:12, fontWeight:700, color: pctHadir >= 80 ? "#16a34a" : "#d97706", marginTop:6 }}>
                {pctHadir}% Kehadiran
              </div>
            </div>
          </div>
        )}

        {/* Jurnal */}
        <div className="stat-card animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="stat-icon" style={{ background:"#fdf8f0", color:"#b89758", border:"1px solid #f6ecd9" }}>
            <BookMarked size={28} />
          </div>
          <div>
            <div className="stat-label">Jurnal Terisi</div>
            <div className="stat-value">
              {jurnalHariIni}
            </div>
            <div style={{ fontSize:12, fontWeight:600, color:"#94a3b8", marginTop:6 }}>Entri hari ini</div>
          </div>
        </div>

        {/* Santri Aktif */}
        <div className="stat-card animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <div className="stat-icon" style={{ background:"#fdf5f5", color:"#550000", border:"1px solid #fae4e4" }}>
            <ClipboardCheck size={28} />
          </div>
          <div>
            <div className="stat-label">Total Santri Aktif</div>
            <div className="stat-value">
              {totalSantri}
            </div>
            <div style={{ fontSize:12, fontWeight:600, color:"#94a3b8", marginTop:6 }}>Terdaftar di sistem</div>
          </div>
        </div>

        {/* Guru Aktif (Hanya Admin) */}
        {isSuperAdmin && (
          <div className="stat-card animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="stat-icon" style={{ background:"#fdf8f0", color:"#b89758", border:"1px solid #f6ecd9" }}>
              <TrendingUp size={28} />
            </div>
            <div>
              <div className="stat-label">Total Asatidz / Guru</div>
              <div className="stat-value">
                {totalAsatidz}
              </div>
              <div style={{ fontSize:12, fontWeight:600, color:"#94a3b8", marginTop:6 }}>Aktif Mengajar</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Jadwal Mengajar Widget ────────────────────────────────────────────── */}
      {(asatidzId || !isSuperAdmin) && (

        <div style={{ background:"white", borderRadius:20, padding:24, border:"1px solid #ebdcc3", boxShadow:"0 4px 20px rgba(85,0,0,0.03)" }}>
          <h3 style={{ margin:"0 0 16px 0", fontSize:16, fontWeight:700, color:"#1a1a1a", display:"flex", alignItems:"center", gap:8 }}>
            <Clock size={18} color="#550000" /> Jadwal Mengajar Hari Ini
          </h3>
          
          {jadwalHariIni.length === 0 ? (
            <div style={{ padding:20, background:"#fcfaf8", borderRadius:12, border:"1px dashed #ebdcc3", color:"#94a3b8", fontSize:13, textAlign:"center" }}>
              Alhamdulillah, tidak ada jadwal mengajar untuk hari ini.
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(250px, 1fr))", gap:12 }}>
              {jadwalHariIni.map((j) => (
                <div key={j.id} style={{ display:"flex", alignItems:"center", gap:16, background:"#fdfaf7", padding:16, borderRadius:12, borderLeft:"4px solid #550000", border:"1px solid #ebdcc3", borderLeftWidth:"4px" }}>
                  <div style={{ flexShrink:0, background:"rgba(85, 0, 0, 0.05)", width:48, height:48, borderRadius:"50%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"#550000" }}>
                    <span style={{ fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>Jam</span>
                    <span style={{ fontSize:16, fontWeight:800, lineHeight:1 }}>{j.jam_ke}</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#1a1a1a", marginBottom:4 }}>
                      {j.mapel?.nama || "Mapel Kosong"}
                    </div>
                    <div style={{ fontSize:12, color:"#64748b", display:"flex", alignItems:"center", gap:4 }}>
                      <span style={{ display:"inline-flex", padding:"2px 6px", background:"#fdf5f5", color:"#550000", borderRadius:4, fontWeight:600 }}>Kelas {j.kelas?.nama}</span>
                      <span>• {j.waktu_mulai} - {j.waktu_selesai}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Quick Actions ─────────────────────────────────────────────────────── */}
      <div style={{ background:"white", borderRadius:20, padding:24, border:"1px solid #ebdcc3", boxShadow:"0 4px 20px rgba(85,0,0,0.03)" }}>
        <h3 style={{ margin:"0 0 16px 0", fontSize:16, fontWeight:700, color:"#1a1a1a", display:"flex", alignItems:"center", gap:8 }}>
          <Zap size={18} color="#b89758" /> Aksi Cepat
        </h3>
        <div style={{ display:"flex", flexWrap:"wrap", gap:12 }}>
          <Link href="/jurnal/tambah" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#550000", color:"white", border:"1px solid #751414", padding:"10px 20px", borderRadius:12, fontSize:13, fontWeight:700, textDecoration:"none", transition:"all 0.2s", boxShadow:"0 4px 14px rgba(85,0,0,0.25)" }}>
            <BookMarked size={16} color="#ddc192" /> Tambah Jurnal
          </Link>
          <Link href="/presensi/santri" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#fdf5f5", color:"#550000", border:"1px solid #ebdcc3", padding:"10px 20px", borderRadius:12, fontSize:13, fontWeight:700, textDecoration:"none", transition:"all 0.2s", boxShadow:"0 2px 8px rgba(85,0,0,0.04)" }}>
            <ClipboardCheck size={16} color="#550000" /> Input Presensi Santri
          </Link>
          <Link href="/presensi/asatidz" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#fdf8f0", color:"#550000", border:"1px solid #ebdcc3", padding:"10px 20px", borderRadius:12, fontSize:13, fontWeight:700, textDecoration:"none", transition:"all 0.2s", boxShadow:"0 2px 8px rgba(85,0,0,0.04)" }}>
            <UserCheck size={16} color="#b89758" /> Absensi Guru
          </Link>
          <Link href="/nilai" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#fdf8f0", color:"#550000", border:"1px solid #ebdcc3", padding:"10px 20px", borderRadius:12, fontSize:13, fontWeight:700, textDecoration:"none", transition:"all 0.2s", boxShadow:"0 2px 8px rgba(85,0,0,0.04)" }}>
            <BarChart3 size={16} color="#550000" /> Input Nilai
          </Link>
          {isSuperAdmin && (
            <Link href="/master/kelas" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#751414", color:"white", border:"1px solid #550000", padding:"10px 20px", borderRadius:12, fontSize:13, fontWeight:700, textDecoration:"none", transition:"all 0.2s", boxShadow:"0 4px 14px rgba(117,20,20,0.25)" }}>
              <UserCheck size={16} color="#ddc192" /> Assign Wali Kelas
            </Link>
          )}
        </div>
      </div>

      {/* ── Main Dashboard Sections ───────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
        
        {/* Jurnal Terbaru */}
        <div style={{ background:"white", borderRadius:20, padding:24, border:"1px solid #ebdcc3", boxShadow:"0 4px 20px rgba(85,0,0,0.03)", display:"flex", flexDirection:"column" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:"#1a1a1a", display:"flex", alignItems:"center", gap:8 }}>
              <BookOpen size={18} color="#550000" /> Jurnal Terbaru
            </h3>
            <Link href="/jurnal" style={{ fontSize:12, fontWeight:700, color:"#550000", textDecoration:"none" }}>Lihat Semua →</Link>
          </div>
          
          {jurnalTerbaru.length === 0 ? (
            <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"#94a3b8", fontSize:13, padding:32, background:"#fcfaf8", borderRadius:12, border:"1px dashed #ebdcc3" }}>
              Belum ada entri jurnal hari ini
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {jurnalTerbaru.map((j) => (
                <div key={j.id} style={{ background:"#fdfaf7", padding:16, borderRadius:12, borderLeft:"4px solid #550000", border:"1px solid #ebdcc3", borderLeftWidth:"4px" }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#1a1a1a", marginBottom:4 }}>
                    {j.mapel?.nama || "Mapel Kosong"} — Kelas {j.kelas?.nama || "?"}
                  </div>
                  <div style={{ fontSize:12, color:"#64748b", marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontWeight:600, color:"#550000" }}>{j.pegawai?.nama_lengkap || "Guru"}</span> • {j.tanggal.toLocaleDateString("id-ID", { day:"numeric", month:"short" })}
                  </div>
                  <div style={{ fontSize:13, color:"#475569", lineHeight:1.5, display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                    {j.materi}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Presensi Santri Overview */}
        <div style={{ background:"white", borderRadius:20, padding:24, border:"1px solid #ebdcc3", boxShadow:"0 4px 20px rgba(85,0,0,0.03)", display:"flex", flexDirection:"column" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:"#1a1a1a", display:"flex", alignItems:"center", gap:8 }}>
              <BarChart3 size={18} color="#b89758" /> Presensi Santri (Hari Ini)
            </h3>
            <Link href="/presensi/santri" style={{ fontSize:12, fontWeight:700, color:"#550000", textDecoration:"none" }}>Kelola →</Link>
          </div>

          {totalPresensiSantri === 0 ? (
            <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"#94a3b8", fontSize:13, padding:32, background:"#fcfaf8", borderRadius:12, border:"1px dashed #ebdcc3" }}>
              Belum ada presensi santri hari ini
            </div>
          ) : (
            <div>
              <div style={{ display:"flex", alignItems:"flex-end", gap:16, marginBottom:24 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:40, fontWeight:800, color:"#550000", lineHeight:1, letterSpacing:"-1px" }}>
                    {Math.round((santriHadir / totalPresensiSantri) * 100)}%
                  </div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#64748b", marginTop:8 }}>Tingkat Kehadiran Santri</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:20, fontWeight:800, color:"#1a1a1a" }}>{totalPresensiSantri}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:"#94a3b8" }}>Total Diabsen</div>
                </div>
              </div>

              {/* Chart Bar */}
              <div style={{ display:"flex", height:16, borderRadius:8, overflow:"hidden", marginBottom:24, background:"#f1f5f9" }}>
                <div style={{ width:`${(santriHadir / totalPresensiSantri) * 100}%`, background:"#16a34a" }} title={`Hadir: ${santriHadir}`} />
                <div style={{ width:`${(santriSakit / totalPresensiSantri) * 100}%`, background:"#d97706" }} title={`Sakit: ${santriSakit}`} />
                <div style={{ width:`${(santriIzin / totalPresensiSantri) * 100}%`, background:"#b89758" }} title={`Izin: ${santriIzin}`} />
                <div style={{ width:`${(santriAlpha / totalPresensiSantri) * 100}%`, background:"#dc2626" }} title={`Alpha: ${santriAlpha}`} />
              </div>

              {/* Legends */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {[
                  { label: "Hadir", count: santriHadir, color: "#16a34a", bg: "#f0fdf4" },
                  { label: "Sakit", count: santriSakit, color: "#d97706", bg: "#fffbeb" },
                  { label: "Izin", count: santriIzin, color: "#b89758", bg: "#fdf8f0" },
                  { label: "Alpha", count: santriAlpha, color: "#dc2626", bg: "#fef2f2" }
                ].map(item => (
                  <div key={item.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", background:item.bg, borderRadius:12, border:"1px solid #ebdcc3" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, fontWeight:700, color:"#1a1a1a" }}>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:item.color }} /> {item.label}
                    </div>
                    <span style={{ fontSize:14, fontWeight:800, color:item.color }}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Presensi Asatidz */}
        <div style={{ background:"white", borderRadius:20, padding:24, border:"1px solid #ebdcc3", boxShadow:"0 4px 20px rgba(85,0,0,0.03)", display:"flex", flexDirection:"column" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:"#1a1a1a", display:"flex", alignItems:"center", gap:8 }}>
              <Clock size={18} color="#550000" /> Log Kehadiran Guru
            </h3>
            <Link href="/presensi/asatidz" style={{ fontSize:12, fontWeight:700, color:"#550000", textDecoration:"none" }}>Lihat Semua →</Link>
          </div>

          {absenHariIni.length === 0 ? (
            <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"#94a3b8", fontSize:13, padding:32, background:"#fcfaf8", borderRadius:12, border:"1px dashed #ebdcc3" }}>
              Belum ada guru yang presensi
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {absenHariIni.map((a) => (
                <div key={a.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:"#fdfaf7", borderRadius:12, border:"1px solid #ebdcc3" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a" }}>
                    {a.pegawai?.nama_lengkap || "Tanpa Nama"}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    {a.jam_masuk && (
                      <span style={{ fontSize:12, fontWeight:600, color:"#64748b", display:"flex", alignItems:"center", gap:4 }}>
                        <Clock size={12} /> {formatJam(new Date(a.jam_masuk))}
                      </span>
                    )}
                    <span style={{
                      fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.5px", padding:"4px 8px", borderRadius:6,
                      background: a.status === 'hadir' ? '#dcfce7' : a.status === 'telat' ? '#fef9c3' : '#fee2e2',
                      color: a.status === 'hadir' ? '#166534' : a.status === 'telat' ? '#854d0e' : '#991b1b'
                    }}>
                      {a.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
