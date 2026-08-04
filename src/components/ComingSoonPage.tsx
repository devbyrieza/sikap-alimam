import React from "react";
import { Hammer } from "lucide-react";

export default function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 items-center justify-center min-h-[70vh]">
      <div className="card flex flex-col items-center justify-center p-12 text-center shadow-md border border-slate-100 max-w-2xl w-full">
        <div style={{ background: "var(--primary-pale)", padding: 24, borderRadius: "50%", marginBottom: 24 }} className="animate-pulse">
          <Hammer size={48} color="var(--primary)" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-4">{title} (Segera Hadir)</h2>
        <p className="text-slate-500 leading-relaxed max-w-lg mx-auto text-lg">
          Halaman ini sedang dalam tahap pengembangan dan penyesuaian khusus. Akses sementara dibatasi hanya untuk <b>Admin Super</b>.
        </p>
      </div>
    </div>
  );
}
