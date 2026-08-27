const fs = require("fs");
const path = "src/app/(dashboard)/master/distribusi-mapel/page.tsx";
let code = fs.readFileSync(path, "utf-8");

// Replace Header
const headerRegex = /<div className="bg-white\/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-emerald-500\/10 border border-white\/40 flex flex-col md:flex-row justify-between items-center gap-6">[\s\S]*?<\/div>\s*<\/div>/;

const newHeader = `<div style={{ background: "linear-gradient(135deg, #7A0000, #4A0000)", color: "white", padding: "32px 36px", borderRadius: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20, boxShadow: "0 10px 25px rgba(0,0,0,0.2)", position: "relative", overflow: "hidden", marginBottom: "32px" }}>
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
      </div>`;

code = code.replace(headerRegex, newHeader);

// Replace Emerald colors with Al-Imam Red/Maroon theme
code = code.replace(/bg-emerald-50 border-emerald-200/g, 'bg-red-50 border-red-200');
code = code.replace(/hover:border-emerald-100 hover:bg-slate-50/g, 'hover:border-red-100 hover:bg-red-50/50');
code = code.replace(/bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-600\/30/g, 'bg-[#7A0000] hover:bg-[#550000] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-red-900/30');
code = code.replace(/focus:border-emerald-500/g, 'focus:border-[#7A0000] focus:ring-[#7A0000]/20');
code = code.replace(/border-emerald-200 text-emerald-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-50/g, 'border-red-200 text-[#7A0000] rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors');
code = code.replace(/text-emerald-600/g, 'text-[#7A0000]');
code = code.replace(/p-6 md:p-12 max-w-7xl mx-auto space-y-8/g, 'p-6 md:p-8 max-w-[1400px] mx-auto');

fs.writeFileSync(path, code);
console.log("Replaced successfully!");