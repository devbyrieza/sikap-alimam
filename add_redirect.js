const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/dashboard/page.tsx', 'utf8');

code = code.replace(
  'const session = await getSession();',
  'const session = await getSession();\n  const userRoles = (session?.role || "").toLowerCase().split(",").map(r => r.trim());\n  const isWaliSantri = userRoles.includes("wali_santri") || userRoles.includes("orang_tua") || userRoles.includes("wali");\n  if (isWaliSantri) { const { redirect } = await import("next/navigation"); redirect("/wali/rapor"); }'
);

fs.writeFileSync('src/app/(dashboard)/dashboard/page.tsx', code);
