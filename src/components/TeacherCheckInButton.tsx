"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";

export default function TeacherCheckInButton({
  pegawaiId,
  className = "",
  label = "Check-In Hadir Mengajar",
  onSuccess,
}: {
  pegawaiId?: string | null;
  className?: string;
  label?: string;
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/presensi/asatidz/self", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal melakukan check-in");
      }

      await Swal.fire({
        icon: "success",
        title: "Check-In Berhasil!",
        text: data.message || "Kehadiran mengajar Anda hari ini telah tercatat resmi di sistem.",
        confirmButtonColor: "#550000",
        confirmButtonText: "Lanjut ke Jadwal Mengajar",
      });

      if (onSuccess) {
        onSuccess();
      }
      router.refresh();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal Check-In",
        text: err.message || "Terjadi kesalahan saat check-in.",
        confirmButtonColor: "#550000",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCheckIn}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-800 to-[#550000] hover:from-red-900 hover:to-[#440000] text-white font-extrabold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${className}`}
    >
      {loading ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          <span>Memproses...</span>
        </>
      ) : (
        <>
          <Sparkles size={14} className="text-amber-300" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
