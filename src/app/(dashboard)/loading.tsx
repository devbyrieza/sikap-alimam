import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        minHeight: "70vh",
        width: "100%",
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "var(--primary-pale)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          boxShadow: "0 8px 24px rgba(155, 27, 34, 0.12)",
          position: "relative",
        }}
      >
        <div 
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: 20,
            border: "2px solid var(--primary)",
            opacity: 0.2,
            borderTopColor: "transparent",
            animation: "spin 2s linear infinite",
          }}
        />
        <Loader2 size={28} color="var(--primary)" style={{ animation: "spin 1s linear infinite" }} />
      </div>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--primary-dark)" }}>
        Memuat Data...
      </h3>
      <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
        Mohon tunggu sebentar
      </p>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
