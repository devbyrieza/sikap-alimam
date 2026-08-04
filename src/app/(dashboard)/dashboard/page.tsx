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

  try {
    const todayDate = new Date(todayStr);
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
    ]);

    if (results[0].status === "fulfilled") totalAsatidz = results[0].value;
    if (results[1].status === "fulfilled") totalSantri = results[1].value;
    if (results[2].status === "fulfilled") jurnalHariIni = results[2].value;
    if (results[3].status === "fulfilled") hadirAsatidz = results[3].value;
    if (results[4].status === "fulfilled") jurnalTerbaru = results[4].value || [];
    if (results[5].status === "fulfilled") absenHariIni = results[5].value || [];
    if (results[6].status === "fulfilled") presensiSantri = results[6].value || [];
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

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* ── Premium Hero Banner ─────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #380000 0%, #550000 50%, #751414 100%)",
        borderRadius: 24, padding: "32px 36px", color: "white",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 20,
        boxShadow: "0 16px 40px rgba(85, 0, 0, 0.35), 0 4px 16px rgba(221, 193, 146, 0.2)",
        border: "1px solid rgba(221, 193, 146, 0.25)",
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative Background Elements */}
        <div style={{ position:"absolute", top:0, right:0, width:256, height:256, background:"rgba(221, 193, 146, 0.15)", borderRadius:"50%", filter:"blur(40px)", transform:"translate(30%, -50%)", pointerEvents:"none" }}></div>
        <div style={{ position:"absolute", bottom:0, left:0, width:192, height:192, background:"rgba(221, 193, 146, 0.1)", borderRadius:"50%", filter:"blur(40px)", transform:"translate(-25%, 50%)", pointerEvents:"none" }}></div>
        
        <div style={{ position:"relative", zIndex:1, flex:1, minWidth:300 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(221, 193, 146, 0.15)", padding:"6px 12px", borderRadius:20, border:"1px solid rgba(221, 193, 146, 0.35)", backdropFilter:"blur(8px)" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:"#ddc192", boxShadow:"0 0 8px rgba(221, 193, 146, 0.9)" }}></div>
              <span style={{ fontSize:11, fontWeight:700, letterSpacing:"1px", color:"#fdf8f0", textTransform:"uppercase" }}>Sistem Informasi Terpadu</span>
            </div>
          </div>
          <h1 style={{ fontSize:32, fontWeight:800, margin:"0 0 8px 0", display:"flex", alignItems:"center", gap:12, letterSpacing:"-0.5px" }}>
            Ahlan wa Sahlan, {session?.nama ? session.nama.split(" ")[0] : "User"} <Hand size={28} color="#ddc192" />
          </h1>
          <div style={{ display:"flex", alignItems:"center", gap:16, color:"rgba(253, 248, 240, 0.85)", fontSize:14 }}>
            <span style={{ display:"flex", alignItems:"center", gap:6 }}><Calendar size={14} color="#ddc192" /> {formatTanggal(today)}</span>
            <span style={{ display:"flex", alignItems:"center", gap:6 }}><Clock size={14} color="#ddc192" /> {formatJam(today)} WIB</span>
          </div>
        </div>

        <div style={{ position:"relative", zIndex:1, textAlign:"right" }}>
          <div style={{ fontSize:28, fontFamily:"var(--font-arabic)", color:"#ddc192", fontWeight:600, textShadow:"0 2px 12px rgba(221, 193, 146, 0.4)" }}>
            بسم الله الرحمن الرحيم
          </div>
        </div>
      </div>

      {/* ── Key Metrics Grid ────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
        {/* Guru Hadir */}
        <div style={{ background:"white", padding:24, borderRadius:20, border:"1px solid #ebdcc3", boxShadow:"0 4px 20px rgba(85,0,0,0.03)", display:"flex", alignItems:"center", gap:16, transition:"transform 0.2s" }}>
          <div style={{ width:56, height:56, borderRadius:16, background:"#fdf5f5", color:"#550000", border:"1px solid #fae4e4", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <UserCheck size={28} />
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:"#64748b", marginBottom:4 }}>Guru Hadir Hari Ini</div>
            <div style={{ fontSize:24, fontWeight:800, color:"#1a1a1a", lineHeight:1 }}>
              {hadirAsatidz} <span style={{ fontSize:16, color:"#94a3b8", fontWeight:600 }}>/ {totalAsatidz}</span>
            </div>
            <div style={{ fontSize:12, fontWeight:700, color: pctHadir >= 80 ? "#16a34a" : "#d97706", marginTop:6 }}>
              {pctHadir}% Kehadiran
            </div>
          </div>
        </div>

        {/* Jurnal */}
        <div style={{ background:"white", padding:24, borderRadius:20, border:"1px solid #ebdcc3", boxShadow:"0 4px 20px rgba(85,0,0,0.03)", display:"flex", alignItems:"center", gap:16, transition:"transform 0.2s" }}>
          <div style={{ width:56, height:56, borderRadius:16, background:"#fdf8f0", color:"#b89758", border:"1px solid #f6ecd9", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <BookMarked size={28} />
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:"#64748b", marginBottom:4 }}>Jurnal Terisi</div>
            <div style={{ fontSize:24, fontWeight:800, color:"#1a1a1a", lineHeight:1 }}>
              {jurnalHariIni}
            </div>
            <div style={{ fontSize:12, fontWeight:600, color:"#94a3b8", marginTop:6 }}>Entri hari ini</div>
          </div>
        </div>

        {/* Santri Aktif */}
        <div style={{ background:"white", padding:24, borderRadius:20, border:"1px solid #ebdcc3", boxShadow:"0 4px 20px rgba(85,0,0,0.03)", display:"flex", alignItems:"center", gap:16, transition:"transform 0.2s" }}>
          <div style={{ width:56, height:56, borderRadius:16, background:"#fdf5f5", color:"#550000", border:"1px solid #fae4e4", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <ClipboardCheck size={28} />
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:"#64748b", marginBottom:4 }}>Total Santri Aktif</div>
            <div style={{ fontSize:24, fontWeight:800, color:"#1a1a1a", lineHeight:1 }}>
              {totalSantri}
            </div>
            <div style={{ fontSize:12, fontWeight:600, color:"#94a3b8", marginTop:6 }}>Terdaftar di sistem</div>
          </div>
        </div>

        {/* Guru Aktif */}
        <div style={{ background:"white", padding:24, borderRadius:20, border:"1px solid #ebdcc3", boxShadow:"0 4px 20px rgba(85,0,0,0.03)", display:"flex", alignItems:"center", gap:16, transition:"transform 0.2s" }}>
          <div style={{ width:56, height:56, borderRadius:16, background:"#fdf8f0", color:"#b89758", border:"1px solid #f6ecd9", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <TrendingUp size={28} />
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:"#64748b", marginBottom:4 }}>Total Guru & Staf</div>
            <div style={{ fontSize:24, fontWeight:800, color:"#1a1a1a", lineHeight:1 }}>
              {totalAsatidz}
            </div>
            <div style={{ fontSize:12, fontWeight:600, color:"#94a3b8", marginTop:6 }}>Data Kepegawaian</div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────────────────── */}
      <div style={{ background:"white", borderRadius:20, padding:24, border:"1px solid #ebdcc3", boxShadow:"0 4px 20px rgba(85,0,0,0.03)" }}>
        <h3 style={{ margin:"0 0 16px 0", fontSize:16, fontWeight:700, color:"#1a1a1a", display:"flex", alignItems:"center", gap:8 }}>
          <Zap size={18} color="#b89758" /> Aksi Cepat
        </h3>
        <div style={{ display:"flex", flexWrap:"wrap", gap:12 }}>
          <Link href="/jurnal/tambah" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#550000", color:"white", padding:"10px 20px", borderRadius:12, fontSize:13, fontWeight:700, textDecoration:"none", transition:"all 0.2s", boxShadow:"0 4px 14px rgba(85,0,0,0.3)" }}>
            <BookMarked size={16} color="#ddc192" /> Tambah Jurnal
          </Link>
          <Link href="/presensi/santri" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#380000", color:"#ddc192", border:"1px solid #ddc192", padding:"10px 20px", borderRadius:12, fontSize:13, fontWeight:700, textDecoration:"none", transition:"all 0.2s", boxShadow:"0 4px 14px rgba(56,0,0,0.25)" }}>
            <ClipboardCheck size={16} /> Input Presensi Santri
          </Link>
          <Link href="/presensi/asatidz" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#fdf8f0", color:"#550000", border:"1px solid #ebdcc3", padding:"10px 20px", borderRadius:12, fontSize:13, fontWeight:700, textDecoration:"none", transition:"all 0.2s" }}>
            <UserCheck size={16} /> Absensi Guru
          </Link>
          <Link href="/nilai" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#fdf8f0", color:"#550000", border:"1px solid #ebdcc3", padding:"10px 20px", borderRadius:12, fontSize:13, fontWeight:700, textDecoration:"none", transition:"all 0.2s" }}>
            <BarChart3 size={16} /> Input Nilai
          </Link>
          {isSuperAdmin && (
            <Link href="/master/kelas" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#751414", color:"white", padding:"10px 20px", borderRadius:12, fontSize:13, fontWeight:700, textDecoration:"none", transition:"all 0.2s", boxShadow:"0 4px 14px rgba(117,20,20,0.3)" }}>
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
