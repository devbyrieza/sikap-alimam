"use client";

export default function Error({
  error,
  reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Terjadi kesalahan</h1>
      <p className="max-w-md text-sm text-slate-600">
        Maaf, ada gangguan saat memuat halaman ini. Silakan coba lagi.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
      >
        Coba lagi
      </button>
    </div>
  );
}
