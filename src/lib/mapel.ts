/**
 * Standardisasi penamaan Mata Pelajaran di Pesantren Al-Imam Al-Islami
 * Mengacu pada ejaan baku KBBI dan kurikulum resmi Kemenag / Pesantren.
 */

export function getStandardMapelName(rawName: string, isMA: boolean = false): string {
  if (!rawName) return "";
  let name = rawName.replace(/^\[.*?\]\s*/, "").trim();
  const low = name.toLowerCase().trim();

  // 1. Pelajaran Umum & Bahasa
  if (low === "b. indonesia" || low === "b.indonesia" || low === "indonesia" || low === "bahasa indonesia") {
    return "Bahasa Indonesia";
  }
  if (low === "b. arab" || low === "b.arab" || low === "arab" || low === "bahasa arab") {
    return "Bahasa Arab";
  }
  if (low === "b. inggris" || low === "b.inggris" || low === "inggris" || low === "english" || low === "bahasa inggris") {
    return "Bahasa Inggris";
  }
  if (low === "mtk" || low === "matematika") {
    return "Matematika";
  }
  if (low === "ipa" || low.includes("ipa terpadu") || low === "ilmu pengetahuan alam") {
    return "IPA Terpadu";
  }
  if (low === "ips" || low.includes("ips terpadu") || low === "ilmu pengetahuan sosial") {
    return "IPS Terpadu";
  }

  // 2. Syari'ah & Dirasah Islamiyah
  if (low === "aqidah" || low === "akidah") {
    return "Akidah";
  }
  if (low === "tauhid") {
    return "Tauhid";
  }
  if (low === "hadits" || low === "hadis") {
    return "Hadis";
  }
  if (low === "siroh" || low === "sirah" || low === "siroh nabi" || low === "sirah nabi") {
    return "Sirah";
  }
  if (low === "akhlaq" || low === "akhlak") {
    return "Akhlak";
  }
  if (low === "adab") {
    return "Adab";
  }
  if (low === "tajwid") {
    return "Tajwid";
  }
  if (low === "mahfudzot" || low === "mahfudot") {
    return "Mahfudzot";
  }
  if (low.includes("tahsin")) {
    return "Tahsin";
  }
  if (low.includes("tahfidz") || low.includes("tahfiz")) {
    return "Tahfidz";
  }

  // 3. Fikih & Ushul Fikih
  if (low === "ushul fiqh" || low === "ushul fiqih" || low === "ushul fikih" || low.includes("ushul")) {
    return "Ushul Fikih";
  }
  if (low === "fiqh" || low === "fiqih" || low === "fikih") {
    return isMA ? "Ushul Fikih" : "Fikih";
  }

  // 4. Cabang Bahasa Arab & Pendalaman
  if (low === "nahwu") {
    return "Nahwu";
  }
  if (low === "shorf" || low === "shorof" || low === "sharaf") {
    return "Shorof";
  }
  if (low === "kitabah" || low === "khitobah") {
    return "Kitabah";
  }
  if (low.includes("muthola") || low.includes("mutola")) {
    return "Muthola'ah";
  }
  if (low.includes("imla")) {
    return "Imla'";
  }
  if (low.includes("khot") || low.includes("khat")) {
    return "Khot";
  }
  if (low.includes("insya")) {
    return "Insya'";
  }
  if (low.includes("muhadatsah") || low.includes("hiwar")) {
    return "Muhadatsah";
  }
  if (low.includes("tadribat")) {
    return "Tadribat 'alal Anmath";
  }
  if (low.includes("tafsir")) {
    return "Tafsir";
  }
  if (low.includes("entrepreneurship") || low.includes("kewirausahaan")) {
    return "Entrepreneurship";
  }

  return name;
}

export function getMapelAliases(standardName: string): string[] {
  const low = standardName.toLowerCase().trim();
  if (low === "kitabah") return ["Kitabah", "Khitobah"];
  if (low === "akidah") return ["Akidah", "Aqidah", "Tauhid"];
  if (low === "fikih") return ["Fikih", "Fiqih", "Fiqh"];
  if (low === "ushul fikih") return ["Ushul Fikih", "Ushul Fiqih", "Ushul Fiqh", "Fikih", "Fiqih"];
  if (low === "shorof") return ["Shorof", "Shorf", "Sharaf"];
  if (low === "hadis") return ["Hadis", "Hadits"];
  if (low === "sirah") return ["Sirah", "Siroh", "Sirah Nabi", "Siroh Nabi"];
  if (low === "akhlak") return ["Akhlak", "Akhlaq"];
  if (low === "tahsin") return ["Tahsin", "Tahsin Al-Qur'an", "Tahsin Al-Quran"];
  if (low === "tahfidz") return ["Tahfidz", "Tahfidz Al-Qur'an", "Tahfiz"];
  if (low === "bahasa indonesia") return ["Bahasa Indonesia", "B. Indonesia", "Indonesia"];
  if (low === "bahasa arab") return ["Bahasa Arab", "B. Arab", "Arab"];
  if (low === "bahasa inggris") return ["Bahasa Inggris", "B. Inggris", "Inggris", "English"];
  if (low === "matematika") return ["Matematika", "MTK"];
  if (low === "ipa terpadu") return ["IPA Terpadu", "IPA"];
  if (low === "ips terpadu") return ["IPS Terpadu", "IPS"];
  return [standardName];
}
