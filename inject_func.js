const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/master/santri/page.tsx', 'utf8');

const functionBody = `
  const handleSaveSantri = async () => {
    if (!formSantri.nama_lengkap || !formSantri.kelas_id) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Nama lengkap dan Kelas wajib diisi' });
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/master/santri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formSantri)
      });
      const data = await res.json();
      if (res.ok) {
        setSantriList(prev => [data.data, ...prev]);
        setIsAdding(false);
        setFormSantri({ nama_lengkap: '', nis: '', kelas_id: '', jenis_kelamin: 'L' });
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data santri ditambahkan', timer: 1500, showConfirmButton: false });
        
        // Update stats
        setStats(s => ({...s, total: s.total + 1, aktif: s.aktif + 1}));
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.error || 'Gagal menyimpan data' });
      }
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Terjadi kesalahan sistem' });
    }
    setIsSaving(false);
  };
`;

code = code.replace('const [isSaving, setIsSaving] = useState(false);', 'const [isSaving, setIsSaving] = useState(false);\n' + functionBody);
fs.writeFileSync('src/app/(dashboard)/master/santri/page.tsx', code);
