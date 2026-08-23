"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock } from "lucide-react";

export default function RealtimeClock() {
  const [timeState, setTimeState] = useState<{ tanggal: string; jam: string } | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      const tanggal = now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Jakarta" });

      const jam = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Jakarta" }).replace(/:/g, ".");

      setTimeState({ tanggal, jam });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!timeState) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: "rgba(253, 248, 240, 0.85)", fontSize: 13, flexWrap: "wrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Calendar size={14} color="#ddc192" /> Memuat tanggal...
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Clock size={14} color="#ddc192" /> Memuat jam...
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, color: "rgba(253, 248, 240, 0.85)", fontSize: 13, flexWrap: "wrap" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Calendar size={14} color="#ddc192" /> {timeState.tanggal}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Clock size={14} color="#ddc192" /> {timeState.jam} WIB
      </span>
    </div>
  );
}
