import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BookOpen, CalendarDays, ClipboardList, Plus } from "lucide-react";
import JurnalClientFilter from "./JurnalClientFilter";
import { sortKelas } from "@/lib/kelas";
import { getLiveSession } from "@/lib/auth";
import { getLaporanNilaiAccess } from "@/lib/permissions";
import { normalizeClassLabel } from "@/lib/jurnalMonitoring";

export const dynamic = "force-dynamic";

const formatName = (str: string) => {
  if (!str) return "-";
  return str
    .split(" ")
    .map((word) => {
      if (word.includes(".")) return word;
      if (word === word.toUpperCase() || word === word.toLowerCase()) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word;
    })
    .join(" ");
};

const normalizeMapelName = (name: string) => {
  let normalized = name.replace(/^\[.*?\]\s*/, "");
  if (normalized === "Tahsin/Tahfidz Al-Quran") {
    normalized = "Tahsin Al-Qur'an";
  }
  return normalized;
};

export const metadata = {
  title: "Jurnal Mengajar — SIKAP Al-Imam",
  description: "Daftar jurnal mengajar guru Pesantren Al-Imam Al-Islami",
};

async function getJurnal() {
  return prisma.jurnalMengajar.findMany({
    orderBy: [{ tanggal: "desc" }, { created_at: "desc" }],
    include: {
      pegawai: { select: { id: true, nama_lengkap: true } },
      mapel: { select: { id: true, nama: true } },
      kelas: { select: { id: true, nama: true, jenjang: true } },
    },
  });
}

