import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookMarked, ClipboardCheck, UserCheck, BarChart3, TrendingUp, Calendar, Clock, Hand, Zap, BookOpen } from "lucide-react";
import Link from "next/link";

function formatTanggal(date: Date) {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatJam(date: Date) {
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DashboardPage() {
  const session = await getSession();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Stats paralel
  const [
    totalAsatidz,
    totalSantri,
    jurnalHariIni,
    hadirAsatidz,
  ] = await Promise.all([
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
    prisma.jurnalMengajar.count({
      where: { tanggal: new Date(todayStr) },
    }),
    prisma.presensiAsatidz.count({
      where: {
        tanggal: new Date(todayStr),
        status: { in: ["hadir", "telat"] },
      },
    }),
  ]);

  // Jurnal terbaru
  const jurnalTerbaru = await prisma.jurnalMengajar.findMany({
    take: 5,
    orderBy: { created_at: "desc" },
    include: {
      pegawai: { select: { nama_lengkap: true } },
      mapel: { select: { nama: true } },
      kelas: { select: { nama: true } },
    },
  });

  // Absensi hari ini
  const absenHariIni = await prisma.presensiAsatidz.findMany({
    where: { tanggal: new Date(todayStr) },
    include: { pegawai: { select: { nama_lengkap: true } } },
    orderBy: { jam_masuk: "desc" },
    take: 8,
  });

  // Presensi Santri hari ini
  const presensiSantri = await prisma.presensiSiswa.findMany({
    where: { tanggal: new Date(todayStr) },
    select: { status: true },
  });

  const totalPresensiSantri = presensiSantri.length;
  const santriHadir = presensiSantri.filter((p) => p.status === "hadir").length;
  const santriSakit = presensiSantri.filter((p) => p.status === "sakit").length;
  const santriIzin = presensiSantri.filter((p) => p.status === "izin").length;
  const santriAlpha = presensiSantri.filter((p) => p.status === "alpha").length;

  const pctHadir =
    totalAsatidz > 0 ? Math.round((hadirAsatidz / totalAsatidz) * 100) : 0;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>
            Ahlan wa Sahlan, {session?.nama?.split(" ")[0]} <Hand size={16} className="inline mr-1" />
          </h1>
          <p>
            <Calendar size={13} style={{ display: "inline", marginRight: 4 }} />
            {formatTanggal(today)} &nbsp;·&nbsp;
            <Clock size={13} style={{ display: "inline", marginRight: 4 }} />
            {formatJam(today)}
          </p>
        </div>
        <div
          style={{
            fontSize: 20,
            fontFamily: "var(--font-arabic)",
            color: "var(--primary)",
          }}
        >
          بسم الله الرحمن الرحيم
        </div>
      </div>

      <div style={{ padding: "24px 28px", maxWidth: 1200 }}>
        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: "#fee2e2", color: "var(--primary)" }}
            >
              <UserCheck size={24} />
            </div>
            <div>
              <div className="stat-label">Hadir Hari Ini</div>
              <div className="stat-value">
                {hadirAsatidz}
                <span
                  style={{ fontSize: 14, fontWeight: 500, color: "var(--text-muted)", marginLeft: 4 }}
                >
                  / {totalAsatidz}
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: pctHadir >= 80 ? "var(--success)" : "var(--warning)",
                  fontWeight: 600,
                  marginTop: 2,
                }}
              >
                {pctHadir}% Guru hadir
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: "#fef9c3", color: "#a16207" }}
            >
              <BookMarked size={24} />
            </div>
            <div>
              <div className="stat-label">Jurnal Hari Ini</div>
              <div className="stat-value">{jurnalHariIni}</div>
              <div
                style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}
              >
                Entri jurnal mengajar
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: "#dcfce7", color: "#15803d" }}
            >
              <ClipboardCheck size={24} />
            </div>
            <div>
              <div className="stat-label">Total Santri</div>
              <div className="stat-value">{totalSantri}</div>
              <div
                style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}
              >
                Santri aktif terdaftar
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: "#e0f2fe", color: "#0369a1" }}
            >
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="stat-label">Total Guru</div>
              <div className="stat-value">{totalAsatidz}</div>
              <div
                style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}
              >
                Guru & pegawai aktif
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ marginBottom: 24 }}>
          <p className="card-title"><Zap size={16} className="inline mr-1" /> Aksi Cepat</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/jurnal/tambah" className="btn btn-primary">
              <BookMarked size={16} />
              Tambah Jurnal
            </Link>
            <Link href="/presensi/santri" className="btn btn-secondary">
              <ClipboardCheck size={16} />
              Input Presensi Santri
            </Link>
            <Link href="/presensi/asatidz" className="btn btn-ghost">
              <UserCheck size={16} />
              Absensi Guru
            </Link>
            <Link href="/nilai" className="btn btn-ghost">
              <BarChart3 size={16} />
              Input Nilai
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Jurnal Terbaru */}
          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <p className="card-title" style={{ marginBottom: 0 }}>
                <BookOpen size={16} className="inline mr-1" /> Jurnal Terbaru
              </p>
              <Link
                href="/jurnal"
                style={{
                  fontSize: 12,
                  color: "var(--primary)",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Lihat Semua →
              </Link>
            </div>
            {jurnalTerbaru.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "24px 0",
                  color: "var(--text-muted)",
                  fontSize: 13,
                }}
              >
                Belum ada jurnal hari ini
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {jurnalTerbaru.map((j) => (
                  <div
                    key={j.id}
                    style={{
                      padding: "10px 14px",
                      background: "var(--bg)",
                      borderRadius: 10,
                      borderLeft: "3px solid var(--primary)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: "var(--text-main)",
                      }}
                    >
                      {j.mapel.nama} — Kelas {j.kelas.nama}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        marginTop: 2,
                      }}
                    >
                      {j.pegawai.nama_lengkap} &nbsp;·&nbsp;{" "}
                      {j.tanggal.toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-main)",
                        marginTop: 4,
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {j.materi}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Presensi Santri Hari Ini (Statistik/Grafik) */}
          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <p className="card-title" style={{ marginBottom: 0 }}>
                <BarChart3 size={16} className="inline mr-1" /> Presensi Santri (Hari Ini)
              </p>
              <Link
                href="/presensi/santri"
                style={{
                  fontSize: 12,
                  color: "var(--primary)",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Input →
              </Link>
            </div>
            
            {totalPresensiSantri === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "24px 0",
                  color: "var(--text-muted)",
                  fontSize: 13,
                }}
              >
                Belum ada data presensi santri hari ini
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: "var(--text-main)", lineHeight: 1 }}>
                      {Math.round((santriHadir / totalPresensiSantri) * 100)}%
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                      Tingkat Kehadiran
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)" }}>
                      {totalPresensiSantri}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Total Santri Diabsen
                    </div>
                  </div>
                </div>

                {/* Progress Bar Grafik */}
                <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden", marginBottom: 16 }}>
                  <div style={{ width: `${(santriHadir / totalPresensiSantri) * 100}%`, background: "#10b981" }} title={`Hadir: ${santriHadir}`} />
                  <div style={{ width: `${(santriSakit / totalPresensiSantri) * 100}%`, background: "#f59e0b" }} title={`Sakit: ${santriSakit}`} />
                  <div style={{ width: `${(santriIzin / totalPresensiSantri) * 100}%`, background: "#3b82f6" }} title={`Izin: ${santriIzin}`} />
                  <div style={{ width: `${(santriAlpha / totalPresensiSantri) * 100}%`, background: "#ef4444" }} title={`Alpha: ${santriAlpha}`} />
                </div>

                {/* Keterangan Label */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--bg)", borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} /> Hadir
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{santriHadir}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--bg)", borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} /> Sakit
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{santriSakit}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--bg)", borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6" }} /> Izin
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{santriIzin}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--bg)", borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} /> Alpha
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{santriAlpha}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Absensi Asatidz Hari Ini */}
          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <p className="card-title" style={{ marginBottom: 0 }}>
                <Clock size={16} className="inline mr-1" /> Absensi Guru
              </p>
              <Link
                href="/presensi/asatidz"
                style={{
                  fontSize: 12,
                  color: "var(--primary)",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Kelola →
              </Link>
            </div>
            {absenHariIni.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "24px 0",
                  color: "var(--text-muted)",
                  fontSize: 13,
                }}
              >
                Belum ada guru yang absen hari ini
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {absenHariIni.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: "var(--bg)",
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {a.pegawai.nama_lengkap}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {a.jam_masuk && (
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--text-muted)",
                          }}
                        >
                          {formatJam(new Date(a.jam_masuk))}
                        </span>
                      )}
                      <span className={`badge badge-${a.status}`}>
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
    </div>
  );
}
