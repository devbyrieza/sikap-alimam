"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Plus, X, BookOpen, Check, ChevronDown, Trash2, CheckCircle2, RotateCcw, Bookmark, Book } from "lucide-react";
import { motion } from "framer-motion";

// Definisi Mapel Resmi Ust Aziz (Revisi 31 Juli 2026) per Jenjang & Kelas
export const MAPEL_PER_KELAS: Record<string, { kategori: string; items: string[] }[]> = {
  "7 MTs": [
    {
      kategori: "Syariah & Diniyah",
      items: [
        "Akidah",
        "Hadis",
        "Fiqh",
        "Siroh Nabi",
        "Tahsin Al-Quran",
        "Tahfidz Al-Quran",
        "Adab & Akhlak",
        "Khitobah",
      ],
    },
    {
      kategori: "Bahasa & Lughoh",
      items: [
        "Bahasa Arab",
        "Kitabah",
        "Shorf",
      ],
    },
    {
      kategori: "Umum & Keterampilan",
      items: [
        "Bahasa Indonesia",
        "Bahasa Inggris",
        "Matematika",
        "IPA Terpadu",
        "Entrepreneurship",
      ],
    },
  ],
  "8 MTs": [
    {
      kategori: "Syariah & Diniyah",
      items: ["Akidah", "Hadis", "Fiqh", "Siroh Nabi", "Tahsin Al-Quran", "Tahfidz Al-Quran", "Adab & Akhlak", "Khitobah"],
    },
    {
      kategori: "Bahasa & Lughoh",
      items: ["Bahasa Arab", "Kitabah", "Shorf", "Nahwu"],
    },
    {
      kategori: "Umum & Keterampilan",
      items: ["Bahasa Indonesia", "Bahasa Inggris", "Matematika", "IPA Terpadu", "Entrepreneurship"],
    },
  ],
  "9 MTs": [
    {
      kategori: "Syariah & Diniyah",
      items: ["Akidah", "Hadis", "Fiqh", "Siroh Nabi", "Tahsin Al-Quran", "Tahfidz Al-Quran", "Adab & Akhlak", "Khitobah"],
    },
    {
      kategori: "Bahasa & Lughoh",
      items: ["Bahasa Arab", "Kitabah", "Shorf", "Nahwu"],
    },
    {
      kategori: "Umum & Keterampilan",
      items: ["Bahasa Indonesia", "Bahasa Inggris", "Matematika", "IPA Terpadu", "Entrepreneurship"],
    },
  ],
  "IL": [
    {
      kategori: "Bahasa Arab Intensif & Lughoh",
      items: [
        "Bahasa Arab",
        "Nahwu",
        "Shorf",
        "Kitabah",
        "Tadribat Alal Anmath",
      ],
    },
    {
      kategori: "Syariah & Diniyah",
      items: [
        "Akidah",
        "Hadis",
        "Fiqh",
        "Siroh Nabi",
        "Tahsin Al-Quran",
        "Tahfidz Al-Quran",
        "Adab & Akhlak",
        "Khitobah",
      ],
    },
    {
      kategori: "Keterampilan",
      items: [
        "Entrepreneurship",
      ],
    },
  ],
  "10 MA": [
    {
      kategori: "Syariah & Diniyah",
      items: ["Tafsir", "Hadis", "Ushul Fiqh", "Fiqh", "Akidah", "Tahsin Al-Quran", "Tahfidz Al-Quran"],
    },
    {
      kategori: "Bahasa & Lughoh",
      items: ["Bahasa Arab", "Nahwu", "Shorf", "Balaghah"],
    },
    {
      kategori: "Umum & Keterampilan",
      items: ["Bahasa Indonesia", "Bahasa Inggris", "Matematika", "Sosiologi / IPA", "Entrepreneurship"],
    },
  ],
  "11 MA": [
    {
      kategori: "Syariah & Diniyah",
      items: ["Tafsir", "Hadis", "Ushul Fiqh", "Fiqh", "Akidah", "Tahsin Al-Quran", "Tahfidz Al-Quran"],
    },
    {
      kategori: "Bahasa & Lughoh",
      items: ["Bahasa Arab", "Nahwu", "Shorf", "Balaghah"],
    },
    {
      kategori: "Umum & Keterampilan",
      items: ["Bahasa Indonesia", "Bahasa Inggris", "Matematika", "Entrepreneurship"],
    },
  ],
  "12 MA": [
    {
      kategori: "Syariah & Diniyah",
      items: ["Tafsir", "Hadis", "Ushul Fiqh", "Fiqh", "Akidah", "Tahsin Al-Quran", "Tahfidz Al-Quran"],
    },
    {
      kategori: "Bahasa & Lughoh",
      items: ["Bahasa Arab", "Nahwu", "Shorf", "Balaghah"],
    },
    {
      kategori: "Umum & Keterampilan",
      items: ["Bahasa Indonesia", "Bahasa Inggris", "Matematika", "Entrepreneurship"],
    },
  ],
};

