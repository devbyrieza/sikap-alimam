import { prisma } from "@/lib/prisma";
import { cekStatusSpp } from "@/lib/keuangan";
import { getSession, SessionPayload } from "@/lib/auth";

export const WALI_ROLES = new Set(["wali_santri", "orang_tua", "wali"]);

export function getRoleList(session: SessionPayload | null): string[] {
  return (session?.role || "")
    .toLowerCase()
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
}

export function isWaliOnlySession(session: SessionPayload | null): boolean {
  const roles = getRoleList(session);
  return roles.length === 0 || roles.every((r) => WALI_ROLES.has(r));
}

export function isWaliKelasSession(session: SessionPayload | null): boolean {
  const roles = getRoleList(session);
  const allowed = new Set([
    "wali_kelas",
    "wali_kelas_mts",
    "wali_kelas_il",
    "wali_kelas_ma",
    "admin_super",
    "mudir",
    "kepala_sekolah",
    "kepala_kurikulum",
    "kadiv_kurikulum",
  ]);
  return roles.some((r) => allowed.has(r));
}

export function isMusyrifOrKesehatanSession(session: SessionPayload | null): boolean {
  const roles = getRoleList(session);
  const allowed = new Set([
    "musyrif",
    "pengasuh",
    "kepala_pengasuhan",
    "kadiv_pengasuhan",
    "kepala_asrama",
    "kadiv_asrama",
    "kepala_kedisiplinan",
    "kadiv_kedisiplinan",
    "petugas_kesehatan",
    "kesehatan",
    "uks",
    "admin_super",
    "mudir",
  ]);
  return roles.some((r) => allowed.has(r));
}

export async function authorizeWaliOrStaffSantri(requestedSantriId?: string | null) {
  const session = await getSession();
  if (!session?.userId) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  const waliOnly = isWaliOnlySession(session);
  let santriId = requestedSantriId || null;

  if (waliOnly) {
    if (!santriId) {
      const link = await prisma.orangTuaSantri.findFirst({
        where: { user_id: session.userId },
        select: { santri_id: true },
      });
      if (!link?.santri_id) {
        return { ok: false as const, status: 404, error: "Ananda belum ditautkan ke akun ini" };
      }
      santriId = link.santri_id;
    } else {
      const link = await prisma.orangTuaSantri.findFirst({
        where: { user_id: session.userId, santri_id: santriId },
        select: { santri_id: true },
      });
      if (!link) {
        return { ok: false as const, status: 403, error: "Forbidden: Anda hanya dapat melihat data ananda sendiri" };
      }
    }
  } else if (!santriId) {
    const first = await prisma.santriAktif.findFirst({
      where: { is_active: true },
      orderBy: { nama_lengkap: "asc" },
      select: { id: true },
    });
    if (!first) {
      return { ok: false as const, status: 404, error: "Belum ada santri aktif" };
    }
    santriId = first.id;
  }

  const spp = await cekStatusSpp(santriId);
  const rolesUpper = (session.role || "").toUpperCase();
  const bypassSpp =
    !waliOnly ||
    rolesUpper.includes("ADMIN") ||
    rolesUpper.includes("KEUANGAN") ||
    rolesUpper.includes("MUDIR");

  const isSppLocked = !bypassSpp && !spp.lunas && spp.status !== "menunggu_verifikasi" && !spp.isUnlockedManual;

  return {
    ok: true as const,
    session,
    waliOnly,
    santriId,
    spp,
    isSppLocked,
  };
}
