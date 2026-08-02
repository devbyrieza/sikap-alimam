"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, X, BookOpen, Check, ChevronDown, Trash2, CheckCircle2, RotateCcw } from "lucide-react";
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

  useEffect(() => {
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
      setSelectedJenjangs(Array.from(detectedJenjangs));
    }
    if (detectedClasses.size > 0) {
      setSelectedClasses(Array.from(detectedClasses));
    }
  }, [value]);

  const updateValue = (newItems: MapelItem[]) => {
    setItems(newItems);
    const strValue = newItems.map((item) => `[${item.jenjang}] ${item.nama}`).join(", ");
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
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-red-800 text-white text-[11px] font-black flex items-center justify-center">
              1
            </span>
            <span>Pilih Jenjang Mengajar (Bisa Lebih Dari 1):</span>
          </label>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={handleResetAll}
                className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-0.5 rounded-lg transition-all cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Kosongkan Mapel</span>
              </button>
            )}
            <span className="text-xs font-bold text-red-800 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
              {items.length} total mapel dipilih
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {JENJANG_DEFINITIONS.map((j) => {
            const isChecked = selectedJenjangs.includes(j.id);
            const count = countPerJenjang[j.id] || 0;

            return (
              <button
                key={j.id}
                type="button"
                onClick={() => toggleJenjang(j.id)}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 relative cursor-pointer ${
                  isChecked
                    ? "bg-white border-red-800 shadow-md ring-2 ring-red-800/20"
                    : "bg-white/70 border-slate-200 hover:border-slate-300 hover:bg-white text-slate-600"
                }`}
              >
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  isChecked ? "bg-red-800 text-white shadow-sm" : "border border-slate-300 bg-slate-50"
                }`}>
                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 justify-between">
                    <span className={`text-xs font-black truncate ${isChecked ? "text-red-950" : "text-slate-700"}`}>
                      {j.label}
                    </span>
                    {count > 0 && (
                      <span className="bg-red-800 text-white text-[9px] font-extrabold px-2 py-0.2 rounded-full shrink-0">
                        {count} mapel
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-snug mt-0.5 truncate">
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
                className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-red-100 text-red-800 font-black text-xs flex items-center justify-center">
                      {jenjangId}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800">
                        Pengaturan Mapel Jenjang {jenjangDef.label}
                      </h4>
                      <p className="text-[11px] text-slate-400">{jenjangDef.desc}</p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {countPerJenjang[jenjangId] || 0} mapel aktif
                  </span>
                </div>

                {/* Centang Kelas */}
                <div className="space-y-2 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Centang Kelas Mengajar di Jenjang [{jenjangId}]:
                    </label>

                    {jenjangDef.classes.some((c) => !c.isPrimary) && (
                      <button
                        type="button"
                        onClick={() => setShowOtherClasses((prev) => ({ ...prev, [jenjangId]: !prev[jenjangId] }))}
                        className="text-[11px] text-red-800 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        {showOtherClasses[jenjangId] ? "Sembunyikan Kelas Lain" : "Tampilkan Kelas Lain"}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showOtherClasses[jenjangId] ? "rotate-180" : ""}`} />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
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
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                              isClassChecked
                                ? "bg-red-800 text-white border-red-800 shadow-sm"
                                : "bg-white text-slate-700 border-slate-300 hover:border-red-700"
                            }`}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center ${isClassChecked ? "bg-white text-red-800" : "border border-slate-400 bg-slate-50"}`}>
                              {isClassChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span>{c.label}</span>
                            {classCount > 0 && (
                              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${isClassChecked ? "bg-white text-red-950" : "bg-red-100 text-red-800"}`}>
                                {classCount} mapel
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Mapel List per Kelas */}
                <div className="space-y-4">
                  {jenjangDef.classes
                    .filter((c) => selectedClasses.includes(c.id))
                    .map((c) => {
                      const mapelGroups = MAPEL_PER_KELAS[c.id] || MAPEL_PER_KELAS["7 MTs"] || [];

                      return (
                        <div key={c.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200 space-y-3.5 shadow-sm">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                              <BookOpen className="w-4 h-4 text-red-800" />
                              <span>Pilihan Mata Pelajaran [{c.label}]:</span>
                            </span>
                            <span className="text-xs font-bold text-red-800 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                              {countPerKelas[c.id] || 0} mapel dipilih
                            </span>
                          </div>

                          <div className="space-y-3">
                            {mapelGroups.map((group) => (
                              <div key={group.kategori} className="space-y-1.5">
                                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                                  📌 {group.kategori}
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {group.items.map((m) => {
                                    const isSelected = items.some(
                                      (it) => it.jenjang === c.id && it.nama.toLowerCase() === m.toLowerCase()
                                    );

                                    return (
                                      <button
                                        key={m}
                                        type="button"
                                        onClick={() => toggleMapel(c.id, m)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                                          isSelected
                                            ? "bg-red-800 text-white border-red-800 shadow-sm ring-2 ring-red-800/20"
                                            : "bg-white hover:bg-red-50 hover:text-red-950 hover:border-red-300 border-slate-300 text-slate-700"
                                        }`}
                                      >
                                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center ${isSelected ? "bg-white text-red-800" : "border border-slate-300 bg-slate-50"}`}>
                                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
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
                          <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <span className="text-[11px] text-slate-400 font-semibold whitespace-nowrap">
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
                              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-red-800/20 flex-1"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddCustomMapel(c.id)}
                              disabled={!(customInputs[c.id] || "").trim()}
                              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all shrink-0 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
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
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-red-800" />
            <span>Rangkuman Mapel Ditugaskan ({items.length} Mapel):</span>
          </span>
          {items.length > 0 && (
            <button
              type="button"
              onClick={handleResetAll}
              className="text-xs text-red-500 hover:underline font-bold cursor-pointer"
            >
              Hapus Semua
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Belum ada mata pelajaran yang dipilih.</p>
        ) : (
          <div className="space-y-2">
            {items.some((i) => i.jenjang === "7 MTs") && (
              <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-200">
                <span className="text-[10px] font-extrabold text-sky-900 uppercase tracking-wider block mb-1.5">
                  📚 Jenjang MTs (Kelas 7 MTs):
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
                <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block mb-1.5">
                  📖 Jenjang IL (Kelas I&apos;dad Lughowy):
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
                <span className="text-[10px] font-extrabold text-purple-900 uppercase tracking-wider block mb-1.5">
                  📌 Kelas Lainnya:
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
