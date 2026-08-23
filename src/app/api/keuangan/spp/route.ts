import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { NAMA_BULAN } from "@/lib/keuangan";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const bulan = parseInt(searchParams.get("bulan") || String(now.getMonth() + 1));
    const tahun = parseInt(searchParams.get("tahun") || String(now.getFullYear()));
    const kelasId = searchParams.get("kelas_id") || "";
    const statusFilter = searchParams.get("status") || "ALL"; // ALL | LUNAS | BELUM_LUNAS
    const search = searchParams.get("q") || "";

    const whereSantri: any = { is_active: true };
    if (kelasId && kelasId !== "ALL") {
      whereSantri.kelas_id = kelasId;
    }
    if (search) {
      whereSantri.OR = [
        { nama_lengkap: { contains: search, mode: "insensitive" } },
        { nis: { contains: search, mode: "insensitive" } },
      ];
    }

    // Ambil seluruh santri aktif beserta kelas dan status pembayaran bulan ini
    const santriList = await prisma.santriAktif.findMany({
      where: whereSantri,
      include: {
        kelas: { select: { id: true, nama: true, jenjang: true } },
        pembayaran_spp: {
          where: { bulan, tahun } } },
      orderBy: [
        { kelas: { nama: "asc" } },
        { nama_lengkap: "asc" },
      ] });

    const todayDate = now.getDate();
    const isCurrentMonth = bulan === (now.getMonth() + 1) && tahun === now.getFullYear();

    const data = santriList.map((s) => {
      const spp = s.pembayaran_spp[0];
      const isLunas = spp?.status === "lunas";
      
      // Status lock logic
      let lockStatus: "LUNAS" | "TENGGANG" | "TERKUNCI" = "LUNAS";
      if (!isLunas) {
        if (isCurrentMonth) {
          lockStatus = todayDate <= 10 ? "TENGGANG" : "TERKUNCI";
        } else if (tahun < now.getFullYear() || (tahun === now.getFullYear() && bulan < (now.getMonth() + 1))) {
          lockStatus = "TERKUNCI";
        } else {
          lockStatus = "TENGGANG";
        }
      }

      return {
        id: s.id,
        nis: s.nis,
        nama_lengkap: s.nama_lengkap,
        jenis_kelamin: s.jenis_kelamin,
        kelas_id: s.kelas_id,
        kelas_nama: s.kelas?.nama || "-",
        jenjang: s.kelas?.jenjang || "-",
        spp: {
          id: spp?.id || null,
          bulan,
          tahun,
          nominal: spp?.nominal || 1500000,
          status: isLunas ? "lunas" : "belum_lunas",
          lock_status: lockStatus,
          tanggal_bayar: spp?.tanggal_bayar ? spp.tanggal_bayar.toISOString().split("T")[0] : null,
          metode_bayar: spp?.metode_bayar || "transfer",
          catatan: spp?.catatan || "" } };
    });

    // Filter status jika diminta
    const filteredData = data.filter((item) => {
      if (statusFilter === "LUNAS") return item.spp.status === "lunas";
      if (statusFilter === "BELUM_LUNAS") return item.spp.status === "belum_lunas";
      if (statusFilter === "TERKUNCI") return item.spp.lock_status === "TERKUNCI";
      return true;
    });

    // Ringkasan Statistik
    const totalSantri = data.length;
    const totalLunas = data.filter((d) => d.spp.status === "lunas").length;
    const totalBelumLunas = totalSantri - totalLunas;
    const totalTerkunci = data.filter((d) => d.spp.lock_status === "TERKUNCI").length;
    const totalTerkumpul = data.reduce((acc, curr) => curr.spp.status === "lunas" ? acc + curr.spp.nominal : acc, 0);
    const totalTunggakan = data.reduce((acc, curr) => curr.spp.status !== "lunas" ? acc + curr.spp.nominal : acc, 0);

    return NextResponse.json({
      success: true,
      bulan,
      tahun,
      nama_bulan: NAMA_BULAN[bulan - 1],
      is_current_month: isCurrentMonth,
      today_date: todayDate,
      summary: {
        total_santri: totalSantri,
        total_lunas: totalLunas,
        total_belum_lunas: totalBelumLunas,
        total_terkunci: totalTerkunci,
        total_terkumpul: totalTerkumpul,
        total_tunggakan: totalTunggakan,
        persentase: totalSantri > 0 ? Math.round((totalLunas / totalSantri) * 100) : 0 },
      data: filteredData });
  } catch (error: any) {
    console.error("Error in GET /api/keuangan/spp:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Batasi akses hanya untuk Admin Keuangan dan Admin Super
    const roleUpper = (session.role || "").toUpperCase();
    if (roleUpper !== "ADMIN_KEUANGAN" && roleUpper !== "ADMIN_SUPER" && roleUpper !== "MUDIR") {
      return NextResponse.json({ error: "Hanya Admin Keuangan / Admin Super yang berwenang mengubah status SPP" }, { status: 403 });
    }

    const body = await req.json();
    const { santri_id, bulan, tahun, status, nominal, tanggal_bayar, metode_bayar, catatan } = body;

    if (!santri_id || !bulan || !tahun) {
      return NextResponse.json({ error: "santri_id, bulan, dan tahun wajib diisi" }, { status: 400 });
    }

    const tgl = (status === "lunas" && tanggal_bayar) 
      ? new Date(tanggal_bayar) 
      : (status === "lunas" ? new Date() : null);

    const record = await prisma.pembayaranSPP.upsert({
      where: {
        santri_id_bulan_tahun: {
          santri_id,
          bulan: Number(bulan),
          tahun: Number(tahun) } },
      create: {
        santri_id,
        bulan: Number(bulan),
        tahun: Number(tahun),
        status: status || "belum_lunas",
        nominal: Number(nominal) || 1500000,
        tanggal_bayar: tgl,
        metode_bayar: metode_bayar || "transfer",
        catatan: catatan || null },
      update: {
        status: status || "belum_lunas",
        nominal: nominal !== undefined ? Number(nominal) : undefined,
        tanggal_bayar: tgl,
        metode_bayar: metode_bayar || "transfer",
        catatan: catatan !== undefined ? catatan : undefined } });

    return NextResponse.json({
      success: true,
      message: `Status SPP santri berhasil diubah menjadi ${status === "lunas" ? "LUNAS" : "BELUM LUNAS"}`,
      data: record });
  } catch (error: any) {
    console.error("Error in POST /api/keuangan/spp:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
