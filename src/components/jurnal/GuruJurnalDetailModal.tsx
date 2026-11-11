"use client";

import {
  AlertCircle,
  BookMarked,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  MessageSquare,
  Phone,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import Swal from "sweetalert2";
import type {
  KepatuhanStatus,
  TeacherMonitoringItem,
} from "@/lib/jurnalMonitoring";

interface GuruJurnalDetailModalProps {
  teacher: TeacherMonitoringItem | null;
  periodLabel: string;
  onClose: () => void;
}

const STATUS_BADGE: Record<
  KepatuhanStatus,
  { label: string; badgeClass: string }
> = {
  lengkap: {
    label: "Lengkap Mengisi",
    badgeClass: "bg-emerald-100 text-emerald-700",
  },
  sebagian: {
    label: "Sebagian Terlewat",
    badgeClass: "bg-amber-100 text-amber-800",
  },
  belum_isi: {
    label: "Belum Mengisi",
    badgeClass: "bg-rose-100 text-rose-700",
  },
  belum_jadwal: {
    label: "Menunggu Jadwal",
    badgeClass: "bg-slate-100 text-slate-700",
  },
};

function formatPhoneWA(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

function buildTeacherReminderText(
  teacher: TeacherMonitoringItem,
  periodLabel: string,
): string {
  const lines: string[] = [
    `Assalamu'alaikum Warahmatullahi Wabarakatuh, Ust. ${teacher.nama_lengkap}.`,
    "",
    `Pemberitahuan evaluasi Kurikulum Pesantren Al-Imam Al-Islami periode *${periodLabel}*.`,
    "",
  ];

  if (teacher.missed_blocks.length > 0) {
    lines.push(
      `Berdasarkan sinkronisasi jadwal KBM dan jurnal SIKAP, terdapat *${teacher.missed_blocks.length} sesi mengajar* yang jurnalnya belum tercatat:`,
    );
    teacher.missed_blocks.forEach((b, idx) => {
      const statusPres =
        b.is_excused && b.presensi_status
          ? ` [${b.presensi_status.toUpperCase()}]`
          : "";
      lines.push(
        `${idx + 1}. *${b.label_tanggal}* | ${b.mapel_nama} (${b.kelas_nama}) | ${b.jam_detail} (${b.waktu_mulai}-${b.waktu_selesai})${statusPres}`,
      );
    });
  } else {
    const mapels = teacher.assigned_mapels
      .map((a) => `${a.mapel_nama} (${a.kelas_nama})`)
      .join(", ");
    lines.push(
      `Pada periode tersebut belum tercatat pengisian jurnal mengajar di SIKAP${mapels ? ` untuk mapel: ${mapels}` : ""}.`,
    );
  }

  lines.push(
    "",
    "Mohon kesediaannya untuk melengkapi jurnal mengajar melalui menu *Jurnal Mengajar* di aplikasi SIKAP.",
    "Jazakumullahu khairan katsiran.",
  );

  return lines.join("\n");
}

export default function GuruJurnalDetailModal({
  teacher,
  periodLabel,
  onClose,
}: GuruJurnalDetailModalProps) {
  useEffect(() => {
    if (!teacher) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow || "unset";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [teacher, onClose]);

  if (!teacher) return null;

  const badge = STATUS_BADGE[teacher.status_kepatuhan];

  const handleCopyReminder = async () => {
    const msg = buildTeacherReminderText(teacher, periodLabel);
    try {
      await navigator.clipboard.writeText(msg);
      Swal.fire({
        icon: "success",
        title: "Pesan Pengingat Disalin",
        text: "Teks pengingat lengkap beserta rincian tanggal, mapel, dan jam siap ditempel ke WhatsApp.",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({
        icon: "error",
        title: "Gagal Menyalin",
        text: "Browser menolak akses clipboard.",
        confirmButtonColor: "#550000",
      });
    }
  };

  const handleSendWA = async () => {
    const msg = buildTeacherReminderText(teacher, periodLabel);
    const phone = teacher.no_hp ? formatPhoneWA(teacher.no_hp) : "";
    if (!phone) {
      const res = await Swal.fire({
        icon: "info",
        title: "Nomor WhatsApp Belum Terdaftar",
        text: `Nomor HP ${teacher.nama_lengkap} belum diisi di profil kepegawaian. Salin pesan pengingat ke clipboard saja?`,
        showCancelButton: true,
        confirmButtonColor: "#550000",
        cancelButtonColor: "#64748b",
        confirmButtonText: "Salin Pesan Pengingat",
        cancelButtonText: "Tutup",
      });
      if (res.isConfirmed) {
        await handleCopyReminder();
      }
      return;
    }
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div
      data-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overscroll-contain"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Tutup modal detail guru"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/55"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Detail Jurnal ${teacher.nama_lengkap}`}
        className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[16px] border border-[#e7e2da] bg-white shadow-[0_12px_28px_-6px_rgba(0,0,0,0.12)]"
      >
        {/* Modal Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#f0ece4] bg-[#fcfaf8] px-5 py-4">
          <div className="flex min-w-0 items-center gap-3.5">
            {teacher.foto_url ? (
              <img
                src={teacher.foto_url}
                alt={teacher.nama_lengkap}
                className="h-12 w-12 shrink-0 rounded-full border border-[#e7e2da] object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#e7e2da] bg-[#fdf5f5] text-base font-bold text-[#550000]">
                {teacher.nama_lengkap.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-bold text-[#1a1a1a]">
                  {teacher.nama_lengkap}
                </h2>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.badgeClass}`}
                >
                  {badge.label}
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#44403c]">
                <span className="inline-flex items-center gap-1">
                  <User size={12} /> {teacher.jabatan || "Guru Mapel"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar size={12} /> Periode: {periodLabel}
                </span>
                {teacher.no_hp && (
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Phone size={12} /> {teacher.no_hp}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal detail guru"
            className="shrink-0 cursor-pointer rounded-[10px] border border-[#e7e2da] bg-white p-2 text-[#44403c] transition-colors duration-150 hover:bg-[#f6f1e8]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto overscroll-contain p-5">
          {/* KPI Pills */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-[12px] border border-[#e7e2da] bg-[#fcfaf8] p-3.5">
              <div className="text-xs font-medium text-[#44403c]">
                Kepatuhan Jadwal
              </div>
              <div className="mt-1 text-xl font-bold tabular-nums text-[#550000]">
                {teacher.persen_kepatuhan_jadwal !== null
                  ? `${teacher.persen_kepatuhan_jadwal}%`
                  : teacher.sudah_mengisi
                    ? "100%"
                    : "0%"}
              </div>
              <div className="mt-0.5 text-[11px] tabular-nums text-[#78716c]">
                {teacher.has_schedule
                  ? `${teacher.covered_sessions_elapsed}/${teacher.expected_sessions_elapsed} sesi selesai`
                  : `${teacher.covered_mapels_count}/${teacher.assigned_mapels_count} mapel terisi`}
              </div>
            </div>

            <div className="rounded-[12px] border border-[#e7e2da] bg-[#fcfaf8] p-3.5">
              <div className="text-xs font-medium text-[#44403c]">
                Jurnal Terisi
              </div>
              <div className="mt-1 text-xl font-bold tabular-nums text-emerald-700">
                {teacher.total_jurnal}
              </div>
              <div className="mt-0.5 text-[11px] text-[#78716c]">
                {teacher.last_jurnal_tanggal
                  ? `Terakhir: ${teacher.last_jurnal_tanggal}`
                  : "Belum pernah mengisi"}
              </div>
            </div>

            <div className="rounded-[12px] border border-[#e7e2da] bg-[#fcfaf8] p-3.5">
              <div className="text-xs font-medium text-[#44403c]">
                Sesi Tidak Diisi
              </div>
              <div className="mt-1 text-xl font-bold tabular-nums text-rose-700">
                {teacher.missed_sessions_elapsed}
              </div>
              <div className="mt-0.5 text-[11px] tabular-nums text-[#78716c]">
                {teacher.missed_unexcused_sessions} tanpa keterangan ·{" "}
                {teacher.missed_excused_sessions} sakit/izin
              </div>
            </div>

            <div className="rounded-[12px] border border-[#e7e2da] bg-[#fcfaf8] p-3.5">
              <div className="text-xs font-medium text-[#44403c]">
                Rekap Presensi
              </div>
              <div className="mt-1 text-sm font-bold tabular-nums text-[#1a1a1a]">
                H: {teacher.presensi_hadir} · I/S: {teacher.presensi_sakit_izin}{" "}
                · A: {teacher.presensi_alpha}
              </div>
              <div className="mt-1 text-[11px] text-[#78716c]">
                {teacher.expected_jp_elapsed} total JP terjadwal
              </div>
            </div>
          </div>

          {/* Rincian Jadwal Belum Diisi Jurnal */}
          <div className="overflow-hidden rounded-[12px] border border-[#e7e2da] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0ece4] bg-[#faf6ee] px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1a1a1a]">
                <AlertCircle size={16} className="text-rose-600" />
                Jadwal Mengajar Belum Diisi Jurnal (
                {teacher.missed_blocks.length})
              </div>
              <Link
                href={`/jurnal/tambah?pegawai_id=${encodeURIComponent(teacher.pegawai_id)}`}
                className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#e7e2da] bg-white px-2.5 py-1 text-xs font-semibold text-[#550000] hover:bg-[#fdf5f5]"
              >
                <BookMarked size={12} /> Input Jurnal Baru
              </Link>
            </div>

            {teacher.missed_blocks.length === 0 ? (
              <div className="flex items-center gap-2.5 px-4 py-6 text-sm text-[#44403c]">
                <CheckCircle2
                  size={18}
                  className={
                    teacher.sudah_mengisi
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }
                />
                <span>
                  {teacher.has_schedule
                    ? "Semua sesi terjadwal yang sudah berjalan telah memiliki jurnal mengajar."
                    : teacher.sudah_mengisi
                      ? "Guru telah mengisi jurnal pada periode ini (dievaluasi berbasis penugasan mapel)."
                      : "Guru belum memiliki slot di Jadwal Pelajaran maupun jurnal pada periode ini."}
                </span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-[#e7e2da] bg-[#fcfaf8] text-[#1a1a1a]">
                      <th className="px-3.5 py-2.5 font-semibold">
                        Hari &amp; Tanggal
                      </th>
                      <th className="px-3.5 py-2.5 font-semibold">Kelas</th>
                      <th className="px-3.5 py-2.5 font-semibold">
                        Mata Pelajaran
                      </th>
                      <th className="px-3.5 py-2.5 font-semibold">
                        Jam ke- &amp; Waktu
                      </th>
                      <th className="px-3.5 py-2.5 font-semibold">Presensi</th>
                      <th className="px-3.5 py-2.5 text-right font-semibold">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacher.missed_blocks.map((blk) => {
                      const fillUrl = `/jurnal/tambah?pegawai_id=${encodeURIComponent(
                        teacher.pegawai_id,
                      )}&kelas_id=${encodeURIComponent(
                        blk.kelas_id,
                      )}&kelas_nama=${encodeURIComponent(
                        blk.kelas_nama,
                      )}&mapel_id=${encodeURIComponent(
                        blk.mapel_id,
                      )}&mapel_nama=${encodeURIComponent(
                        blk.mapel_nama,
                      )}&tanggal=${encodeURIComponent(
                        blk.tanggal,
                      )}&jam_ke=${encodeURIComponent(blk.jam_list.join(","))}`;

                      return (
                        <tr
                          key={blk.block_id}
                          className="border-b border-[#f0ece4] hover:bg-[#faf6ee]"
                        >
                          <td className="px-3.5 py-2.5 whitespace-nowrap font-semibold text-[#1a1a1a]">
                            {blk.label_tanggal}
                          </td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            <span className="rounded-[8px] border border-[#e7e2da] bg-[#fdf5f5] px-2 py-0.5 text-[11px] font-semibold text-[#550000]">
                              {blk.kelas_nama}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 font-medium text-[#1a1a1a]">
                            {blk.mapel_nama}
                          </td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap tabular-nums text-[#44403c]">
                            <div className="font-semibold text-[#1a1a1a]">
                              {blk.jam_detail}
                            </div>
                            <div className="text-[11px] text-[#78716c]">
                              {blk.waktu_mulai}–{blk.waktu_selesai} WIB
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            {blk.is_excused ? (
                              <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-amber-800">
                                {blk.presensi_status}
                              </span>
                            ) : blk.presensi_status === "hadir" ||
                              blk.presensi_status === "telat" ? (
                              <span className="inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                                Hadir (Belum Isi)
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                {blk.presensi_status
                                  ? blk.presensi_status
                                  : "Tanpa Keterangan"}
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                            <Link
                              href={fillUrl}
                              className="inline-flex items-center gap-1 rounded-[8px] bg-[#550000] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#380000]"
                            >
                              <BookMarked size={11} /> Isi Jurnal
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Mapel Diampu */}
          <div className="rounded-[12px] border border-[#e7e2da] bg-white p-4">
            <div className="mb-2.5 text-xs font-semibold text-[#44403c]">
              Daftar Penugasan Mapel ({teacher.assigned_mapels.length})
            </div>
            {teacher.assigned_mapels.length === 0 ? (
              <div className="text-xs text-[#78716c]">
                Belum ada plot mata pelajaran pada profil pegawai atau jadwal
                KBM.
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {teacher.assigned_mapels.map((am) => {
                  const isCovered = teacher.jurnal_list.some(
                    (j) =>
                      j.jenjang === am.jenjang &&
                      j.kelas_nama.toUpperCase() ===
                        am.kelas_nama.toUpperCase(),
                  );
                  return (
                    <span
                      key={`${am.jenjang}-${am.kelas_nama}-${am.standard_mapel}`}
                      className={`inline-flex items-center gap-1.5 rounded-[8px] border px-2.5 py-1 text-xs font-medium ${
                        isCovered
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-[#e7e2da] bg-[#fcfaf8] text-[#44403c]"
                      }`}
                    >
                      <span className="font-semibold">{am.kelas_nama}</span>
                      <span>·</span>
                      <span>{am.mapel_nama}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Timeline Harian */}
          <div className="rounded-[12px] border border-[#e7e2da] bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1a1a1a]">
              <Clock size={15} className="text-[#550000]" />
              Timeline Kepatuhan Harian
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {teacher.days.map((d) => {
                const statusInfo: Record<
                  typeof d.day_status,
                  { label: string; cls: string }
                > = {
                  terisi: {
                    label: "Terisi Lengkap",
                    cls: "bg-emerald-100 text-emerald-700",
                  },
                  parsial: {
                    label: "Terisi Sebagian",
                    cls: "bg-amber-100 text-amber-800",
                  },
                  bolong: {
                    label: "Tidak Mengisi",
                    cls: "bg-rose-100 text-rose-700",
                  },
                  izin_sakit: {
                    label: "Sakit / Izin",
                    cls: "bg-amber-50 text-amber-700",
                  },
                  menunggu: {
                    label: "Jadwal Mendatang",
                    cls: "bg-slate-100 text-slate-600",
                  },
                  libur: {
                    label: d.libur_nama || "Libur",
                    cls: "bg-slate-100 text-slate-500",
                  },
                  tanpa_jadwal: {
                    label: "Tanpa Jadwal",
                    cls: "bg-slate-50 text-slate-500",
                  },
                };
                const st = statusInfo[d.day_status];
                return (
                  <div
                    key={d.tanggal}
                    className="rounded-[10px] border border-[#f0ece4] bg-[#fcfaf8] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#1a1a1a]">
                        {d.hari_singkat}, {d.label_tanggal}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${st.cls}`}
                      >
                        {st.label}
                      </span>
                    </div>
                    <div className="mt-1.5 text-[11px] tabular-nums text-[#44403c]">
                      Jadwal: {d.scheduled_blocks.length} sesi · Jurnal:{" "}
                      {d.jurnal_entries.length} entri
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daftar Jurnal Sudah Diisi */}
          <div className="overflow-hidden rounded-[12px] border border-[#e7e2da] bg-white">
            <div className="border-b border-[#f0ece4] bg-[#faf6ee] px-4 py-3 text-sm font-semibold text-[#1a1a1a]">
              Daftar Jurnal Sudah Diisi ({teacher.jurnal_list.length})
            </div>
            {teacher.jurnal_list.length === 0 ? (
              <div className="px-4 py-6 text-xs text-[#78716c]">
                Belum ada entri jurnal yang tercatat pada rentang tanggal ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-[#e7e2da] bg-[#fcfaf8] text-[#1a1a1a]">
                      <th className="px-3.5 py-2.5 font-semibold">Tanggal</th>
                      <th className="px-3.5 py-2.5 font-semibold">Kelas</th>
                      <th className="px-3.5 py-2.5 font-semibold">Mapel</th>
                      <th className="px-3.5 py-2.5 font-semibold">Jam ke-</th>
                      <th className="px-3.5 py-2.5 font-semibold">Materi</th>
                      <th className="px-3.5 py-2.5 text-right font-semibold">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacher.jurnal_list.map((j) => (
                      <tr
                        key={j.id}
                        className="border-b border-[#f0ece4] hover:bg-[#faf6ee]"
                      >
                        <td className="px-3.5 py-2.5 whitespace-nowrap tabular-nums font-medium text-[#1a1a1a]">
                          {j.tanggal}
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          {j.kelas_nama}
                        </td>
                        <td className="px-3.5 py-2.5 font-medium text-[#1a1a1a]">
                          {j.mapel_nama}
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap tabular-nums text-[#44403c]">
                          {j.jam_ke}
                        </td>
                        <td className="max-w-[240px] truncate px-3.5 py-2.5 text-[#44403c]">
                          {j.materi}
                        </td>
                        <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                          <Link
                            href={`/jurnal/edit/${encodeURIComponent(j.id)}`}
                            className="inline-flex items-center gap-1 rounded-[8px] border border-[#e7e2da] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1a1a1a] hover:bg-[#f6f1e8]"
                          >
                            <Edit3 size={11} /> Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2.5 border-t border-[#f0ece4] bg-[#fcfaf8] px-5 py-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSendWA}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-emerald-800"
            >
              <MessageSquare size={14} /> Kirim Pengingat WA
            </button>
            <button
              type="button"
              onClick={handleCopyReminder}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-[#e7e2da] bg-white px-3.5 py-2 text-xs font-semibold text-[#1a1a1a] hover:bg-[#f6f1e8]"
            >
              <Copy size={14} /> Salin Teks Teguran
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-[10px] bg-[#550000] px-4 py-2 text-xs font-semibold text-white hover:bg-[#380000]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
