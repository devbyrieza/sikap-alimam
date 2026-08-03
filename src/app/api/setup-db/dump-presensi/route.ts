import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const data = await prisma.presensiSiswa.findMany();
  return NextResponse.json({ count: data.length, data });
}
