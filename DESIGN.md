# DESIGN.md — SIKAP Al-Imam (Dashboard/Portal)

Design system hasil Fase 1 restyle UI untuk aplikasi dashboard. Berlaku untuk
seluruh perubahan lapisan presentasi (className/Tailwind, CSS, layout, komponen
visual, animasi) di repo ini.

**Keputusan yang disetujui pemilik project (2026-10-29):**
- Peran referensi: **zcode.z.ai versi terang (light mode)** — border-driven,
  hairline, muted, tanpa glass mencolok. Referensi tilas/npai hanya untuk
  nuansa pill/badge bila perlu.
- Kedalaman: **flat + hairline**.
- Efek dekoratif lama (glow, gradient-text, hover-lift, glass berat):
  **dihapus semua**.

**ATURAN MUTLAK:** warna brand, konten/teks/data/gambar/link, logika bisnis,
routing, API, database, autentikasi, state, dan validasi form TIDAK berubah.
Mode terang/gelap tidak ditambah/dikurangi. Tidak ada dependency baru.
Standar feedback `UI_STANDARDS.md` (SweetAlert2, tanpa `alert()/confirm()`)
tetap berlaku dan tidak diubah isinya.

---

## 1. Identitas brand — TERKUNCI (dipakai apa adanya)

| Token | Nilai | Keterangan |
|---|---|---|
| `--primary` | `#550000` | Maroon tua SIKAP |
| `--primary-dark` | `#380000` | Maroon lebih gelap |
| `--secondary` | `#ddc192` | Cream/tan khas |
| `--bg` | `#fcfaf8` | Latar hangat sangat terang |
| `--text-main` | `#1a1a1a` | Teks utama |
| Font sans | Plus Jakarta Sans | tidak diganti |

Sumber nilai: `src/app/globals.css` (`:root`).

## 2. Dial dashboard (berbeda dari website publik)

**VARIANCE rendah · MOTION rendah · DENSITY tinggi.**

- Konsistensi di atas dekorasi: satu gaya kartu, satu gaya tabel, satu gaya
  tombol di SEMUA modul (akademik, nilai, presensi, keuangan, halaqoh, dst.).
- Keterbacaan data menang: **jangan menambah padding pada tabel/rapor** yang
  membuat data padat jadi boros ruang; jangan mengecilkan font tabel di bawah
  12px; `tabular-nums` untuk angka & nilai.
- Motion minimal: transisi 150ms untuk hover/fokus saja. Tanpa scroll-reveal,
  tanpa lift, tanpa animasi masuk per-section.

## 3. Design tokens

### Radius (turun dari 24px yang sekarang)
`sm` 8 (badge, sel, input kecil) · `md` 10 (tombol, item sidebar, baris
terpisah) · `lg` 12 (**kartu/panel konten**) · `xl` 16 (panel besar, modal
konten) · `full` (pill, avatar). Tabel dibungkus kartu radius 12 dengan
`overflow-hidden`, bukan radius per-sel.

### Shadow (netral, sangat halus)
`xs` `0 1px 2px rgba(0,0,0,.05)` kartu rest · `sm` `0 1px 3px rgba(0,0,0,.06)`
hover/modal ringan · `lg` `0 12px 28px -6px rgba(0,0,0,.12)` hanya modal.
Tidak ada colored glow.

### Border
Kartu: `1px solid #e7e2da` (hairline hangat, selaras `--bg`) atau `slate-200`
bila sudah terlanjur konsisten; pilih SATU dan terapkan merata. Divider tabel:
`1px solid #f0ece4`. Sidebar: pemisah tipis, tanpa gradient background.

### Tipografi (font tidak berubah)
Judul halaman 700/−0.02em `#1a1a1a` · judul kartu 600 `#1a1a1a` · body 400/1.6
`#44403c`-abu hangat · label form 600/0.01em, ukuran 13–14px · angka & nilai
`tabular-nums`. Tidak ada heading berwarna maroon penuh kecuali judul halaman
(satu aksen). Tidak ada uppercase + tracking lebar untuk label biasa.

