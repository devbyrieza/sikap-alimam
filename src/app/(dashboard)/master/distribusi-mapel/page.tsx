'use client';
import { useState, useEffect } from 'react';
import { BookOpen, Users, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

export default function DistribusiMapelPage() {
  const [asatidz, setAsatidz] = useState<any[]>([]);
  const [kelas, setKelas] = useState<any[]>([]);
  const [mapel, setMapel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedGuru, setSelectedGuru] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

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

  if (loading) {
    return <div className="p-8 flex justify-center text-slate-500">Memuat data...</div>;
  }

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-emerald-500/10 border border-white/40 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <BookOpen className="text-emerald-600" size={36} /> Distribusi Mengajar
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Atur beban dan ploting mata pelajaran asatidz (Source of Truth).</p>
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
          <div className="overflow-y-auto flex-1 p-3 space-y-2 custom-scrollbar">
            {asatidz.map(guru => {
              const active = selectedGuru?.id === guru.id;
              return (
                <div 
                  key={guru.id}
                  onClick={() => handleSelectGuru(guru)}
                  className={\p-4 rounded-2xl cursor-pointer transition-all border \\}
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
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
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-emerald-500"
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
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-emerald-500"
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
                className="w-full py-4 border-2 border-dashed border-emerald-200 text-emerald-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors"
              >
                <Plus size={18} /> Tambah Kelas & Mapel
              </button>

            </div>
          ) : (
            <div className="bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 h-full flex flex-col items-center justify-center text-slate-400 min-h-[400px]">
              <Users size={48} className="mb-4 opacity-50" />
              <p className="font-medium">Pilih asatidz di sebelah kiri untuk mengatur mapel</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