export default async function JurnalPage() {
  const session = await getLiveSession();
  const roleStr = (session?.role || "").toLowerCase();
  const isAdminSuper =
    roleStr.includes("admin_super") || roleStr.includes("mudir");

  const pegawai = session?.userId
    ? await prisma.pegawai.findFirst({
        where: {
          OR: [
            ...(session.asatidz_id ? [{ id: session.asatidz_id }] : []),
            { user_id: session.userId },
            ...(session.email ? [{ email: session.email }] : []),
          ],
        },
        select: {
          id: true,
          nama_lengkap: true,
          jabatan: true,
          kategori_pegawai: true,
        },
      })
    : null;

  const access = getLaporanNilaiAccess({
    user: session
      ? {
          id: session.userId,
          nama: session.nama,
          email: session.email,
          role: session.role,
        }
      : null,
    pegawai,
  });

  // 1. Fetch Jurnal
  const jurnal = await getJurnal();
  const kelasWithJurnalIds = new Set(jurnal.map((j) => j.kelas_id));

  // 2. Fetch Kelas Aktif (tetap tampilkan kelas berjalan seperti 7 MTs, IL, 11 MA, 12 MA yang memiliki santri/jurnal)
  const rawKelas = await prisma.kelas.findMany({
    where: { is_active: true },
    select: {
      id: true,
      nama: true,
      jenjang: true,
      _count: { select: { santri: true, jurnal: true } },
    },
  });

  const seenKelas = new Set<string>();
  const normalizedKelasList: {
    id: string;
    nama: string;
    jenjang: string | null;
  }[] = [];

  for (const k of rawKelas) {
    const { kelasNama, jenjang } = normalizeClassLabel(k.nama, k.jenjang);
    const hasActivity =
      kelasNama === "7 MTs" ||
      kelasNama === "IL" ||
      k._count.santri > 0 ||
      k._count.jurnal > 0 ||
      kelasWithJurnalIds.has(k.id);
    if (!hasActivity) continue;

    if (!seenKelas.has(kelasNama)) {
      seenKelas.add(kelasNama);
      normalizedKelasList.push({ id: k.id, nama: kelasNama, jenjang });
    }
  }

  if (!seenKelas.has("7 MTs")) {
    normalizedKelasList.push({
      id: "kelas-7-mts",
      nama: "7 MTs",
      jenjang: "MTs",
    });
  }
  if (!seenKelas.has("IL")) {
    normalizedKelasList.push({ id: "kelas-il", nama: "IL", jenjang: "IL" });
  }

  const kelasList = sortKelas(normalizedKelasList);

  // 3. Fetch Data Guru
  let asatidzData = await prisma.pegawai.findMany({
    where: {
      OR: [
        {
          kategori_pegawai: {
            in: ["ASATIDZ", "GURU", "Guru", "asatidz", "guru", "PENGAJAR"],
          },
        },
        { kategori_pegawai: { contains: "ASATIDZ", mode: "insensitive" } },
        { kategori_pegawai: { contains: "GURU", mode: "insensitive" } },
        { jabatan: { contains: "Guru", mode: "insensitive" } },
        { jabatan: { contains: "Pengajar", mode: "insensitive" } },
        { jabatan: { contains: "Asatidz", mode: "insensitive" } },
        { jabatan: { contains: "Ustadz", mode: "insensitive" } },
        { mata_pelajaran: { not: null } },
      ],
    },
    select: { id: true, nama_lengkap: true },
    orderBy: { nama_lengkap: "asc" },
  });

  if (asatidzData.length === 0) {
    asatidzData = await prisma.pegawai.findMany({
      select: { id: true, nama_lengkap: true },
      orderBy: { nama_lengkap: "asc" },
    });
  }

  const asatidzSet = new Set<string>();
  for (const a of asatidzData) {
    if (a.nama_lengkap) asatidzSet.add(formatName(a.nama_lengkap.trim()));
  }
  for (const j of jurnal) {
    if (j.pegawai?.nama_lengkap) {
      asatidzSet.add(formatName(j.pegawai.nama_lengkap.trim()));
    }
  }
  const asatidzList = Array.from(asatidzSet).sort((a, b) =>
    a.localeCompare(b, "id"),
  );

  // 4. Serialize Jurnal dengan label kelas kanonik agar filter kelas & jenjang selalu sinkron
  const jurnalSerialized = jurnal.map((j) => {
    const { kelasNama, jenjang } = normalizeClassLabel(
      j.kelas?.nama || "-",
      j.kelas?.jenjang,
    );

    return {
      id: j.id,
      tanggal: j.tanggal.toISOString().split("T")[0],
      asatidz: j.pegawai?.nama_lengkap
        ? formatName(j.pegawai.nama_lengkap.trim())
        : "-",
      mapel: j.mapel?.nama ? normalizeMapelName(j.mapel.nama) : "-",
      kelas: kelasNama,
      kelas_jenjang: jenjang,
      jam_ke: j.jam_ke ?? "-",
      materi: j.materi,
      learning_outcome: j.learning_outcome ?? "",
      kegiatan: j.kegiatan,
      catatan: j.catatan ?? "",
    };
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 md:p-6">
      {/* Header Panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[12px] border border-[#e7e2da] bg-[#550000] p-5 text-white shadow-xs md:p-6">
        <div className="min-w-0 flex-1">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#ddc192]/40 bg-[#ddc192]/15 px-3 py-1 text-[11px] font-semibold text-[#fdf8f0]">
            <span className="h-2 w-2 rounded-full bg-[#ddc192]" />
            Modul Akademik &amp; Pengajaran
          </div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-[-0.02em] text-white md:text-3xl">
            <BookOpen size={26} className="text-[#ddc192]" /> Jurnal Mengajar
          </h1>
          <p className="mt-1 text-sm text-[#fdf8f0]/85">
            Rekap agenda belajar mengajar guru &amp; asatidz Pesantren Al-Imam Al-Islami
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {access.canAccess && (
            <Link
              href="/jurnal/monitoring"
              className="inline-flex items-center gap-2 rounded-[10px] border border-[#ddc192]/50 bg-[#380000] px-4 py-2.5 text-xs font-semibold text-[#fdf8f0] transition-colors duration-150 hover:bg-[#2a0000]"
            >
              <ClipboardList size={16} className="text-[#ddc192]" />
              Pantau Jurnal Guru
            </Link>
          )}
          <Link
            href="/guru/jadwal"
            className="inline-flex items-center gap-2 rounded-[10px] border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition-colors duration-150 hover:bg-white/20"
          >
            <CalendarDays size={16} />
            Jadwal Mengajar
          </Link>
          <Link
            href="/jurnal/tambah"
            className="inline-flex items-center gap-2 rounded-[10px] border border-[#ddc192] bg-white px-4 py-2.5 text-xs font-bold text-[#550000] transition-colors duration-150 hover:bg-[#fcfaf8]"
          >
            <Plus size={16} />
            Tambah Jurnal
          </Link>
        </div>
      </div>

      {/* Content */}
      <JurnalClientFilter
        data={jurnalSerialized}
        kelasList={kelasList}
        asatidzList={asatidzList}
        isAdminSuper={isAdminSuper}
      />
    </div>
  );
}
