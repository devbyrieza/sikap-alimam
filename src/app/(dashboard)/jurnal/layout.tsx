import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getLiveSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function JurnalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getLiveSession();
  const userRoles = (session?.role || "")
    .toLowerCase()
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);

  const allowedRoles = [
    "guru",
    "wali_kelas",
    "admin_rapor",
    "kepala_kurikulum",
    "kadiv_kurikulum",
    "kepala_sekolah",
    "admin_super",
    "mudir",
  ];
  let hasAccess = userRoles.some((role) => allowedRoles.includes(role));

  // Izinkan civitas multi-peran (mis. Kepala Pengasuhan / Admin Keuangan / Musyrif)
  // yang aktif mengampu mapel atau tercatat pada jadwal pelajaran
  if (!hasAccess && session?.userId) {
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
        mata_pelajaran: true,
        _count: {
          select: {
            mengajar: true,
            jadwal: true,
          },
        },
      },
    });
    if (
      pegawai &&
      (Boolean(pegawai.mata_pelajaran?.trim()) ||
        pegawai._count.mengajar > 0 ||
        pegawai._count.jadwal > 0)
    ) {
      hasAccess = true;
    }
  }

  if (!hasAccess) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
