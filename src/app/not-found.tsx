import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-5xl font-black text-slate-900">404</p>
      <h1 className="text-xl font-bold text-slate-900">Halaman tidak ditemukan</h1>
      <p className="max-w-md text-sm text-slate-600">
        Halaman yang kamu cari tidak tersedia atau sudah dipindahkan.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
      >
        Kembali ke beranda
      </Link>
    </div>
  );
}
