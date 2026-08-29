export interface Surah {
  nomor: number;
  nama_latin: string;
  nama_arab: string;
  total_ayat: number;
  halaman_mulai: number;
}

export const surahData: Surah[] = [
  { nomor: 1, nama_latin: 'Al-Fatihah', nama_arab: 'Ø§Ù„ÙØ§ØªØ­Ø©', total_ayat: 7, halaman_mulai: 1 },
  { nomor: 2, nama_latin: 'Al-Baqarah', nama_arab: 'Ø§Ù„Ø¨Ù‚Ø±Ø©', total_ayat: 286, halaman_mulai: 2 },
  { nomor: 3, nama_latin: 'Ali Imran', nama_arab: 'Ø¢Ù„ Ø¹Ù…Ø±Ø§Ù†', total_ayat: 200, halaman_mulai: 50 },
  { nomor: 4, nama_latin: 'An-Nisa', nama_arab: 'Ø§Ù„Ù†Ø³Ø§Ø¡', total_ayat: 176, halaman_mulai: 77 },
  { nomor: 5, nama_latin: 'Al-Ma\'idah', nama_arab: 'Ø§Ù„Ù…Ø§Ø¦Ø¯Ø©', total_ayat: 120, halaman_mulai: 106 },
  { nomor: 6, nama_latin: 'Al-An\'am', nama_arab: 'Ø§Ù„Ø£Ù†Ø¹Ø§Ù…', total_ayat: 165, halaman_mulai: 128 },
  { nomor: 7, nama_latin: 'Al-A\'raf', nama_arab: 'Ø§Ù„Ø£Ø¹Ø±Ø§Ù', total_ayat: 206, halaman_mulai: 151 },
  { nomor: 8, nama_latin: 'Al-Anfal', nama_arab: 'Ø§Ù„Ø£Ù†ÙØ§Ù„', total_ayat: 75, halaman_mulai: 177 },
  { nomor: 9, nama_latin: 'At-Taubah', nama_arab: 'Ø§Ù„ØªÙˆØ¨Ø©', total_ayat: 129, halaman_mulai: 187 },
  { nomor: 10, nama_latin: 'Yunus', nama_arab: 'ÙŠÙˆÙ†Ø³', total_ayat: 109, halaman_mulai: 208 },
  { nomor: 11, nama_latin: 'Hud', nama_arab: 'Ù‡ÙˆØ¯', total_ayat: 123, halaman_mulai: 221 },
  { nomor: 12, nama_latin: 'Yusuf', nama_arab: 'ÙŠÙˆØ³Ù', total_ayat: 111, halaman_mulai: 235 },
  { nomor: 13, nama_latin: 'Ar-Ra\'d', nama_arab: 'Ø§Ù„Ø±Ø¹Ø¯', total_ayat: 43, halaman_mulai: 249 },
  { nomor: 14, nama_latin: 'Ibrahim', nama_arab: 'Ø¥Ø¨Ø±Ø§Ù‡ÙŠÙ…', total_ayat: 52, halaman_mulai: 255 },
  { nomor: 15, nama_latin: 'Al-Hijr', nama_arab: 'Ø§Ù„Ø­Ø¬Ø±', total_ayat: 99, halaman_mulai: 262 },
  { nomor: 16, nama_latin: 'An-Nahl', nama_arab: 'Ø§Ù„Ù†Ø­Ù„', total_ayat: 128, halaman_mulai: 267 },
  { nomor: 17, nama_latin: 'Al-Isra', nama_arab: 'Ø§Ù„Ø¥Ø³Ø±Ø§Ø¡', total_ayat: 111, halaman_mulai: 282 },
  { nomor: 18, nama_latin: 'Al-Kahf', nama_arab: 'Ø§Ù„ÙƒÙ‡Ù', total_ayat: 110, halaman_mulai: 293 },
  { nomor: 19, nama_latin: 'Maryam', nama_arab: 'Ù…Ø±ÙŠÙ…', total_ayat: 98, halaman_mulai: 305 },
  { nomor: 20, nama_latin: 'Ta-Ha', nama_arab: 'Ø·Ù‡', total_ayat: 135, halaman_mulai: 312 },
  { nomor: 21, nama_latin: 'Al-Anbiya', nama_arab: 'Ø§Ù„Ø£Ù†Ø¨ÙŠØ§Ø¡', total_ayat: 112, halaman_mulai: 322 },
  { nomor: 22, nama_latin: 'Al-Hajj', nama_arab: 'Ø§Ù„Ø­Ø¬', total_ayat: 78, halaman_mulai: 332 },
  { nomor: 23, nama_latin: 'Al-Mu\'minun', nama_arab: 'Ø§Ù„Ù…Ø¤Ù…Ù†ÙˆÙ†', total_ayat: 118, halaman_mulai: 342 },
  { nomor: 24, nama_latin: 'An-Nur', nama_arab: 'Ø§Ù„Ù†ÙˆØ±', total_ayat: 64, halaman_mulai: 350 },
  { nomor: 25, nama_latin: 'Al-Furqan', nama_arab: 'Ø§Ù„ÙØ±Ù‚Ø§Ù†', total_ayat: 77, halaman_mulai: 359 },
  { nomor: 26, nama_latin: 'Ash-Shu\'ara', nama_arab: 'Ø§Ù„Ø´Ø¹Ø±Ø§Ø¡', total_ayat: 227, halaman_mulai: 367 },
  { nomor: 27, nama_latin: 'An-Naml', nama_arab: 'Ø§Ù„Ù†Ù…Ù„', total_ayat: 93, halaman_mulai: 377 },
  { nomor: 28, nama_latin: 'Al-Qasas', nama_arab: 'Ø§Ù„Ù‚ØµØµ', total_ayat: 88, halaman_mulai: 385 },
  { nomor: 29, nama_latin: 'Al-Ankabut', nama_arab: 'Ø§Ù„Ø¹Ù†ÙƒØ¨ÙˆØª', total_ayat: 69, halaman_mulai: 396 },
  { nomor: 30, nama_latin: 'Ar-Rum', nama_arab: 'Ø§Ù„Ø±ÙˆÙ…', total_ayat: 60, halaman_mulai: 404 },
  { nomor: 31, nama_latin: 'Luqman', nama_arab: 'Ù„Ù‚Ù…Ø§Ù†', total_ayat: 34, halaman_mulai: 411 },
  { nomor: 32, nama_latin: 'As-Sajdah', nama_arab: 'Ø§Ù„Ø³Ø¬Ø¯Ø©', total_ayat: 30, halaman_mulai: 415 },
  { nomor: 33, nama_latin: 'Al-Ahzab', nama_arab: 'Ø§Ù„Ø£Ø­Ø²Ø§Ø¨', total_ayat: 73, halaman_mulai: 418 },
  { nomor: 34, nama_latin: 'Saba', nama_arab: 'Ø³Ø¨Ø£', total_ayat: 54, halaman_mulai: 428 },
  { nomor: 35, nama_latin: 'Fatir', nama_arab: 'ÙØ§Ø·Ø±', total_ayat: 45, halaman_mulai: 434 },
  { nomor: 36, nama_latin: 'Ya-Sin', nama_arab: 'ÙŠØ³', total_ayat: 83, halaman_mulai: 440 },
  { nomor: 37, nama_latin: 'As-Saffat', nama_arab: 'Ø§Ù„ØµØ§ÙØ§Øª', total_ayat: 182, halaman_mulai: 446 },
  { nomor: 38, nama_latin: 'Sad', nama_arab: 'Øµ', total_ayat: 88, halaman_mulai: 453 },
  { nomor: 39, nama_latin: 'Az-Zumar', nama_arab: 'Ø§Ù„Ø²Ù…Ø±', total_ayat: 75, halaman_mulai: 458 },
  { nomor: 40, nama_latin: 'Ghafir', nama_arab: 'ØºØ§ÙØ±', total_ayat: 85, halaman_mulai: 467 },
  { nomor: 41, nama_latin: 'Fussilat', nama_arab: 'ÙØµÙ„Øª', total_ayat: 54, halaman_mulai: 477 },
  { nomor: 42, nama_latin: 'Ash-Shura', nama_arab: 'Ø§Ù„Ø´ÙˆØ±Ù‰', total_ayat: 53, halaman_mulai: 483 },
  { nomor: 43, nama_latin: 'Az-Zukhruf', nama_arab: 'Ø§Ù„Ø²Ø®Ø±Ù', total_ayat: 89, halaman_mulai: 489 },
  { nomor: 44, nama_latin: 'Ad-Dukhan', nama_arab: 'Ø§Ù„Ø¯Ø®Ø§Ù†', total_ayat: 59, halaman_mulai: 496 },
  { nomor: 45, nama_latin: 'Al-Jathiyah', nama_arab: 'Ø§Ù„Ø¬Ø§Ø«ÙŠØ©', total_ayat: 37, halaman_mulai: 499 },
  { nomor: 46, nama_latin: 'Al-Ahqaf', nama_arab: 'Ø§Ù„Ø£Ø­Ù‚Ø§Ù', total_ayat: 35, halaman_mulai: 502 },
  { nomor: 47, nama_latin: 'Muhammad', nama_arab: 'Ù…Ø­Ù…Ø¯', total_ayat: 38, halaman_mulai: 507 },
  { nomor: 48, nama_latin: 'Al-Fath', nama_arab: 'Ø§Ù„ÙØªØ­', total_ayat: 29, halaman_mulai: 511 },
  { nomor: 49, nama_latin: 'Al-Hujurat', nama_arab: 'Ø§Ù„Ø­Ø¬Ø±Ø§Øª', total_ayat: 18, halaman_mulai: 515 },
  { nomor: 50, nama_latin: 'Qaf', nama_arab: 'Ù‚', total_ayat: 45, halaman_mulai: 518 },
  { nomor: 51, nama_latin: 'Adh-Dhariyat', nama_arab: "Ø§Ù„Ø°Ø§Ø±ÙŠØ§Øª", total_ayat: 60, halaman_mulai: 520 },
  { nomor: 52, nama_latin: 'At-Tur', nama_arab: 'Ø§Ù„Ø·ÙˆØ±', total_ayat: 49, halaman_mulai: 523 },
  { nomor: 53, nama_latin: 'An-Najm', nama_arab: 'Ø§Ù„Ù†Ø¬Ù…', total_ayat: 62, halaman_mulai: 526 },
  { nomor: 54, nama_latin: 'Al-Qamar', nama_arab: 'Ø§Ù„Ù‚Ù…Ø±', total_ayat: 55, halaman_mulai: 528 },
  { nomor: 55, nama_latin: 'Ar-Rahman', nama_arab: 'Ø§Ù„Ø±Ø­Ù…Ù†', total_ayat: 78, halaman_mulai: 531 },
  { nomor: 56, nama_latin: 'Al-Waqi\'ah', nama_arab: 'Ø§Ù„ÙˆØ§Ù‚Ø¹Ø©', total_ayat: 96, halaman_mulai: 534 },
  { nomor: 57, nama_latin: 'Al-Hadid', nama_arab: 'Ø§Ù„Ø­Ø¯ÙŠØ¯', total_ayat: 29, halaman_mulai: 537 },
  { nomor: 58, nama_latin: 'Al-Mujadila', nama_arab: 'Ø§Ù„Ù…Ø¬Ø§Ø¯Ù„Ø©', total_ayat: 22, halaman_mulai: 542 },
  { nomor: 59, nama_latin: 'Al-Hashr', nama_arab: 'Ø§Ù„Ø­Ø´Ø±', total_ayat: 24, halaman_mulai: 545 },
  { nomor: 60, nama_latin: 'Al-Mumtahanah', nama_arab: 'Ø§Ù„Ù…Ù…ØªØ­Ù†Ø©', total_ayat: 13, halaman_mulai: 549 },
  { nomor: 61, nama_latin: 'As-Saf', nama_arab: 'Ø§Ù„ØµÙ', total_ayat: 14, halaman_mulai: 551 },
  { nomor: 62, nama_latin: 'Al-Jumu\'ah', nama_arab: 'Ø§Ù„Ø¬Ù…Ø¹Ø©', total_ayat: 11, halaman_mulai: 553 },
  { nomor: 63, nama_latin: 'Al-Munafiqun', nama_arab: 'Ø§Ù„Ù…Ù†Ø§ÙÙ‚ÙˆÙ†', total_ayat: 11, halaman_mulai: 554 },
  { nomor: 64, nama_latin: 'At-Taghabun', nama_arab: 'Ø§Ù„ØªØºØ§Ø¨Ù†', total_ayat: 18, halaman_mulai: 556 },
  { nomor: 65, nama_latin: 'At-Talaq', nama_arab: 'Ø§Ù„Ø·Ù„Ø§Ù‚', total_ayat: 12, halaman_mulai: 558 },
  { nomor: 66, nama_latin: 'At-Tahrim', nama_arab: 'Ø§Ù„ØªØ­Ø±ÙŠÙ…', total_ayat: 12, halaman_mulai: 560 },
  { nomor: 67, nama_latin: 'Al-Mulk', nama_arab: 'Ø§Ù„Ù…Ù„Ùƒ', total_ayat: 30, halaman_mulai: 562 },
  { nomor: 68, nama_latin: 'Al-Qalam', nama_arab: 'Ø§Ù„Ù‚Ù„Ù…', total_ayat: 52, halaman_mulai: 564 },
  { nomor: 69, nama_latin: 'Al-Haqqah', nama_arab: 'Ø§Ù„Ø­Ø§Ù‚Ø©', total_ayat: 52, halaman_mulai: 566 },
  { nomor: 70, nama_latin: 'Al-Ma\'arij', nama_arab: 'Ø§Ù„Ù…Ø¹Ø§Ø±Ø¬', total_ayat: 44, halaman_mulai: 568 },
  { nomor: 71, nama_latin: 'Nuh', nama_arab: 'Ù†ÙˆØ­', total_ayat: 28, halaman_mulai: 570 },
  { nomor: 72, nama_latin: 'Al-Jinn', nama_arab: 'Ø§Ù„Ø¬Ù†', total_ayat: 28, halaman_mulai: 572 },
  { nomor: 73, nama_latin: 'Al-Muzzammil', nama_arab: 'Ø§Ù„Ù…Ø²Ù…Ù„', total_ayat: 20, halaman_mulai: 574 },
  { nomor: 74, nama_latin: 'Al-Muddathir', nama_arab: 'Ø§Ù„Ù…Ø¯Ø«Ø±', total_ayat: 56, halaman_mulai: 575 },
  { nomor: 75, nama_latin: 'Al-Qiyamah', nama_arab: 'Ø§Ù„Ù‚ÙŠØ§Ù…Ø©', total_ayat: 40, halaman_mulai: 577 },
  { nomor: 76, nama_latin: 'Al-Insan', nama_arab: 'Ø§Ù„Ø¥Ù†Ø³Ø§Ù†', total_ayat: 31, halaman_mulai: 578 },
  { nomor: 77, nama_latin: 'Al-Mursalat', nama_arab: 'Ø§Ù„Ù…Ø±Ø³Ù„Ø§Øª', total_ayat: 50, halaman_mulai: 580 },
  { nomor: 78, nama_latin: 'An-Naba', nama_arab: 'Ø§Ù„Ù†Ø¨Ø£', total_ayat: 40, halaman_mulai: 582 },
  { nomor: 79, nama_latin: 'An-Nazi\'at', nama_arab: 'Ø§Ù„Ù†Ø§Ø²Ø¹Ø§Øª', total_ayat: 46, halaman_mulai: 583 },
  { nomor: 80, nama_latin: 'Abasa', nama_arab: 'Ø¹Ø¨Ø³', total_ayat: 42, halaman_mulai: 585 },
  { nomor: 81, nama_latin: 'At-Takwir', nama_arab: 'Ø§Ù„ØªÙƒÙˆÙŠØ±', total_ayat: 29, halaman_mulai: 586 },
  { nomor: 82, nama_latin: 'Al-Infitar', nama_arab: 'Ø§Ù„Ø§Ù†ÙØ·Ø§Ø±', total_ayat: 19, halaman_mulai: 587 },
  { nomor: 83, nama_latin: 'Al-Mutaffifin', nama_arab: 'Ø§Ù„Ù…Ø·ÙÙÙŠÙ†', total_ayat: 36, halaman_mulai: 587 },
  { nomor: 84, nama_latin: 'Al-Inshiqaq', nama_arab: 'Ø§Ù„Ø§Ù†Ø´Ù‚Ø§Ù‚', total_ayat: 25, halaman_mulai: 589 },
  { nomor: 85, nama_latin: 'Al-Buruj', nama_arab: 'Ø§Ù„Ø¨Ø±ÙˆØ¬', total_ayat: 22, halaman_mulai: 590 },
  { nomor: 86, nama_latin: 'At-Tariq', nama_arab: 'Ø§Ù„Ø·Ø§Ø±Ù‚', total_ayat: 17, halaman_mulai: 591 },
  { nomor: 87, nama_latin: 'Al-Ala', nama_arab: 'Ø§Ù„Ø£Ø¹Ù„Ù‰', total_ayat: 19, halaman_mulai: 591 },
  { nomor: 88, nama_latin: 'Al-Ghashiyah', nama_arab: 'Ø§Ù„ØºØ§Ø´ÙŠØ©', total_ayat: 26, halaman_mulai: 592 },
  { nomor: 89, nama_latin: 'Al-Fajr', nama_arab: 'Ø§Ù„ÙØ¬Ø±', total_ayat: 30, halaman_mulai: 593 },
  { nomor: 90, nama_latin: 'Al-Balad', nama_arab: 'Ø§Ù„Ø¨Ù„Ø¯', total_ayat: 20, halaman_mulai: 594 },
  { nomor: 91, nama_latin: 'Ash-Shams', nama_arab: 'Ø§Ù„Ø´Ù…Ø³', total_ayat: 15, halaman_mulai: 595 },
  { nomor: 92, nama_latin: 'Al-Layl', nama_arab: 'Ø§Ù„Ù„ÙŠÙ„', total_ayat: 21, halaman_mulai: 595 },
  { nomor: 93, nama_latin: 'Ad-Duha', nama_arab: 'Ø§Ù„Ø¶Ø­Ù‰', total_ayat: 11, halaman_mulai: 596 },
  { nomor: 94, nama_latin: 'Ash-Sharh', nama_arab: 'Ø§Ù„Ø´Ø±Ø­', total_ayat: 8, halaman_mulai: 596 },
  { nomor: 95, nama_latin: 'At-Tin', nama_arab: 'Ø§Ù„ØªÙŠÙ†', total_ayat: 8, halaman_mulai: 597 },
  { nomor: 96, nama_latin: 'Al-Alaq', nama_arab: 'Ø§Ù„Ø¹Ù„Ù‚', total_ayat: 19, halaman_mulai: 597 },
  { nomor: 97, nama_latin: 'Al-Qadr', nama_arab: 'Ø§Ù„Ù‚Ø¯Ø±', total_ayat: 5, halaman_mulai: 598 },
  { nomor: 98, nama_latin: 'Al-Bayyinah', nama_arab: 'Ø§Ù„Ø¨ÙŠÙ†Ø©', total_ayat: 8, halaman_mulai: 598 },
  { nomor: 99, nama_latin: 'Az-Zalzalah', nama_arab: 'Ø§Ù„Ø²Ù„Ø²Ù„Ø©', total_ayat: 8, halaman_mulai: 599 },
  { nomor: 100, nama_latin: 'Al-Adiyat', nama_arab: 'Ø§Ù„Ø¹Ø§Ø¯ÙŠØ§Øª', total_ayat: 11, halaman_mulai: 599 },
  { nomor: 101, nama_latin: 'Al-Qari\'ah', nama_arab: 'Ø§Ù„Ù‚Ø§Ø±Ø¹Ø©', total_ayat: 11, halaman_mulai: 600 },
  { nomor: 102, nama_latin: 'At-Takathur', nama_arab: 'Ø§Ù„ØªÙƒØ§Ø«Ø±', total_ayat: 8, halaman_mulai: 600 },
  { nomor: 103, nama_latin: 'Al-Asr', nama_arab: 'Ø§Ù„Ø¹ØµØ±', total_ayat: 3, halaman_mulai: 601 },
  { nomor: 104, nama_latin: 'Al-Humazah', nama_arab: 'Ø§Ù„Ù‡Ù…Ø²Ø©', total_ayat: 9, halaman_mulai: 601 },
  { nomor: 105, nama_latin: 'Al-Fil', nama_arab: 'Ø§Ù„ÙÙŠÙ„', total_ayat: 5, halaman_mulai: 601 },
  { nomor: 106, nama_latin: 'Quraysh', nama_arab: 'Ù‚Ø±ÙŠØ´', total_ayat: 4, halaman_mulai: 602 },
  { nomor: 107, nama_latin: 'Al-Ma\'un', nama_arab: 'Ø§Ù„Ù…Ø§Ø¹ÙˆÙ†', total_ayat: 7, halaman_mulai: 602 },
  { nomor: 108, nama_latin: 'Al-Kawthar', nama_arab: 'Ø§Ù„ÙƒÙˆØ«Ø±', total_ayat: 3, halaman_mulai: 602 },
  { nomor: 109, nama_latin: 'Al-Kafirun', nama_arab: 'Ø§Ù„ÙƒØ§ÙØ±ÙˆÙ†', total_ayat: 6, halaman_mulai: 603 },
  { nomor: 110, nama_latin: 'An-Nasr', nama_arab: 'Ø§Ù„Ù†ØµØ±', total_ayat: 3, halaman_mulai: 603 },
  { nomor: 111, nama_latin: 'Al-Masad', nama_arab: 'Ø§Ù„Ù…Ø³Ø¯', total_ayat: 5, halaman_mulai: 603 },
  { nomor: 112, nama_latin: 'Al-Ikhlas', nama_arab: 'Ø§Ù„Ø¥Ø®Ù„Ø§Øµ', total_ayat: 4, halaman_mulai: 604 },
  { nomor: 113, nama_latin: 'Al-Falaq', nama_arab: 'Ø§Ù„ÙÙ„Ù‚', total_ayat: 5, halaman_mulai: 604 },
  { nomor: 114, nama_latin: 'An-Nas', nama_arab: 'Ø§Ù„Ù†Ø§Ø³', total_ayat: 6, halaman_mulai: 604 },
];

