#!/usr/bin/env node
/**
 * generate-safelist.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Script prebuild otomatis untuk Tailwind v4 pada project Al-Imam SIKAP.
 *
 * MASALAH:
 *   Tailwind v4 tidak bisa scan folder bernama "(dashboard)" di Linux/Docker
 *   karena tanda kurung adalah karakter spesial dalam glob pattern.
 *   Akibatnya semua class di halaman (dashboard)/** tidak masuk ke CSS production.
 *
 * SOLUSI:
 *   Script ini membaca semua file .tsx/.ts dari seluruh folder src/ secara manual
 *   (tanpa glob — pakai recursive readdir Node.js asli yang tidak terpengaruh
 *   masalah glob Linux), lalu mengekstrak semua className, dan menuliskan
 *   daftar lengkap ke @source inline("...") di globals.css.
 *
 * CARA PAKAI:
 *   Otomatis dijalankan via "prebuild" script di package.json sebelum next build.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs   = require('fs');
const path = require('path');

const ROOT        = path.join(__dirname, '..');
const GLOBALS_CSS = path.join(ROOT, 'src', 'app', 'globals.css');

/** Direktori yang akan di-scan recursively */
const SCAN_DIRS = [
  path.join(ROOT, 'src', 'app'),
  path.join(ROOT, 'src', 'components'),
  path.join(ROOT, 'src', 'lib'),
];

/** Pattern kelas yang BUKAN Tailwind (biar tidak noise) */
const IGNORED_CLASS_PATTERNS = [
  /^__/,           // next.js internal
  /^:/,            // CSS pseudo selector
  /^\./,           // relative paths
  /\//,            // paths (e.g. file paths)
  /\n/,            // newlines
  /^\{/,           // object syntax
  /^import/,       // import keyword
  /^export/,
  /^const/,
  /^function/,
  /^return/,
  /['"{}()]/,      // syntax characters — KECUALI yang ada di arbitrary values
];

// ──────────────────────────────────────────────────────────────────────────────
// Helper: walk directory recursively tanpa glob (aman untuk folder dengan ())
// ──────────────────────────────────────────────────────────────────────────────
function walkDir(dir, exts = ['.tsx', '.ts', '.jsx', '.js']) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules dan .next
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      results.push(...walkDir(fullPath, exts));
    } else if (exts.some(ext => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

// ──────────────────────────────────────────────────────────────────────────────
// Helper: ekstrak semua class dari satu file
// ──────────────────────────────────────────────────────────────────────────────
function extractClassesFromFile(content) {
  const classes = new Set();

  // 1. className="..."
  const classNameMatches = content.match(/className=(?:["']([^"']+)["']|\{`([^`]+)`\})/g) || [];
  for (const match of classNameMatches) {
    const raw = match.replace(/^className=/, '').replace(/^['"`]|['"`]$/g, '').replace(/\$\{[^}]+\}/g, ' ');
    raw.split(/\s+/).forEach(c => {
      if (c && c.length > 0 && c.length < 100) classes.add(c);
    });
  }

  // 2. Class-like tokens anywhere in the file (words with colons, brackets, dashes)
  const tokens = content.match(/[a-zA-Z0-9!_\-:\/\[\].#%]+/g) || [];
  for (const t of tokens) {
    // Only collect valid tailwind tokens (containing Tailwind prefixes or utilities)
    if (
      t.includes(':') || 
      t.includes('[') || 
      t.startsWith('bg-') || 
      t.startsWith('text-') || 
      t.startsWith('p-') || 
      t.startsWith('px-') || 
      t.startsWith('py-') || 
      t.startsWith('m-') || 
      t.startsWith('mx-') || 
      t.startsWith('my-') || 
      t.startsWith('gap-') || 
      t.startsWith('rounded-') || 
      t.startsWith('border-') || 
      t.startsWith('shadow-') || 
      t.startsWith('flex-') || 
      t.startsWith('grid-') || 
      t.startsWith('w-') || 
      t.startsWith('h-') || 
      t.startsWith('min-') || 
      t.startsWith('max-') || 
      t.startsWith('space-') || 
      t.startsWith('items-') || 
      t.startsWith('justify-') || 
      t.startsWith('overflow-') || 
      t.startsWith('cursor-') || 
      t.startsWith('transition-') || 
      t.startsWith('duration-') || 
      t.startsWith('ease-') || 
      t.startsWith('animate-') || 
      t.startsWith('ring-') || 
      t.startsWith('outline-') || 
      t.startsWith('inset-') || 
      t.startsWith('top-') || 
      t.startsWith('bottom-') || 
      t.startsWith('left-') || 
      t.startsWith('right-') || 
      t.startsWith('z-') || 
      t.startsWith('font-') || 
      t.startsWith('leading-') || 
      t.startsWith('tracking-') || 
      t.startsWith('opacity-') || 
      t.startsWith('scale-') || 
      t.startsWith('rotate-') || 
      t.startsWith('translate-')
    ) {
      if (t.length > 1 && t.length < 120 && !t.endsWith(':')) {
        classes.add(t);
      }
    }
  }

  return classes;
}

// ──────────────────────────────────────────────────────────────────────────────
// Helper: apakah string ini seperti Tailwind class yang valid?
// ──────────────────────────────────────────────────────────────────────────────
function isLikelyTailwindClass(cls) {
  if (!cls || cls.length === 0 || cls.length > 150) return false;
  // Harus dimulai dengan huruf, !, atau -
  if (!/^[a-zA-Z!_\-]/.test(cls)) return false;
  // Tidak boleh ada spasi
  if (/\s/.test(cls)) return false;
  // Tidak boleh ada karakter aneh
  if (/['"`;{}]/.test(cls)) return false;
  // Tidak boleh IGNORED patterns
  if (IGNORED_CLASS_PATTERNS.some(p => p.test(cls))) return false;
  return true;
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────
console.log('\n🔍 [generate-safelist] Scanning Tailwind classes from source...');

// Kumpulkan semua file
let allFiles = [];
for (const dir of SCAN_DIRS) {
  const found = walkDir(dir);
  allFiles = allFiles.concat(found);
}
console.log(`   Found ${allFiles.length} source files to scan`);

// Ekstrak semua class
const allClasses = new Set();
for (const file of allFiles) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const classes = extractClassesFromFile(content);
    classes.forEach(c => allClasses.add(c));
  } catch (e) {
    // Abaikan file yang tidak bisa dibaca
  }
}

// Filter hanya yang terlihat seperti Tailwind class
const tailwindClasses = Array.from(allClasses)
  .filter(isLikelyTailwindClass)
  .sort();

console.log(`   Extracted ${tailwindClasses.length} unique Tailwind classes`);

// ──────────────────────────────────────────────────────────────────────────────
// Update safelist.txt
// ──────────────────────────────────────────────────────────────────────────────
const SAFELIST_TXT = path.join(ROOT, 'src', 'safelist.txt');

// Tulis semua kelas ke dalam safelist.txt dipisahkan oleh spasi
const safelistContent = tailwindClasses.join(' ');
fs.writeFileSync(SAFELIST_TXT, safelistContent, 'utf8');

console.log(`✅ [generate-safelist] src/safelist.txt updated with ${tailwindClasses.length} classes`);
console.log('');