const JENJANG_DEFINITIONS = [
  { 
    id: "MTs", 
    label: "MTs (Tsanawiyah)", 
    desc: "Madrasah Tsanawiyah (Aktif: Kelas 7 MTs)",
    badgeColor: "bg-sky-100 text-sky-800 border-sky-300",
    classes: [
      { id: "7 MTs", label: "Kelas 7 MTs", isPrimary: true },
      { id: "8 MTs", label: "Kelas 8 MTs", isPrimary: false },
      { id: "9 MTs", label: "Kelas 9 MTs", isPrimary: false },
    ]
  },
  { 
    id: "IL", 
    label: "IL (I'dad Lughowy)", 
    desc: "Persiapan Bahasa Arab Intensif (Aktif: Kelas IL)",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    classes: [
      { id: "IL", label: "Kelas IL (I'dad Lughowy)", isPrimary: true },
    ]
  },
  { 
    id: "MA", 
    label: "MA (Aliyah)", 
    desc: "Madrasah Aliyah (Direncanakan Tahun Depan)",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    classes: [
      { id: "10 MA", label: "Kelas 10 MA", isPrimary: false },
      { id: "11 MA", label: "Kelas 11 MA", isPrimary: false },
      { id: "12 MA", label: "Kelas 12 MA", isPrimary: false },
    ]
  },
];

interface MapelItem {
  jenjang: string;
  nama: string;
}

interface MapelSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MapelSelector({ value, onChange }: MapelSelectorProps) {
  const [items, setItems] = useState<MapelItem[]>([]);
  const [selectedJenjangs, setSelectedJenjangs] = useState<string[]>(["MTs"]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(["7 MTs"]);
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [showOtherClasses, setShowOtherClasses] = useState<Record<string, boolean>>({});

  // Ref to track locally emitted values so incoming prop changes from parent don't wipe active tabs
  const lastEmittedValueRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastEmittedValueRef.current !== null && lastEmittedValueRef.current === value) {
      return;
    }
    lastEmittedValueRef.current = value;

    if (!value) {
      setItems([]);
      return;
    }

    const parsedItems: MapelItem[] = [];
    const detectedJenjangs = new Set<string>();
    const detectedClasses = new Set<string>();

    const segments = value.split(",").map((s) => s.trim()).filter((s) => s);

    segments.forEach((segment) => {
      const match = segment.match(/^\[(.*?)\]\s*(.*)$/);
      if (match) {
        let j = match[1].trim();
        if (j === "I'dad Lughowy" || j === "I'dad") j = "IL";
        
        parsedItems.push({ jenjang: j, nama: match[2].trim() });
        detectedClasses.add(j);

        if (j.includes("MTs")) detectedJenjangs.add("MTs");
        else if (j === "IL") detectedJenjangs.add("IL");
        else if (j.includes("MA")) detectedJenjangs.add("MA");
      } else {
        parsedItems.push({ jenjang: "7 MTs", nama: segment.trim() });
        detectedClasses.add("7 MTs");
        detectedJenjangs.add("MTs");
      }
    });

    setItems(parsedItems);

