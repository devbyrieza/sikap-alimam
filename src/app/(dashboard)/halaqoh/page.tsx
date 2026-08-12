"use client";

import React, { useState, useEffect } from "react";
import { BookHeart, Sun, Moon, Cloud, CalendarDays, Users, Plus, ArrowRight, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

const HARI_NAMA = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

interface KelompokHalaqoh {
  id: string;
  nama_kelompok: string;
  sesi: string;
  anggota: { id: string }[];
}

interface StatusSesi {
  sesi: string;
  label: string;
  waktu: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  sudahDiisi: boolean;
  kelompok: KelompokHalaqoh | null;
}

const SESI_INFO: Record<string, { label: string; waktu: string; icon: React.ReactNode; color: string; bg: string }> = {
  subuh: { label: "Halaqoh Subuh", waktu: "04.50 – 06.10", icon: <Sun size={20} />, color: "#d97706", bg: "#fffbeb" },
  maghrib: { label: "Ba'da Maghrib", waktu: "Ba'da Maghrib", icon: <Moon size={20} />, color: "#7c3aed", bg: "#f5f3ff" },
  dhuha: { label: "Halaqoh Dhuha", waktu: "07.00 – 08.20", icon: <Cloud size={20} />, color: "#0284c7", bg: "#eff6ff" },
};

export default function HalaqohDashboardPage() {
  const [today] = useState(() => {
    const d = new Date();
    return d;
  });
  const [hariIni] = useState(() => HARI_NAMA[new Date().getDay()]);
  const [kelompokList, setKelompokList] = useState<KelompokHalaqoh[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Tentukan sesi aktif hari ini
  const getSesiAktifHariIni = (): string[] => {
    if (hariIni === "Ahad") return [];
    const sesi: string[] = [];
    // Subuh aktif kecuali Selasa
    if (hariIni !== "Selasa") sesi.push("subuh");
    // Maghrib aktif setiap hari kecuali Ahad
    sesi.push("maghrib");
    // Dhuha: Rabu & Sabtu (MTs), Sabtu saja (IL)
    if (hariIni === "Rabu" || hariIni === "Sabtu") sesi.push("dhuha");
    return sesi;
  };

  const sesiAktif = getSesiAktifHariIni();
  const tanggalStr = today.toISOString().split("T")[0];

  useEffect(() => {
    Promise.all([
      fetch("/api/halaqoh/kelompok").then(r => r.json()),
      fetch("/api/profile").then(r => r.json()),
    ]).then(([kData, pData]) => {
      setKelompokList(Array.isArray(kData) ? kData : []);
      setProfile(pData?.user);
    }).finally(() => setLoading(false));
  }, []);

  const formatTanggal = (d: Date) =>
    d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const isAdminOrMusyrif = () => {
    const role = (profile?.role || "").toLowerCase();
    return role.includes("admin_super") || role.includes("musyrif") || role.includes("mudir");
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px", fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #550000 0%, #7a0000 100%)",
        borderRadius: 24,
        padding: "28px 32px",
        marginBottom: 28,
        color: "white",
        boxShadow: "0 8px 32px rgba(85,0,0,0.35)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, background: "rgba(255,255,255,0.04)", borderRadius: "50%" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 14, padding: 10, backdropFilter: "blur(10px)" }}>
            <BookHeart size={26} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Halaqoh Kepengasuhan</h1>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.75, marginTop: 2 }}>Tahsin & Tahfizh Al-Qur'an</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, opacity: 0.85, marginTop: 8 }}>
          <CalendarDays size={14} />
          <span>{formatTanggal(today)}</span>
        </div>
      </div>

      {/* Alert Selasa = Kajian */}
      {hariIni === "Selasa" && (
        <div style={{
          background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14, padding: "14px 18px",
          marginBottom: 20, display: "flex", alignItems: "center", gap: 10, color: "#92400e"
        }}>
          <AlertCircle size={18} />
          <div>
            <strong>Hari Selasa:</strong> Halaqoh Subuh digantikan dengan <strong>Kajian</strong>. Input catatan subuh tidak diperlukan.
          </div>
        </div>
      )}

      {hariIni === "Ahad" && (
        <div style={{
          background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 14, padding: "14px 18px",
          marginBottom: 20, display: "flex", alignItems: "center", gap: 10, color: "#065f46"
        }}>
          <CheckCircle2 size={18} />
          <span>Hari Ahad — Tidak ada jadwal halaqoh. Selamat beristirahat! 🌿</span>
        </div>
      )}

      {/* Sesi Aktif Hari Ini */}
      {hariIni !== "Ahad" && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={18} color="#550000" /> Sesi Aktif Hari Ini
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {sesiAktif.map(sesi => {
              const info = SESI_INFO[sesi];
              const kelompok = kelompokList.find(k => k.sesi === sesi);
              return (
                <div key={sesi} style={{
                  background: info.bg, border: `1.5px solid`, borderColor: info.color + "33",
                  borderRadius: 18, padding: 20, transition: "all 0.2s"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ color: info.color, background: "white", borderRadius: 10, padding: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                      {info.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{info.label}</div>
                      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>{info.waktu}</div>
                    </div>
                  </div>

                  {loading ? (
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>Memuat...</div>
                  ) : kelompok ? (
                    <div>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>
                        <Users size={12} style={{ display: "inline", marginRight: 4 }} />
                        {kelompok.anggota?.length || 0} santri · {kelompok.nama_kelompok}
                      </div>
                      <Link
                        href={`/halaqoh/input?kelompok=${kelompok.id}&sesi=${sesi}&tanggal=${tanggalStr}`}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          background: info.color, color: "white", padding: "10px 16px",
                          borderRadius: 12, fontWeight: 700, fontSize: 13, textDecoration: "none",
                          transition: "opacity 0.2s"
                        }}
                      >
                        <span>Isi Catatan Sekarang</span>
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>
                        Belum ada kelompok halaqoh untuk sesi ini.
                      </div>
                      {isAdminOrMusyrif() && (
                        <Link
                          href="/halaqoh/kelompok"
                          style={{
                            display: "flex", alignItems: "center", gap: 6,
                            background: "#f1f5f9", color: "#475569", padding: "9px 14px",
                            borderRadius: 10, fontWeight: 600, fontSize: 12, textDecoration: "none",
                            border: "1px solid #e2e8f0"
                          }}
                        >
                          <Plus size={13} /> Atur Kelompok
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
        {isAdminOrMusyrif() && (
          <Link href="/halaqoh/kelompok" style={{
            display: "flex", alignItems: "center", gap: 12, background: "white",
            border: "1.5px solid #e2e8f0", borderRadius: 16, padding: "16px 20px",
            textDecoration: "none", color: "#1e293b", transition: "all 0.2s",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
          }}>
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: 8 }}>
              <Users size={18} color="#550000" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Kelompok Halaqoh</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Atur anggota kelompok</div>
            </div>
          </Link>
        )}
        <Link href="/halaqoh/rekap" style={{
          display: "flex", alignItems: "center", gap: 12, background: "white",
          border: "1.5px solid #e2e8f0", borderRadius: 16, padding: "16px 20px",
          textDecoration: "none", color: "#1e293b", transition: "all 0.2s",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
        }}>
          <div style={{ background: "#f8fafc", borderRadius: 10, padding: 8 }}>
            <CalendarDays size={18} color="#0284c7" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Rekap Catatan</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Riwayat & statistik</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
