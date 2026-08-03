import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret-change-in-production"
);

export interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
  nama: string;
  role: string;
  originalRole?: string;
  asatidz_id?: string;
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
    maxAge,
    expires: new Date(Date.now() + maxAge * 1000),
    path: "/",
  });

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

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("siakad_session");
}
