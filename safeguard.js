const fs = require("fs");
const path = "src/app/(dashboard)/halaqoh/input/page.tsx";
let code = fs.readFileSync(path, "utf-8");

const checkStr = if (loading) {;
const fallbackStr = 
  if (!kelompokId) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-slate-500">
        <AlertCircle size={48} className="text-red-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-700 mb-2">Parameter Tidak Lengkap</h2>
        <p className="text-sm mb-6 max-w-md text-center">Anda harus memilih kelompok dan sesi halaqoh terlebih dahulu melalui Dashboard Halaqoh sebelum mengisi catatan.</p>
        <Link href="/halaqoh" className="bg-[#550000] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#751414] transition-all flex items-center gap-2">
          <ArrowLeft size={16} /> Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  if (loading) {;

if (!code.includes("if (!kelompokId)")) {
    code = code.replace(checkStr, fallbackStr);
    fs.writeFileSync(path, code);
    console.log("Safeguard added");
} else {
    console.log("Safeguard already exists");
}