    if (detectedJenjangs.size > 0) {
      setSelectedJenjangs((prev) => Array.from(new Set([...prev, ...Array.from(detectedJenjangs)])));
    }
    if (detectedClasses.size > 0) {
      setSelectedClasses((prev) => Array.from(new Set([...prev, ...Array.from(detectedClasses)])));
    }
  }, [value]);

  const updateValue = (newItems: MapelItem[]) => {
    setItems(newItems);
    const strValue = newItems.map((item) => `[${item.jenjang}] ${item.nama}`).join(", ");
    lastEmittedValueRef.current = strValue;
    onChange(strValue);
  };

  const handleResetAll = () => {
    updateValue([]);
  };

  const toggleJenjang = (jenjangId: string) => {
    let updatedJenjangs: string[];
    let updatedClasses = [...selectedClasses];

    if (selectedJenjangs.includes(jenjangId)) {
      updatedJenjangs = selectedJenjangs.filter((j) => j !== jenjangId);
      const jenjangDef = JENJANG_DEFINITIONS.find((j) => j.id === jenjangId);
      const classIdsToRemove = jenjangDef?.classes.map((c) => c.id) || [];
      updatedClasses = updatedClasses.filter((c) => !classIdsToRemove.includes(c));
      const newItems = items.filter((item) => !classIdsToRemove.includes(item.jenjang));
      updateValue(newItems);
    } else {
      updatedJenjangs = [...selectedJenjangs, jenjangId];
      const jenjangDef = JENJANG_DEFINITIONS.find((j) => j.id === jenjangId);
      const primary = jenjangDef?.classes.find((c) => c.isPrimary) || jenjangDef?.classes[0];
      if (primary && !updatedClasses.includes(primary.id)) {
        updatedClasses.push(primary.id);
      }
    }

    setSelectedJenjangs(updatedJenjangs);
    setSelectedClasses(updatedClasses);
  };

  const toggleClass = (classId: string) => {
    let updatedClasses: string[];
    if (selectedClasses.includes(classId)) {
      updatedClasses = selectedClasses.filter((c) => c !== classId);
      const newItems = items.filter((item) => item.jenjang !== classId);
      updateValue(newItems);
    } else {
      updatedClasses = [...selectedClasses, classId];
    }
    setSelectedClasses(updatedClasses);
  };

  const toggleMapel = (classId: string, mapelName: string) => {
    const clean = mapelName.trim();
    if (!clean || !classId) return;

    const existingIndex = items.findIndex(
      (item) => item.jenjang === classId && item.nama.toLowerCase() === clean.toLowerCase()
    );

    if (existingIndex >= 0) {
      const newItems = items.filter((_, i) => i !== existingIndex);
      updateValue(newItems);
    } else {
      const newItems = [...items, { jenjang: classId, nama: clean }];
      updateValue(newItems);
    }
  };

  const handleAddCustomMapel = (classId: string) => {
    const clean = (customInputs[classId] || "").trim();
    if (!clean) return;

    const exists = items.some(
      (item) => item.jenjang === classId && item.nama.toLowerCase() === clean.toLowerCase()
    );

    if (!exists) {
      const newItems = [...items, { jenjang: classId, nama: clean }];
      updateValue(newItems);
    }

    setCustomInputs((prev) => ({ ...prev, [classId]: "" }));
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    updateValue(newItems);
  };

  const countPerJenjang = useMemo(() => {
    const counts: Record<string, number> = { MTs: 0, IL: 0, MA: 0 };
    items.forEach((it) => {
      if (it.jenjang.includes("MTs")) counts["MTs"] = (counts["MTs"] || 0) + 1;
      else if (it.jenjang === "IL") counts["IL"] = (counts["IL"] || 0) + 1;
      else if (it.jenjang.includes("MA")) counts["MA"] = (counts["MA"] || 0) + 1;
    });
    return counts;
  }, [items]);

  const countPerKelas = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((it) => {
      counts[it.jenjang] = (counts[it.jenjang] || 0) + 1;
    });
    return counts;
  }, [items]);

  return (
    <div className="space-y-4 text-left">
      {/* STEP 1: PILIH JENJANG */}
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "1rem", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 900, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#9b1b22", color: "white", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>
              1
            </span>
            <span>Pilih Jenjang Mengajar (Bisa Lebih Dari 1):</span>
          </label>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {items.length > 0 && (
              <button
                type="button"
                onClick={handleResetAll}
                style={{ fontSize: 11, color: "#dc2626", fontWeight: 700, display: "flex", alignItems: "center", gap: 4, background: "#fef2f2", border: "1px solid #fecaca", padding: "3px 10px", borderRadius: "8px", cursor: "pointer" }}
              >
                <RotateCcw size={12} />
                <span>Kosongkan Mapel</span>
              </button>
            )}
            <span style={{ fontSize: 11, fontWeight: 700, color: "#9b1b22", background: "#fef2f2", border: "1px solid #fecaca", padding: "3px 10px", borderRadius: "999px" }}>
              {items.length} total mapel dipilih
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
          {JENJANG_DEFINITIONS.map((j) => {
            const isChecked = selectedJenjangs.includes(j.id);
            const count = countPerJenjang[j.id] || 0;

            return (
              <button
                key={j.id}
                type="button"
                onClick={() => toggleJenjang(j.id)}
                style={{
                  padding: "12px", borderRadius: "0.75rem", textAlign: "left", display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", transition: "all 0.2s",
                  background: isChecked ? "white" : "rgba(255,255,255,0.6)",
                  border: `1.5px solid ${isChecked ? "#9b1b22" : "#e2e8f0"}`,
                  boxShadow: isChecked ? "0 4px 12px rgba(155,27,34,0.15)" : "none"
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2,
                  background: isChecked ? "#9b1b22" : "#f1f5f9",
                  border: isChecked ? "none" : "1px solid #cbd5e1"
                }}>
                  {isChecked && <Check size={14} style={{ color: "white", strokeWidth: 3 }} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: isChecked ? "#450a0a" : "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {j.label}
                    </span>
                    {count > 0 && (
                      <span style={{ background: "#9b1b22", color: "white", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: "999px", flexShrink: 0 }}>
                        {count} mapel
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 10, color: "#94a3b8", marginTop: 2, lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {j.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 2 & 3: KELAS & MAPEL SECTION */}
      {selectedJenjangs.length === 0 ? (
        <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
          Silakan centang minimal satu jenjang di atas untuk mulai memilih kelas dan mata pelajaran.
        </div>
      ) : (
        <div className="space-y-4">
          {selectedJenjangs.map((jenjangId) => {
            const jenjangDef = JENJANG_DEFINITIONS.find((j) => j.id === jenjangId);
            if (!jenjangDef) return null;

            return (
              <motion.div
                key={jenjangId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: "1.25rem", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "0.5rem", background: "#fef2f2", color: "#9b1b22", fontSize: 11, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {jenjangId}
                    </div>
                    <div>
                      <h4 style={{ fontSize: "0.875rem", fontWeight: 900, color: "#1e293b", margin: 0 }}>
                        Pengaturan Mapel Jenjang {jenjangDef.label}
                      </h4>
                      <p style={{ fontSize: "0.7rem", color: "#94a3b8", margin: 0 }}>{jenjangDef.desc}</p>
                    </div>
                  </div>

                  <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", background: "#f1f5f9", padding: "4px 10px", borderRadius: "8px" }}>
                    {countPerJenjang[jenjangId] || 0} mapel aktif
                  </span>
                </div>

                {/* Centang Kelas */}
                <div style={{ background: "rgba(248,250,252,0.8)", padding: "0.875rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Centang Kelas Mengajar di Jenjang [{jenjangId}]:
                    </label>

                    {jenjangDef.classes.some((c) => !c.isPrimary) && (
                      <button
                        type="button"
                        onClick={() => setShowOtherClasses((prev) => ({ ...prev, [jenjangId]: !prev[jenjangId] }))}
                        style={{ fontSize: 11, color: "#9b1b22", fontWeight: 700, display: "flex", alignItems: "center", gap: 2, cursor: "pointer", background: "none", border: "none" }}
                      >
                        {showOtherClasses[jenjangId] ? "Sembunyikan Kelas Lain" : "Tampilkan Kelas Lain"}
                        <ChevronDown size={14} style={{ transform: showOtherClasses[jenjangId] ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {jenjangDef.classes
                      .filter((c) => c.isPrimary || showOtherClasses[jenjangId] || jenjangId === "MA")
                      .map((c) => {
                        const isClassChecked = selectedClasses.includes(c.id);
                        const classCount = countPerKelas[c.id] || 0;

                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => toggleClass(c.id)}
                            style={{
                              padding: "6px 12px", borderRadius: "0.75rem", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", transition: "all 0.2s",
                              background: isClassChecked ? "#9b1b22" : "white",
                              color: isClassChecked ? "white" : "#334155",
                              border: `1px solid ${isClassChecked ? "#9b1b22" : "#cbd5e1"}`,
                              boxShadow: isClassChecked ? "0 2px 8px rgba(155,27,34,0.2)" : "none"
                            }}
                          >
                            <div style={{
                              width: 16, height: 16, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                              background: isClassChecked ? "white" : "#f1f5f9",
                              color: isClassChecked ? "#9b1b22" : "transparent",
                              border: isClassChecked ? "none" : "1px solid #94a3b8"
                            }}>
                              {isClassChecked && <Check size={12} style={{ strokeWidth: 3 }} />}
                            </div>
                            <span>{c.label}</span>
                            {classCount > 0 && (
                              <span style={{
                                fontSize: 9, padding: "2px 6px", borderRadius: "999px", fontWeight: 900,
                                background: isClassChecked ? "white" : "#fef2f2",
                                color: isClassChecked ? "#450a0a" : "#9b1b22"
                              }}>
                                {classCount} mapel
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Mapel List per Kelas */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {jenjangDef.classes
                    .filter((c) => selectedClasses.includes(c.id))
                    .map((c) => {
                      const mapelGroups = MAPEL_PER_KELAS[c.id] || MAPEL_PER_KELAS["7 MTs"] || [];

                      return (
                        <div key={c.id} style={{ background: "rgba(248,250,252,0.5)", border: "1px solid #e2e8f0", borderRadius: "1rem", padding: "1rem", display: "flex", flexDirection: "column", gap: 14 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "0.5rem", borderBottom: "1px solid #e2e8f0" }}>
                            <span style={{ fontSize: 11, fontWeight: 900, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 }}>
                              <BookOpen size={14} style={{ color: "#9b1b22" }} />
                              <span>Pilihan Mata Pelajaran [{c.label}]:</span>
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#9b1b22", background: "#fef2f2", padding: "3px 10px", borderRadius: "999px", border: "1px solid #fecaca" }}>
                              {countPerKelas[c.id] || 0} mapel dipilih
                            </span>
                          </div>

                          <div className="space-y-3">
                            {mapelGroups.map((group) => (
                              <div key={group.kategori} className="space-y-1.5">
                                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                                  <span className="flex items-center gap-1.5"><Bookmark size={12} /> {group.kategori}</span>
                                </span>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                  {group.items.map((m) => {
                                    const isSelected = items.some(
                                      (it) => it.jenjang === c.id && it.nama.toLowerCase() === m.toLowerCase()
                                    );

                                    return (
                                      <button
                                        key={m}
                                        type="button"
                                        onClick={() => toggleMapel(c.id, m)}
                                        style={{
                                          padding: "6px 12px", borderRadius: "0.75rem", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", transition: "all 0.2s",
                                          background: isSelected ? "#9b1b22" : "white",
                                          color: isSelected ? "white" : "#334155",
                                          border: `1px solid ${isSelected ? "#9b1b22" : "#cbd5e1"}`,
                                          boxShadow: isSelected ? "0 2px 8px rgba(155,27,34,0.2)" : "none"
                                        }}
                                      >
                                        <div style={{
                                          width: 14, height: 14, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                                          background: isSelected ? "white" : "#f1f5f9",
                                          border: isSelected ? "none" : "1px solid #94a3b8"
                                        }}>
                                          {isSelected && <Check size={10} style={{ color: "#9b1b22", strokeWidth: 3 }} />}
                                        </div>
                                        <span>{m}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Custom Input */}
                          <div style={{ paddingTop: "0.5rem", borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, whiteSpace: "nowrap" }}>
                              Mapel Tambahan / Kustom:
                            </span>
                            <input
                              type="text"
                              value={customInputs[c.id] || ""}
                              onChange={(e) => setCustomInputs((prev) => ({ ...prev, [c.id]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddCustomMapel(c.id);
                                }
                              }}
                              placeholder={`Ketik nama mapel kustom untuk ${c.id}...`}
                              style={{ padding: "6px 12px", background: "white", border: "1px solid #cbd5e1", borderRadius: "0.75rem", fontSize: 12, outline: "none", flex: 1, minWidth: 200 }}
                            />
                            <button
                              type="button"
                              onClick={() => handleAddCustomMapel(c.id)}
                              disabled={!(customInputs[c.id] || "").trim()}
                              style={{ padding: "6px 14px", background: !(customInputs[c.id] || "").trim() ? "#94a3b8" : "#1e293b", color: "white", borderRadius: "0.75rem", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, cursor: !(customInputs[c.id] || "").trim() ? "not-allowed" : "pointer", transition: "all 0.2s" }}
                            >
                              <Plus size={14} />
                              <span>Tambah</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* RANGKUMAN MAPEL */}
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "1rem", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, fontWeight: 900, color: "#334155", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle2 size={16} style={{ color: "#9b1b22" }} />
            <span>Rangkuman Mapel Ditugaskan ({items.length} Mapel):</span>
          </span>
          {items.length > 0 && (
            <button
              type="button"
              onClick={handleResetAll}
              style={{ fontSize: 11, color: "#ef4444", fontWeight: 700, cursor: "pointer", background: "none", border: "none", textDecoration: "underline" }}
            >
              Hapus Semua
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <p style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", margin: 0 }}>Belum ada mata pelajaran yang dipilih.</p>
        ) : (
          <div className="space-y-2">
            {items.some((i) => i.jenjang === "7 MTs") && (
              <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-200">
                <span className="text-[10px] font-extrabold text-sky-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Book size={12} /> Jenjang MTs (Kelas 7 MTs):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((item, index) => {
                    if (item.jenjang !== "7 MTs") return null;
                    return (
                      <span
                        key={`7mts-${item.nama}-${index}`}
                        className="inline-flex items-center gap-1.5 bg-white border border-sky-300 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm"
                      >
                        {item.nama}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-slate-400 hover:text-red-600 p-0.5 rounded cursor-pointer"
                          title="Hapus"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {items.some((i) => i.jenjang === "IL") && (
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <BookOpen size={12} /> Jenjang IL (Kelas I&apos;dad Lughowy):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((item, index) => {
                    if (item.jenjang !== "IL") return null;
                    return (
                      <span
                        key={`il-${item.nama}-${index}`}
                        className="inline-flex items-center gap-1.5 bg-white border border-amber-300 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm"
                      >
                        {item.nama}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-slate-400 hover:text-red-600 p-0.5 rounded cursor-pointer"
                          title="Hapus"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {items.some((i) => i.jenjang !== "7 MTs" && i.jenjang !== "IL") && (
              <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-200">
                <span className="text-[10px] font-extrabold text-purple-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Bookmark size={12} /> Kelas Lainnya:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((item, index) => {
                    if (item.jenjang === "7 MTs" || item.jenjang === "IL") return null;
                    return (
                      <span
                        key={`other-${item.jenjang}-${item.nama}-${index}`}
                        className="inline-flex items-center gap-1.5 bg-white border border-purple-300 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm"
                      >
                        <span className="text-[9px] font-extrabold text-purple-700">[{item.jenjang}]</span>
                        {item.nama}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-slate-400 hover:text-red-600 p-0.5 rounded cursor-pointer"
                          title="Hapus"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
