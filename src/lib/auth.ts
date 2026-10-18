import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret-change-in-production"
);

export interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
  nama: string;
  nama_panggilan?: string;
  role: string;
  originalRole?: string;
  originalUserId?: string;
  originalNama?: string;
  asatidz_id?: string;
  spp_access_blocked?: boolean;
  spp_blocked_reason?: string;
  is_default_password?: boolean;
  availableRoles?: string[];
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("90d")
    .sign(SECRET);

  const maxAge = 60 * 60 * 24 * 90; // 90 hari — sesi tetap aktif walau browser ditutup
  const cookieStore = await cookies();
  cookieStore.set("siakad_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
      domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined,
    maxAge,
    expires: new Date(Date.now() + maxAge * 1000),
    path: "/" });

  return token;
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("siakad_session")?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, SECRET);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function getLiveSession(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session) return null;

  try {
    const { prisma } = await import("@/lib/prisma");
    let liveUser = null;
    if (session.userId) {
      liveUser = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { role: true, nama: true }
      });
    } else if (session.email) {
      liveUser = await prisma.user.findUnique({
        where: { email: session.email },
        select: { role: true, nama: true }
      });
    }

    if (liveUser && liveUser.role) {
      const cleanNama = liveUser.role.toUpperCase().includes("WALI")
        ? (liveUser.nama || "").replace(/^Wali dari\s+/i, "")
        : (liveUser.nama || session.nama);

      // Pertahankan peran yang dipilih jika:
      // 1. Sedang dalam mode switch (originalRole ada)
      // 2. Akun memiliki opsi multi-peran (availableRoles ada)
      // 3. liveUser.role di DB adalah gabungan (e.g. "GURU,ADMIN_KEUANGAN") dan sesi memegang salah satu perannya
      const isMultiRoleInDb = liveUser.role.includes(",");
      const shouldKeepSessionRole =
        Boolean(session.originalRole) ||
        Boolean(session.availableRoles && session.availableRoles.length > 1) ||
        (isMultiRoleInDb && session.role && liveUser.role.toUpperCase().includes(session.role.toUpperCase()));

      const activeRole = shouldKeepSessionRole ? session.role : liveUser.role;

      return {
        ...session,
        role: activeRole,
        nama: session.originalRole ? session.nama : (cleanNama || session.nama)
      };
    }
  } catch (e) {
    // Fallback gracefully to existing JWT session payload
  }

  return session;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("siakad_session");
}
