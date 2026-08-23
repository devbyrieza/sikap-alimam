import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// Halaman yang tidak perlu login
const PUBLIC_PATHS = ["/login", "/absen", "/akses-diblokir"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Cek apakah path publik
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  // Cek apakah API publik
  if (pathname.startsWith("/api/absen")) return NextResponse.next();
  if (pathname.startsWith("/api/auth")) return NextResponse.next();
  if (pathname.startsWith("/api/setup-db")) return NextResponse.next();
  if (pathname.startsWith("/api/debug-db")) return NextResponse.next();

  // Untuk semua path lain, cek session
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Blokir Wali Santri yang belum lunas SPP (flag manual oleh Admin Keuangan)
  if (
    session.role?.toLowerCase() === "wali_santri" &&
    (session as any).spp_access_blocked === true
  ) {
    if (!pathname.startsWith("/akses-diblokir")) {
      return NextResponse.redirect(new URL("/akses-diblokir", req.url));
    }
  }

  // Wajibkan ganti password jika masih menggunakan password default
  if (
    session.is_default_password &&
    session.role &&
    !["pendaftar", "santri", "wali_santri"].includes(session.role.toLowerCase()) &&
    !pathname.startsWith("/profile") &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/login")
  ) {
    return NextResponse.redirect(new URL("/profile", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