### Spacing
Halaman: `p-4 md:p-6` di dalam konten dashboard (jaga density) · kartu `p-4
md:p-5` · grid stat `gap-3 md:gap-4` · baris tabel py-2.5 (jangan ditambah).

## 4. Komponen dasar

- **Button**: primary = `rounded-[10px]` (bukan pill di dashboard — konsisten
  dengan input), solid maroon `#550000`, teks putih, hover `#380000`, active
  `scale(.98)`; secondary = putih border hairline, hover `bg-[#f6f1e8]`; danger
  = merah status standar yang sudah ada; disabled jelas.
- **Card/Panel**: putih, border 1px hairline hangat, radius 12, `shadow-xs`;
  header kartu: judul 600 + aksi kanan; hover hanya untuk kartu yang benar-benar
  bisa diklik (border menguat).
- **Tabel**: dalam kartu radius 12 `overflow-hidden`; header `bg-[#faf6ee]`
  (tint cream sangat muda) teks 600 13px; baris hover `#faf6ee` 150ms; angka
  rata kanan `tabular-nums`; baris total/rapor ditebalkan; paging/filter di
  footer kartu. **Jangan ubah struktur data atau kolom.**
- **Sidebar**: latar putih atau `#faf6ee` muda (bukan maroon gelap penuh —
  ikuti gaya yang SUDAH ada; jika kini maroon gelap, biarkan warnanya, cukup
  rapikan: item radius 10, aktif = `bg-white/10` + indikator kiri 3px cream
  `#ddc192`, hover `bg-white/5`); logo area tetap.
- **Topbar/Header**: putih, border-b hairline; judul halaman + breadcrumb;
  jam realtime & komponen yang ada tetap.
- **Badge status** (hadir/izin/terlambat, status SPP, dst.): pill tint
  (`*-100` + teks `*-700`), titik indikator boleh; konsisten di semua modul.
- **Input**: border hairline, radius 10, fokus ring `0 0 0 3px rgba(85,0,0,.10)`
  + border maroon; label di atas input.
- **Modal** (termasuk Swal): radius 16–20, header + footer terpisah divider;
  konfirmasi tetap via SweetAlert2 dengan warna institusi yang sudah
  ditetapkan `UI_STANDARDS.md`.

## 5. Do & Don't

**Do**: kontras AA; `:focus-visible` ring jelas; `tabular-nums`; sticky header
tabel bila kolom banyak; skeleton/shimmer halus saat loading data (150ms);
uji 375/768/1440 (dashboard wajib enak di tablet guru).
**Don't**: gradient/glow/neon; lift kartu; animasi masuk; menambah padding
tabel yang membunuh density; mengubah warna maroon/cream; menambah mode gelap.

## 6. Mapping pola lama → arah baru

| Pola lama | Arah baru |
|---|---|
| `--radius: 24px` global | skala 8/10/12/16 di atas |
| Kartu hover −2px/−4px + scale | tanpa transform; border menguat |
| Gradient/glow pada kartu stat | kartu flat + border; angka besar `tabular-nums` |
| Label uppercase tracking lebar | 600/0.01em normal case |
| Shimmer bertumpuk/`!important` berantakan | satu util skeleton halus |
| `* { cursor: pointer !important }` (jika ada) | hapus |

## 7. Rencana eksekusi (Fase 2)

1. Branch `ui/restyle-sikap-alimam` dari `master`; commit pertama: DESIGN.md +
   konsolidasi token `globals.css`.
2. Commit bertahap: token & base → Sidebar/Topbar → komponen `ui/` bersama →
   modul satu per satu (dashboard, akademik, nilai, presensi, …) dengan tabel
   diverifikasi per modul.
3. QA: lint/typecheck/build + screenshot 375/768/1440 per modul utama.
4. Laporan lalu berhenti menunggu persetujuan.
