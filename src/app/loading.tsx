export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" aria-label="Memuat" role="status">
      <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
    </div>
  );
}
