import { NextResponse } from "next/server";
import { syncHalaqohFromExcel } from "@/lib/syncHalaqohFromExcel";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await syncHalaqohFromExcel();
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Gagal sync halaqoh" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const res = await syncHalaqohFromExcel();
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Gagal sync halaqoh" }, { status: 500 });
  }
}
