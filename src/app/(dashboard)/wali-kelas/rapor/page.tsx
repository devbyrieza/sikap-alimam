"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import ModuleTabs from "@/components/ModuleTabs";
import { 
  Users, 
  FileText, 
  BarChart3, 
  Printer, 
  Search, 
  Loader2, 
  ShieldAlert, 
  BookOpen, 
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { getOfficialNis } from "@/lib/officialSantri";
import { getLaporanNilaiAccess, LaporanNilaiAccess } from "@/lib/permissions";
import { getJenjangFromKelas } from "@/lib/kelas";

interface KelasItem {
  id: string;
  nama: string;
  jenjang?: string | null;
}

interface SantriItem {
  id: string;
  nama_lengkap: string;
  nis?: string;
  status_kesiswaan?: string;
}

export default function RaporWaliKelasPage() {
  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState("");
  const [semester, setSemester] = useState("Ganjil");
  const [tahunAjaran, setTahunAjaran] = useState("2026/2027");
  const [searchQuery, setSearchQuery] = useState("");

  const [santriList, setSantriList] = useState<SantriItem[]>([]);
  const [loadingSantri, setLoadingSantri] = useState(false);

  const [authLoading, setAuthLoading] = useState(true);
  const [accessInfo, setAccessInfo] = useState<LaporanNilaiAccess | null>(null);

  // 1. Fetch user permissions & available classes
  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/master/kelas").then((r) => r.json()),
    ])
      .then(([profileRes, kelasRes]) => {
        const access = getLaporanNilaiAccess({
          user: profileRes?.user,
          pegawai: profileRes?.pegawai,
        });
        setAccessInfo(access);
        setKelasList(kelasRes?.kelas || []);
      })
      .catch((err) => console.error("Error fetching class access:", err))
      .finally(() => setAuthLoading(false));
  }, []);

  // 2. Filter classes by role access
  const allowedClasses = useMemo(() => {
    if (!accessInfo || accessInfo.allowedJenjang === "ALL") {
      return kelasList;
    }
    return kelasList.filter((k) => {
      const j = getJenjangFromKelas(k.nama, k.jenjang);
      return accessInfo.allowedJenjang.includes(j);
    });
  }, [kelasList, accessInfo]);

  // 3. Auto-select first class
  useEffect(() => {
    if (allowedClasses.length > 0 && !selectedKelasId) {
      setSelectedKelasId(allowedClasses[0].id);
    }
  }, [allowedClasses, selectedKelasId]);

  // 4. Fetch santri list for selected class
  useEffect(() => {
    if (!selectedKelasId) {
      setSantriList([]);
      return;
    }

    setLoadingSantri(true);
    fetch(`/api/master/santri?kelas_id=${selectedKelasId}&status=aktif`)
      .then((r) => r.json())
      .then((data) => {
        setSantriList(data?.santri || data?.data || []);
      })
      .catch((err) => console.error("Error fetching students:", err))
      .finally(() => setLoadingSantri(false));
  }, [selectedKelasId]);

  // 5. Filter students by search
  const filteredSantri = useMemo(() => {
    if (!searchQuery.trim()) return santriList;
    const q = searchQuery.toLowerCase();
    return santriList.filter(
      (s) =>
        s.nama_lengkap.toLowerCase().includes(q) ||
        (s.nis && s.nis.toLowerCase().includes(q))
    );
  }, [santriList, searchQuery]);

  const selectedClassObj = allowedClasses.find((k) => k.id === selectedKelasId);

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* HERO BANNER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #550000 0%, #7a0000 60%, #1e293b 100%)",
          borderRadius: "24px",
          padding: "32px 36px",
          boxShadow: "0 20px 25px -5px rgba(85, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          color: "white",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: 100, fontSize: "12px", fontWeight: "bold", marginBottom: 12 }}>
            <FileText size={14} /> Penerbitan & Cetak Rapor Santri
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center" }}>
            <Users size={28} style={{ marginRight: 12 }} /> Hub Wali Kelas
          </h1>
          <p style={{ margin: "8px 0 0 0", opacity: 0.9, fontSize: "1rem", maxWidth: 650, lineHeight: 1.5 }}>
            Pusat kendali pencetakan Rapor Resmi (Kasyfud Darajat) berstandar internasional A4 untuk santri binaan Anda.
          </p>
        </div>

        <div style={{ position: "relative", zIndex: 1, display: "none" }} className="md:!block">
          <div style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 16, padding: "16px 20px", textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: "12px", opacity: 0.8 }}>Format Kertas Standar</p>
            <p style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: "bold" }}>A4 (210 × 297 mm)</p>
            <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#86efac" }}>ISO 216 Internasional</p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* MODULE NAVIGATION TABS */}
        <ModuleTabs
          tabs={[
            { label: "Dashboard Kelas", href: "/wali-kelas", exact: true, icon: <Users size={16} /> },
            { label: "Cetak Rapor", href: "/wali-kelas/rapor", exact: true, icon: <FileText size={16} /> },
            { label: "Rekap Nilai Total", href: "/nilai/rekap", exact: true, icon: <BarChart3 size={16} /> },
          ]}
        />

        {/* AUTH CHECK */}
        {authLoading ? (
          <div style={{ background: "white", borderRadius: 24, padding: "48px 24px", textAlign: "center", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
            <Loader2 className="animate-spin" size={32} style={{ margin: "0 auto 12px", color: "#550000" }} />
            <p style={{ fontWeight: "bold", color: "#64748b" }}>Memeriksa hak akses Wali Kelas...</p>
          </div>
        ) : !accessInfo?.canAccess ? (
          <div style={{ background: "#fff1f2", borderRadius: 24, padding: "40px 24px", textAlign: "center", border: "1px solid #fecdd3" }}>
            <ShieldAlert size={44} color="#e11d48" style={{ margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#9f1239", margin: "0 0 6px" }}>Akses Terbatas</h3>
            <p style={{ color: "#be123c", maxWidth: 460, margin: "0 auto", fontSize: "14px" }}>
              Halaman ini diperuntukkan bagi Wali Kelas, Kepala Kurikulum, dan Admin Super.
            </p>
          </div>
        ) : (
          <>
            {/* NOTICE BANNER STANDAR A4 */}
            <div style={{ 
              background: "#eff6ff", 
              border: "1px solid #bfdbfe", 
              borderRadius: "16px", 
              padding: "16px 20px", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ background: "#dbeafe", padding: 8, borderRadius: 10, color: "#2563eb", flexShrink: 0 }}>
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "bold", color: "#1e40af" }}>
                    Standarisasi Format Cetak Tunggal: Kertas A4 Internasional
                  </h4>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#3b82f6" }}>
                    Cetak rapor resmi Pesantren Al-Imam Al-Islami (Managed by Al-Andalus IIBS) menggunakan standar tunggal A4 (210 × 297 mm) untuk menjamin kerapian presisi tanpa terpotong.
                  </p>
                </div>
              </div>
              <Link 
                href="/nilai/rekap" 
                style={{ 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: 6, 
                  fontSize: "12px", 
                  fontWeight: "bold", 
                  color: "#1d4ed8", 
                  background: "white", 
                  padding: "8px 14px", 
                  borderRadius: 10, 
                  border: "1px solid #bfdbfe",
                  textDecoration: "none"
                }}
              >
                <BarChart3 size={14} /> Lihat Leger Rekap Nilai
              </Link>
            </div>

            {/* FILTER & SELECTOR CARD */}
            <div style={{ background: "white", borderRadius: 24, padding: "24px 28px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                {/* SELECT KELAS */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", color: "#475569", marginBottom: 6 }}>
                    Kelas Binaan
                  </label>
                  <select
                    value={selectedKelasId}
                    onChange={(e) => setSelectedKelasId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 12,
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#f8fafc",
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: "#1e293b",
                      outline: "none"
                    }}
                  >
                    {allowedClasses.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama} {k.jenjang ? `(${k.jenjang})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SELECT SEMESTER */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", color: "#475569", marginBottom: 6 }}>
                    Semester
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 12,
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#f8fafc",
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: "#1e293b",
                      outline: "none"
                    }}
                  >
                    <option value="Ganjil">Semester Ganjil (1)</option>
                    <option value="Genap">Semester Genap (2)</option>
                  </select>
                </div>

                {/* SELECT TAHUN AJARAN */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", color: "#475569", marginBottom: 6 }}>
                    Tahun Ajaran
                  </label>
                  <select
                    value={tahunAjaran}
                    onChange={(e) => setTahunAjaran(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 12,
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#f8fafc",
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: "#1e293b",
                      outline: "none"
                    }}
                  >
                    <option value="2026/2027">2026/2027</option>
                    <option value="2027/2028">2027/2028</option>
                  </select>
                </div>

                {/* SEARCH SANTRI */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", color: "#475569", marginBottom: 6 }}>
                    Cari Santri
                  </label>
                  <div style={{ position: "relative" }}>
                    <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                    <input
                      type="text"
                      placeholder="Ketik nama atau NIS..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px 10px 36px",
                        borderRadius: 12,
                        border: "1px solid #cbd5e1",
                        fontSize: "14px",
                        color: "#1e293b",
                        outline: "none"
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* QUICK STATS */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 16px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: "#64748b", textTransform: "uppercase" }}>Total Santri Kelas</span>
                  <p style={{ margin: "4px 0 0", fontSize: "20px", fontWeight: "900", color: "#1e293b" }}>{santriList.length} Santri</p>
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 16px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: "#64748b", textTransform: "uppercase" }}>Kelas Terpilih</span>
                  <p style={{ margin: "4px 0 0", fontSize: "20px", fontWeight: "900", color: "#550000" }}>{selectedClassObj?.nama || "-"}</p>
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 16px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: "#64748b", textTransform: "uppercase" }}>Format Dokumen</span>
                  <p style={{ margin: "4px 0 0", fontSize: "20px", fontWeight: "900", color: "#16a34a" }}>A4 Portrait</p>
                </div>
              </div>
            </div>

            {/* TABEL SANTRI SIAP CETAK */}
            <div style={{ background: "white", borderRadius: 24, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#1e293b" }}>
                    Daftar Santri Kelas {selectedClassObj?.nama}
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                    Klik tombol Cetak Rapor untuk membuka lembar resmi A4 siap unduh/cetak.
                  </p>
                </div>
                <span style={{ background: "#f1f5f9", color: "#475569", padding: "4px 10px", borderRadius: 8, fontSize: "12px", fontWeight: "bold" }}>
                  {filteredSantri.length} Santri
                </span>
              </div>

              {loadingSantri ? (
                <div style={{ padding: "48px 24px", textAlign: "center" }}>
                  <Loader2 className="animate-spin" size={32} style={{ margin: "0 auto 12px", color: "#550000" }} />
                  <p style={{ fontWeight: "bold", color: "#64748b" }}>Memuat daftar santri...</p>
                </div>
              ) : filteredSantri.length === 0 ? (
                <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748b" }}>
                  <BookOpen size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                  <p style={{ fontWeight: "bold", margin: 0 }}>Tidak ada data santri ditemukan.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <div className="w-full overflow-x-auto">
<table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                        <th style={{ padding: "14px 20px", width: "60px", textAlign: "center" }}>No</th>
                        <th style={{ padding: "14px 20px", width: "140px" }}>NIS</th>
                        <th style={{ padding: "14px 20px" }}>Nama Lengkap Santri</th>
                        <th style={{ padding: "14px 20px", width: "140px", textAlign: "center" }}>Status</th>
                        <th style={{ padding: "14px 20px", width: "220px", textAlign: "center" }}>Aksi Cetak</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSantri.map((santri, idx) => {
                        const displayNis = (santri.nama_lengkap ? getOfficialNis(santri.nama_lengkap) : null) || santri.nis || "-";
                        return (
                          <tr key={santri.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "14px 20px", textAlign: "center", fontWeight: "bold", color: "#64748b" }}>
                              {idx + 1}
                            </td>
                            <td style={{ padding: "14px 20px", fontFamily: "monospace", color: "#475569", fontWeight: "bold" }}>
                              {displayNis}
                            </td>
                            <td style={{ padding: "14px 20px", fontWeight: "bold", color: "#1e293b" }}>
                              {santri.nama_lengkap}
                            </td>
                            <td style={{ padding: "14px 20px", textAlign: "center" }}>
                              <span style={{ 
                                display: "inline-flex", 
                                alignItems: "center", 
                                gap: 4, 
                                background: "#ecfdf5", 
                                color: "#059669", 
                                padding: "4px 8px", 
                                borderRadius: 6, 
                                fontSize: "11px", 
                                fontWeight: "bold" 
                              }}>
                                <CheckCircle2 size={12} /> Aktif
                              </span>
                            </td>
                            <td style={{ padding: "14px 20px", textAlign: "center" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                <a
                                  href={`/rapor/print/${santri.id}?semester=${semester}&tahun_ajaran=${tahunAjaran}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "7px 14px",
                                    background: "#550000",
                                    color: "white",
                                    borderRadius: 8,
                                    fontSize: "12px",
                                    fontWeight: "bold",
                                    textDecoration: "none",
                                    boxShadow: "0 2px 4px rgba(85, 0, 0, 0.2)"
                                  }}
                                  title="Buka Lembar Rapor Resmi A4 (210 x 297 mm)"
                                >
                                  <Printer size={14} /> Cetak Rapor (A4)
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
</div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
