'use client';
import { useState, useEffect, useRef } from 'react';
import { BookOpen, Users, Plus, Trash2, Save, AlertCircle, Upload, Download, FileSpreadsheet } from 'lucide-react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

export default function DistribusiMapelPage() {
  const [asatidz, setAsatidz] = useState<any[]>([]);
  const [kelas, setKelas] = useState<any[]>([]);
  const [mapel, setMapel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedGuru, setSelectedGuru] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/master/distribusi-mapel');
      const data = await res.json();
      if (data.success) {
        setAsatidz(data.asatidz);
        setKelas(data.kelas);
        setMapel(data.mapel);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGuru = (guru: any) => {
    setSelectedGuru(guru);
    setAssignments(guru.mengajar || []);
  };

  const addAssignment = () => {
    setAssignments([...assignments, { kelas_id: '', mapel_id: '' }]);
  };

  const updateAssignment = (index: number, field: string, value: string) => {
    const newArr = [...assignments];
    newArr[index][field] = value;
    setAssignments(newArr);
  };

  const removeAssignment = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedGuru) return;
    
    // Validate
    const invalid = assignments.some(a => !a.kelas_id || !a.mapel_id);
    if (invalid) {
      Swal.fire('Error', 'Semua baris tugas mengajar harus terisi kelas dan mapelnya.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/master/distribusi-mapel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pegawai_id: selectedGuru.id,
          assignments: assignments.map(a => ({ kelas_id: a.kelas_id, mapel_id: a.mapel_id }))
        })
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Tersimpan',
          text: 'Distribusi mengajar berhasil diupdate!',
          timer: 2000,
          showConfirmButton: false
        });
        
        // Update local state
        const newAsatidz = asatidz.map(a => {
          if (a.id === selectedGuru.id) {
            return {
              ...a,
              mengajar: assignments.map(asgn => ({
                kelas_id: asgn.kelas_id,
                mapel_id: asgn.mapel_id,
                kelas: kelas.find(k => k.id === asgn.kelas_id),
                mapel: mapel.find(m => m.id === asgn.mapel_id)
              }))
            };
          }
          return a;
        });
        setAsatidz(newAsatidz);
        setSelectedGuru(null);
      }
    } catch (e) {
      Swal.fire('Error', 'Gagal menyimpan data', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // --- EXCEL IMPORT EXPORT FEATURE ---
  const downloadTemplate = () => {
    const data = [
      { "Nama Guru": "Ade Supiana", "Kelas": "7 MTs", "Mata Pelajaran": "Bahasa Indonesia" },
      { "Nama Guru": "Wahab Rajasam", "Kelas": "IL", "Mata Pelajaran": "Fiqih" },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Auto-size columns
    ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 30 }];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DistribusiMapel");
    XLSX.writeFile(wb, "Template_Distribusi_Mapel.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Swal.fire({
      title: 'Membaca File...',
      text: 'Sedang memproses dokumen Excel.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          Swal.fire('Gagal', 'File Excel kosong atau format tidak sesuai.', 'error');
          return;
        }

        // Send to backend
        const res = await fetch('/api/master/distribusi-mapel/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data })
        });
        const result = await res.json();

        if (result.success) {
          Swal.fire({
            icon: 'success',
            title: 'Berhasil Diimpor!',
            html: `Berhasil menambahkan: <b>${result.results.berhasil}</b> data.<br/>Gagal/Tidak ditemukan: <b>${result.results.gagal}</b> data.<br/><br/><span class="text-xs text-red-500">${result.results.log_gagal.slice(0,5).join('<br/>')}</span>`,
            confirmButtonColor: '#059669'
          }).then(() => {
            window.location.reload();
          });
        } else {
          Swal.fire('Gagal', result.message || 'Terjadi kesalahan saat memproses data.', 'error');
        }
      } catch (err) {
        Swal.fire('Error', 'Gagal membaca file Excel. Pastikan format benar.', 'error');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  if (loading) {
    return <div className="p-8 flex justify-center text-slate-500">Memuat data...</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #7A0000, #4A0000)", color: "white", padding: "32px 36px", borderRadius: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20, boxShadow: "0 10px 25px rgba(0,0,0,0.2)", position: "relative", overflow: "hidden", marginBottom: "32px" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background: "rgba(221,193,146,0.1)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-60, right:120, width:160, height:160, borderRadius:"50%", background: "rgba(221,193,146,0.05)", pointerEvents:"none" }} />
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
            <BookOpen size={32} color="#ddc192" />
            <h1 style={{ margin:0, fontSize:26, fontWeight:800, letterSpacing:"-0.3px" }}>Distribusi Mengajar</h1>
          </div>
          <p style={{ margin:0, color:"rgba(255,255,255,0.82)", fontSize:14, lineHeight:1.6, maxWidth:460 }}>
            Atur beban dan ploting mata pelajaran asatidz (Source of Truth).
          </p>
        </div>
        
        <div style={{ position:"relative", zIndex:1, display:"flex", gap:12, flexWrap:"wrap" }}>
          <button onClick={downloadTemplate} style={{ background:"rgba(255,255,255,0.1)", color:"white", border:"1px solid rgba(255,255,255,0.2)", cursor:"pointer", fontWeight:700, fontSize:14, padding:"12px 22px", borderRadius:14, display:"flex", alignItems:"center", gap:8, backdropFilter:"blur(8px)", transition:"all 0.2s" }}>
            <Download size={18} /> Template Excel
          </button>
          <button onClick={() => fileInputRef.current?.click()} style={{ background:"linear-gradient(135deg, #ddc192, #c6a673)", color:"#4A0000", border:"none", cursor:"pointer", fontWeight:800, fontSize:14, padding:"12px 22px", borderRadius:14, display:"flex", alignItems:"center", gap:8, boxShadow:"0 4px 12px rgba(221,193,146,0.3)", transition:"all 0.2s" }}>
            <Upload size={18} /> Import Massal
          </button>
          <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Teacher List */}
        <div className="lg:col-span-1 bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden flex flex-col h-[700px]">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h2 className="font-bold text-slate-700 flex items-center gap-2">
              <Users size={18} /> Daftar Asatidz
            </h2>
          </div>
          <div className="overflow-y-auto flex-1 p-5 space-y-3 custom-scrollbar">
            {asatidz.map(guru => {
              const active = selectedGuru?.id === guru.id;
              return (
                <div 
                  key={guru.id}
                  onClick={() => handleSelectGuru(guru)}
                  className={`px-5 py-4 rounded-2xl cursor-pointer transition-all border ${active ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-white border-slate-100 hover:border-red-100 hover:bg-red-50/30'}`}
                >
                  <p className="font-bold text-slate-800 text-sm">{guru.nama_lengkap}</p>
                  <p className="text-xs text-slate-500 mt-1">{guru.mengajar?.length || 0} Kelas Diajar</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Col: Editor */}
        <div className="lg:col-span-2">
          {selectedGuru ? (
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
              <div className="mb-6 pb-6 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selectedGuru.nama_lengkap}</h2>
                  <p className="text-sm text-slate-500 mt-1">NIP: {selectedGuru.nip || '-'}</p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-red-700 hover:bg-red-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-red-700/30 transition-all flex items-center gap-2"
                >
                  <Save size={16} /> {isSaving ? 'Menyimpan...' : 'Simpan Tugas'}
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 flex gap-3 text-amber-800">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <p className="text-sm">Data yang diatur di sini akan otomatis disinkronkan menjadi string teks ke SIMPEG untuk kebutuhan HRD.</p>
              </div>

              <div className="space-y-4 mb-6">
                {assignments.map((asgn, i) => (
                  <div key={i} className="flex gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Kelas</label>
                      <select 
                        value={asgn.kelas_id}
                        onChange={(e) => updateAssignment(i, 'kelas_id', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-red-500 focus:ring-red-500/20"
                      >
                        <option value="">-- Pilih Kelas --</option>
                        {kelas.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Mata Pelajaran</label>
                      <select 
                        value={asgn.mapel_id}
                        onChange={(e) => updateAssignment(i, 'mapel_id', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-red-500 focus:ring-red-500/20"
                      >
                        <option value="">-- Pilih Mapel --</option>
                        {mapel.filter(m => asgn.kelas_id ? m.kelas_id === asgn.kelas_id : true).map(m => (
                          <option key={m.id} value={m.id}>{m.nama}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      onClick={() => removeAssignment(i)}
                      className="mt-5 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      title="Hapus"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                
                {assignments.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-medium">
                    Belum ada tugas mengajar.
                  </div>
                )}
              </div>

              <button
                onClick={addAssignment}
                className="w-full py-4 border-2 border-dashed border-red-200 text-red-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
              >
                <Plus size={18} /> Tambah Kelas & Mapel
              </button>

            </div>
          ) : (
            <div className="bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 h-full flex flex-col items-center justify-center text-slate-400 min-h-[400px]">
              <Users size={48} className="mb-4 opacity-50" />
              <p className="font-medium">Pilih asatidz di sebelah kiri untuk mengatur mapel individu</p>
              <p className="text-sm mt-2">Atau gunakan tombol <b className="text-slate-600">Import Massal</b> di atas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
