import { ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import JurnalMonitoringClient from "@/components/jurnal/JurnalMonitoringClient";
import { getLiveSession } from "@/lib/auth";
import {
  getJurnalMonitoringReport,
  type TipePekanFilter,
} from "@/lib/jurnalMonitoring";
import { getJenjangFromKelas } from "@/lib/kelas";
import { getLaporanNilaiAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pantau Jurnal Guru Mapel — SIKAP Al-Imam",
  description:
    "Monitoring kepatuhan pengisian jurnal mengajar guru mapel untuk rapat evaluasi Kepala Kurikulum",
};

interface PageProps {
  searchParams?: Promise<{
    start_date?: string;
    end_date?: string;
    jenjang?: string;
    kelas_id?: string;
    tipe_pekan?: string;
    include_unassigned?: string;
  }>;
}

export default async function JurnalMonitoringPage({
  searchParams,
}: PageProps) {
  const session = await getLiveSession();
  if (!session) {
    redirect("/login");
  }

  const pegawai = await prisma.pegawai.findFirst({
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
  });

  const access = getLaporanNilaiAccess({
    user: {
      id: session.userId,
      nama: session.nama,
      email: session.email,
      role: session.role,
    },
    pegawai,
  });

  if (!access.canAccess) {
    return (
      <div className="mx-auto max-w-xl p-4 md:p-8">
        <div className="rounded-[12px] border border-[#e7e2da] bg-white p-6 text-center shadow-xs md:p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-700">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-xl font-bold tracking-[-0.02em] text-[#1a1a1a]">
            Akses Terbatas: Pantau Jurnal Guru Mapel
          </h1>
          <p className="mt-2 text-sm text-[#44403c]">
            Halaman monitoring kepatuhan pengisian jurnal untuk evaluasi rapat
            kurikulum hanya tersedia bagi:
          </p>
          <div className="mt-4 rounded-[10px] border border-[#e7e2da] bg-[#faf6ee] p-4 text-left text-xs text-[#44403c]">
            <ul className="list-disc space-y-1.5 pl-4">
              <li>
                <strong className="text-[#1a1a1a]">
                  Admin Super / Mudir / Kepala Sekolah
                </strong>
              </li>
              <li>
                <strong className="text-[#1a1a1a]">Kepala Kurikulum</strong>{" "}
                (semua jenjang)
              </li>
              <li>
                <strong className="text-[#1a1a1a]">Wali Kelas</strong> (MTs,
                I&apos;dad Lughowy, atau MA sesuai amanah)
              </li>
            </ul>
          </div>
          <Link
            href="/jurnal"
            className="mt-6 inline-flex items-center gap-2 rounded-[10px] bg-[#550000] px-5 py-2.5 text-xs font-semibold text-white transition-colors duration-150 hover:bg-[#380000]"
          >
            <ArrowLeft size={15} /> Kembali ke Daftar Jurnal Mengajar
          </Link>
        </div>
      </div>
    );
  }

  const sp = (await searchParams) || {};
  const rawJenjang = sp.jenjang || "ALL";
  const rawKelas = sp.kelas_id || "ALL";
  const rawTipePekan = sp.tipe_pekan || "otomatis";
  const includeUnassigned =
    sp.include_unassigned === "true" || sp.include_unassigned === "1";

  const validTipePekan: TipePekanFilter =
    rawTipePekan === "semua" ||
    rawTipePekan === "ganjil" ||
    rawTipePekan === "genap" ||
    rawTipePekan === "otomatis"
      ? rawTipePekan
      : "otomatis";

  let effectiveJenjang = rawJenjang;
  let effectiveKelas = rawKelas;

  if (access.allowedJenjang !== "ALL") {
    if (!access.allowedJenjang.includes(rawJenjang as "MTs" | "IL" | "MA")) {
      effectiveJenjang = access.allowedJenjang[0] || "ALL";
    }
    if (effectiveKelas !== "ALL") {
      const kRow = await prisma.kelas.findUnique({
        where: { id: effectiveKelas },
        select: { nama: true, jenjang: true },
      });
      const kJenjang = kRow
        ? getJenjangFromKelas(kRow.nama, kRow.jenjang)
        : null;
      if (!kJenjang || !access.allowedJenjang.includes(kJenjang)) {
        effectiveKelas = "ALL";
      }
    }
  }

  const report = await getJurnalMonitoringReport({
    startDate: sp.start_date || null,
    endDate: sp.end_date || null,
    jenjangFilter: effectiveJenjang,
    kelasFilter: effectiveKelas,
    tipePekan: validTipePekan,
    includeUnassigned,
  });

  if (access.allowedJenjang !== "ALL") {
    const allowedSet = new Set(access.allowedJenjang);
    report.filter_options = {
      kelas: report.filter_options.kelas.filter((k) =>
        allowedSet.has(k.jenjang),
      ),
      jenjang: report.filter_options.jenjang.filter((j) => allowedSet.has(j)),
    };
  }

  return <JurnalMonitoringClient initialReport={report} access={access} />;
}
