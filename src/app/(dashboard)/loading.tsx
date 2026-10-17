import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="dashboard-loading flex min-h-[70vh] w-full flex-col items-center justify-center px-6 text-center"
    >
      <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary-pale)] shadow-[0_8px_24px_rgba(155,27,34,0.12)]">
        {/* Cincin berputar di sekeliling ikon */}
        <span
          aria-hidden="true"
          className="absolute -inset-1 rounded-[20px] border-2 border-[var(--primary)] border-t-transparent opacity-20 motion-safe:animate-[spin_2s_linear_infinite]"
        />
        <Loader2
          size={28}
          aria-hidden="true"
          className="text-[var(--primary)] motion-safe:animate-spin"
        />
      </div>

      <h3 className="m-0 text-base font-bold text-[var(--primary-dark)]">Memuat Data...</h3>
      <p className="m-0 mt-1 text-[13px] text-[var(--text-muted)]">Mohon tunggu sebentar</p>

      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .dashboard-loading { animation: dashboardLoadingFade 0.3s ease-out; }
        }
        @keyframes dashboardLoadingFade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}