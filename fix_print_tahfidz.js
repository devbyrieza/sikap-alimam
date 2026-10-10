const fs = require('fs');
let file = fs.readFileSync('src/app/(dashboard)/rapor/print/[santri_id]/page.tsx', 'utf8');

// Render tahfidz block
const tahfidzBlock = `
        {/* TABEL TAHFIDZ */}
        <div style={{ marginTop: "20px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", fontFamily: "Georgia, serif" }}>
            <thead>
              <tr style={{ backgroundColor: "#f1f5f9" }}>
                <th colSpan={4} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "left", color: "#64748b" }}>LAPORAN TAHFIDZ & UJIAN (PRA TARGET)</th>
              </tr>
              <tr style={{ backgroundColor: "#fdf8f0" }}>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 8px" }}>Tanggal</th>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 8px" }}>Jenis / Hafalan</th>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 8px" }}>Nilai</th>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 8px" }}>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {data.ujian_tahfidz && data.ujian_tahfidz.length > 0 ? data.ujian_tahfidz.map((u: any, i: number) => (
                <tr key={i} style={{ backgroundColor: "white" }}>
                  <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center" }}>{new Date(u.tanggal).toLocaleDateString('id-ID')}</td>
                  <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center" }}>{u.jenis_ujian.replace(/_/g, ' ').toUpperCase()} (Juz {u.juz})</td>
                  <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontWeight: "bold" }}>{Math.round((u.nilai_bacaan + u.nilai_sikap) / 2)}</td>
                  <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center" }}>{u.is_lulus ? 'Lulus' : 'Belum Lulus'}</td>
                </tr>
              )) : (
                <tr style={{ backgroundColor: "white" }}>
                  <td colSpan={4} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center" }}>Belum ada data ujian tahfidz</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Tanda Tangan */}
`;

file = file.replace('        {/* Tanda Tangan */}', tahfidzBlock);

// Also add `tahfidz, ujian_tahfidz` to the destructuring
file = file.replace(
  'const { santri, nilai_akademik, kedisiplinan, kepribadian, absen, tahfidz } = data;',
  'const { santri, nilai_akademik, kedisiplinan, kepribadian, absen, tahfidz, ujian_tahfidz } = data;'
);

fs.writeFileSync('src/app/(dashboard)/rapor/print/[santri_id]/page.tsx', file);
