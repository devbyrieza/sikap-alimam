import { NextRequest, NextResponse } from "next/server";
import { GET as getCetakRapor } from "@/app/api/rapor/cetak/route";

export const dynamic = 'force-dynamic';

export async function GET() {
  const req = new NextRequest("https://sikap.pesantren-alimam.com/api/rapor/cetak?santri_id=6f690e88-c53b-4442-a52f-b8a6dfd9125f&semester=Ganjil&tahun_ajaran=2026/2027");
  const res = await getCetakRapor(req);
  const data = await res.json();
  return NextResponse.json({
    santri: data.santri,
    kedisiplinan: data.kedisiplinan
  });
}
