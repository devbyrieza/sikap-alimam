import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST() {
  await deleteSession();
  const cookieStore = await cookies();
  cookieStore.delete({ name: "siakad_session", domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined });
  cookieStore.delete({ name: "app_session", domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined });
  cookieStore.delete({ name: "ppdb_session", domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined });
  cookieStore.delete("siakad_session");
  cookieStore.delete("app_session");
  cookieStore.delete("ppdb_session");
                    
  return NextResponse.json({ success: true });
}
