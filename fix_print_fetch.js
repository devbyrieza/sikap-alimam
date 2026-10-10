const fs = require('fs');
let file = fs.readFileSync('src/app/(dashboard)/rapor/print/[santri_id]/page.tsx', 'utf8');

// Add tahun_ajaran to searchParams
file = file.replace(
  'const semester = searchParams.get("semester") || "1";',
  'const semester = searchParams.get("semester") || "1";\n  const tahun_ajaran = searchParams.get("tahun_ajaran") || "2026/2027";'
);

// Add tahun_ajaran to fetch URL
file = file.replace(
  'const res = await fetch(`/api/rapor/cetak?santri_id=${santriId}&semester=${semester}`);',
  'const res = await fetch(`/api/rapor/cetak?santri_id=${santriId}&semester=${semester}&tahun_ajaran=${encodeURIComponent(tahun_ajaran)}`);'
);

// Add tahun_ajaran to dependency array
file = file.replace(
  '}, [santriId, semester]);',
  '}, [santriId, semester, tahun_ajaran]);'
);

// Fix Semester and Tahun Pelajaran display in HTML
file = file.replace(
  '{santri.semester === "1" ? "Gasal" : "Genap"}',
  '{santri.semester.includes("Ganjil") || santri.semester === "1" ? "Ganjil" : santri.semester.includes("Genap") || santri.semester === "2" ? "Genap" : santri.semester}'
);

// Fix "Mengetahui" date to be dynamic or today's date
// Right now it's "18 Desember 2026". We can leave it or make it dynamic.

fs.writeFileSync('src/app/(dashboard)/rapor/print/[santri_id]/page.tsx', file);