export function searchSurah(query: string): Surah[] {
  if (!query) return surahData;
  const qRaw = query.toLowerCase().trim();
  const qNorm = qRaw.replace(/[-'\s`â€™]+/g, "");
  return surahData.filter((s) => {
    const latinRaw = s.nama_latin.toLowerCase();
    const latinNorm = latinRaw.replace(/[-'\s`â€™]+/g, "");
    return (
      latinRaw.includes(qRaw) ||
      latinNorm.includes(qNorm) ||
      s.nama_arab.includes(qRaw) ||
      String(s.nomor) === qRaw
    );
  });
}

export function getSurahByNomor(n: number): Surah | undefined {
  return surahData.find((s) => s.nomor === n);
}

export function calculateHalaman(
  surahNomor: number,
  ayatDari: number,
  ayatKe: number,
  surahSelesaiNomor?: number
): number {
  if (!surahSelesaiNomor || surahSelesaiNomor === surahNomor) {
    const surah = getSurahByNomor(surahNomor);
    if (!surah) return 0;
    const totalAyat = surah.total_ayat;
    const nextSurah = getSurahByNomor(surahNomor + 1);
    const halamanSelesai = nextSurah ? nextSurah.halaman_mulai - 1 : 604;
    const halamanStart = surah.halaman_mulai;
    const rangePages = halamanSelesai - halamanStart + 1;
    const halamanCount = ((Math.max(0, ayatKe - ayatDari + 1)) / totalAyat) * rangePages;
    return Math.round(halamanCount * 10) / 10;
  }

  let totalHalaman = 0;
  
  const firstSurah = getSurahByNomor(surahNomor);
  if (firstSurah) {
    const nextFirst = getSurahByNomor(surahNomor + 1);
    const halEnd = nextFirst ? nextFirst.halaman_mulai - 1 : 604;
    const halStart = firstSurah.halaman_mulai;
    const rangePages = halEnd - halStart + 1;
    const sisaAyat = firstSurah.total_ayat - ayatDari + 1;
    totalHalaman += (Math.max(0, sisaAyat) / firstSurah.total_ayat) * rangePages;
  }

  for (let i = surahNomor + 1; i < surahSelesaiNomor; i++) {
    const midSurah = getSurahByNomor(i);
    const nextMid = getSurahByNomor(i + 1);
    if (midSurah) {
      const halEnd = nextMid ? nextMid.halaman_mulai - 1 : 604;
      const halStart = midSurah.halaman_mulai;
      totalHalaman += (halEnd - halStart + 1);
    }
  }

  const lastSurah = getSurahByNomor(surahSelesaiNomor);
  if (lastSurah) {
    const nextLast = getSurahByNomor(surahSelesaiNomor + 1);
    const halEnd = nextLast ? nextLast.halaman_mulai - 1 : 604;
    const halStart = lastSurah.halaman_mulai;
    const rangePages = halEnd - halStart + 1;
    totalHalaman += (Math.max(0, ayatKe) / lastSurah.total_ayat) * rangePages;
  }

  return Math.round(totalHalaman * 10) / 10;
}
