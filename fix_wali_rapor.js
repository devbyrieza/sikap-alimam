const fs = require('fs');
let code = fs.readFileSync('src/app/wali/rapor/page.tsx', 'utf8');

code = code.replace(
  'const isComplete = item.hasHarian || item.hasKomp || item.hasSikap || item.hasUjian;\n      const naNum = isComplete\n        ? (0.3 * item.harian + 0.2 * item.kompetensi + 0.1 * item.sikap + 0.4 * item.ujian)\n        : null;',
  'let naNum = null;\n      if (item.hasUjian && !item.hasHarian && !item.hasKomp && !item.hasSikap) {\n        naNum = item.ujian;\n      } else if (item.hasHarian || item.hasKomp || item.hasSikap || item.hasUjian) {\n        naNum = (0.3 * item.harian + 0.2 * item.kompetensi + 0.1 * item.sikap + 0.4 * item.ujian);\n      }'
);

const searchStr = `{/* TAB 1: RINGKASAN */}
        {activeTab === "ringkasan" && (
          <div className="flex flex-col gap-6">`;

const bannerHtml = `{/* TAB 1: RINGKASAN */}
        {activeTab === "ringkasan" && (
          <div className="flex flex-col gap-6">
            {/* BANNER RAPOR BAYANGAN PTS */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-4 mb-2">
              <AlertCircle size={24} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-blue-900 text-sm mb-1">Rapor Bayangan (PTS) Semester 1</h4>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Sesuai kebijakan akademik, nilai yang tertera pada periode ini merupakan <strong>Murni Nilai Penilaian Tengah Semester (PTS)</strong>. Komponen nilai Harian, Kompetensi, dan Sikap belum diakumulasikan dan baru akan diterapkan pada Rapor Akhir Semester (PAS).
                </p>
              </div>
            </div>`;

code = code.replace(searchStr, bannerHtml);

fs.writeFileSync('src/app/wali/rapor/page.tsx', code);
