const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

code = code.replace(
  '    href: "/dashboard",\n    label: "Dashboard",\n    icon: <LayoutDashboard size={18} /> },',
  '    href: "/dashboard",\n    label: "Dashboard",\n    icon: <LayoutDashboard size={18} />,\n    roles: ["admin_super", "ADMIN_SUPER", "guru", "GURU", "musyrif", "MUSYRIF", "pengampu_halaqoh", "PENGAMPU_HALAQOH", "wali_kelas", "WALI_KELAS", "mudir", "MUDIR", "kepala_sekolah", "KEPALA_SEKOLAH", "kadiv_pengasuhan", "KADIV_PENGASUHAN", "kadiv_asrama", "KADIV_ASRAMA", "kadiv_kedisiplinan", "KADIV_KEDISIPLINAN", "kadiv_kurikulum", "KADIV_KURIKULUM", "admin_keuangan", "ADMIN_KEUANGAN"] },\n  {\n    href: "/wali/rapor",\n    label: "Rapor & Akademik",\n    icon: <BookOpen size={18} />,\n    roles: ["wali_santri", "WALI_SANTRI", "orang_tua", "wali"] },'
);

fs.writeFileSync('src/components/Sidebar.tsx', code);
