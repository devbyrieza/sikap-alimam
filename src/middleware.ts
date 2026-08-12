import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// Halaman yang tidak perlu login
const PUBLIC_PATHS = ["/login", "/absen"];

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

  return NextResponse.next(); 
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
