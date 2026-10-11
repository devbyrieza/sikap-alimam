import { prisma } from "@/lib/prisma";
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let santri = null;
  let error = null;

  try {
    santri = await prisma.santriAktif.findFirst({
      where: {
        OR: [
          { id },
          { nis: id }
        ]
      },
      include: {
        kelas: true,
      }
    });
  } catch (err: any) {
    error = err.message;
  }

  if (!santri || error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border-t-8 border-red-500">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle size={40} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">Dokumen Tidak Ditemukan</h1>
          <p className="text-slate-600 mb-6">
            Maaf, dokumen rapor atau data santri dengan ID tersebut tidak terdaftar di pangkalan data resmi Pesantren Al-Imam.
          </p>
          <div className="p-4 bg-slate-100 rounded-xl text-xs text-slate-500 font-mono break-all">
            ID: {id}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border-t-8 border-emerald-500 relative overflow-hidden">
        
        {/* Watermark Logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
          <ShieldCheck size={200} />
        </div>

        <div className="relative z-10">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-emerald-50">
            <CheckCircle2 size={40} />
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-slate-800 mb-1">Dokumen Resmi</h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
              <ShieldCheck size={14} /> Terverifikasi Digital
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Nama Santri</p>
              <p className="font-bold text-slate-800 text-lg">{santri.nama_lengkap}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">NIS</p>
                <p className="font-bold text-slate-800">{santri.nis}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Kelas</p>
                <p className="font-bold text-slate-800">{santri.kelas?.nama || "-"}</p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
              <AlertTriangle className="text-blue-500 shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-blue-800 leading-relaxed">
                Dokumen rapor fisik yang Anda pegang adalah sah dan otentik diterbitkan oleh <strong>Pesantren Al-Imam Al-Islami (Managed by Al-Andalus International Islamic Boarding School)</strong> apabila data di atas sesuai dengan fisik dokumen.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-[10px] text-slate-400 font-medium">Timestamp Verifikasi:</p>
            <p className="text-xs text-slate-500 font-mono mt-1">{new Date().toLocaleString('id-ID')} WIB</p>
          </div>
        </div>
      </div>
    </div>
  );
}
