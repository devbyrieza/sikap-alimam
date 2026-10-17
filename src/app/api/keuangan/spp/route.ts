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
          where: { bulan, tahun }
        },
        orang_tua: {
          include: {
            user: { select: { id: true, spp_access_blocked: true, spp_blocked_reason: true } }
          }
        }
      },
      orderBy: [
        { kelas: { nama: "asc" } },
        { nama_lengkap: "asc" },
      ]
    });

    const nisList = santriList.map((s) => s.nis).filter(Boolean) as string[];
    const usersByNis = await prisma.user.findMany({
      where: { username: { in: nisList } },
      select: { id: true, username: true, spp_access_blocked: true, spp_blocked_reason: true }
    });
    const userNisMap = new Map<string, { spp_access_blocked: boolean; spp_blocked_reason: string | null }>();
    usersByNis.forEach((u) => {
      if (u.username) userNisMap.set(u.username, u);
    });

    const todayDate = now.getDate();
    const isCurrentMonth = bulan === (now.getMonth() + 1) && tahun === now.getFullYear();

    const data = santriList.map((s) => {
      const spp = s.pembayaran_spp[0];
      const isLunas = spp?.status === "lunas";
      const isMenunggu = spp?.status === "menunggu_verifikasi";

      const parentUser = s.orang_tua?.[0]?.user || (s.nis ? userNisMap.get(s.nis) : null);
      const isUnlockedManual = !!(parentUser?.spp_blocked_reason && parentUser.spp_blocked_reason.includes("UNLOCKED_MANUAL"));
      const isLockedManual = !!(parentUser?.spp_access_blocked === true || (parentUser?.spp_blocked_reason && parentUser.spp_blocked_reason.includes("LOCKED_MANUAL")));
      
      // Status lock logic
      let lockStatus: "LUNAS" | "TENGGANG" | "TERKUNCI" = "LUNAS";
      if (!isLunas && !isMenunggu) {
        if (isCurrentMonth) {
          lockStatus = todayDate <= 10 ? "TENGGANG" : "TERKUNCI";
        } else if (tahun < now.getFullYear() || (tahun === now.getFullYear() && bulan < (now.getMonth() + 1))) {
          lockStatus = "TERKUNCI";
        } else {
          lockStatus = "TENGGANG";
        }
      }

      let portalAccess: "TERBUKA_PENUH" | "TERBUKA_DISPENSASI" | "TERBUKA_VERIFIKASI" | "TERBUKA_TENGGANG" | "TERKUNCI_OTOMATIS" | "TERKUNCI_MANUAL" = "TERBUKA_PENUH";
      if (isLockedManual) {
        portalAccess = "TERKUNCI_MANUAL";
      } else if (isUnlockedManual) {
        portalAccess = "TERBUKA_DISPENSASI";
      } else if (isMenunggu) {
        portalAccess = "TERBUKA_VERIFIKASI";
      } else if (isLunas) {
        portalAccess = "TERBUKA_PENUH";
      } else if (lockStatus === "TENGGANG") {
        portalAccess = "TERBUKA_TENGGANG";
      } else {
        portalAccess = "TERKUNCI_OTOMATIS";
      }

      return {
        id: s.id,
        nis: s.nis,
        nama_lengkap: s.nama_lengkap,
        jenis_kelamin: s.jenis_kelamin,
        kelas_id: s.kelas_id,
        kelas_nama: s.kelas?.nama || "-",
        jenjang: s.kelas?.jenjang || "-",
        is_unlocked_manual: isUnlockedManual,
        is_locked_manual: isLockedManual,
        portal_access: portalAccess,
        spp: {
          id: spp?.id || null,
          bulan,
          tahun,
          nominal: spp?.nominal || 1000000,
          status: isLunas ? "lunas" : isMenunggu ? "menunggu_verifikasi" : "belum_lunas",
          lock_status: lockStatus,
          tanggal_bayar: spp?.tanggal_bayar ? spp.tanggal_bayar.toISOString().split("T")[0] : null,
          metode_bayar: spp?.metode_bayar || "transfer",
          catatan: spp?.catatan || "" } };
    });

    // Filter status jika diminta
    const filteredData = data.filter((item) => {
      if (statusFilter === "LUNAS") return item.spp.status === "lunas";
      if (statusFilter === "BELUM_LUNAS") return item.spp.status === "belum_lunas";
      if (statusFilter === "TERKUNCI") return item.portal_access.startsWith("TERKUNCI");
      if (statusFilter === "DISPENSASI") return item.is_unlocked_manual;
      return true;
    });

    // Ringkasan Statistik
    const totalSantri = data.length;
    const totalLunas = data.filter((d) => d.spp.status === "lunas").length;
    const totalBelumLunas = totalSantri - totalLunas;
    const totalTerkunci = data.filter((d) => d.portal_access.startsWith("TERKUNCI")).length;
    const totalDispensasi = data.filter((d) => d.is_unlocked_manual).length;
    const totalTerkumpul = data.reduce((acc, curr) => curr.spp.status === "lunas" ? acc + curr.spp.nominal : acc, 0);
    const totalTunggakan = data.reduce((acc, curr) => curr.spp.status !== "lunas" ? acc + curr.spp.nominal : acc, 0);

    // Ambil daftar konfirmasi yang sedang menunggu verifikasi
    const pendingVerifications = await prisma.pembayaranSPP.findMany({
      where: { status: "menunggu_verifikasi" },
      include: {
        santri: {
          select: {
            id: true,
            nama_lengkap: true,
            nis: true,
            kelas: { select: { nama: true } }
          }
        }
      },
      orderBy: { updated_at: "desc" }
    });

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
        total_dispensasi: totalDispensasi,
        total_terkumpul: totalTerkumpul,
        total_tunggakan: totalTunggakan,
        total_pending_verifikasi: pendingVerifications.length,
        persentase: totalSantri > 0 ? Math.round((totalLunas / totalSantri) * 100) : 0 },
      pending_verifications: pendingVerifications,
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

    // 1. ACTION: Buka / Kunci Akses Portal Wali Santri
    if (body.action === "toggle_portal_lock") {
      const { santri_id, lock_mode, reason } = body; // lock_mode: "unlock" | "lock" | "auto"
      if (!santri_id) {
        return NextResponse.json({ error: "santri_id wajib diisi" }, { status: 400 });
      }

      const santri = await prisma.santriAktif.findUnique({
        where: { id: santri_id },
        include: {
          orang_tua: { include: { user: true } }
        }
      });

      if (!santri) {
        return NextResponse.json({ error: "Santri tidak ditemukan" }, { status: 404 });
      }

      // Cari atau buat User Wali
      let waliUser: any = santri.orang_tua[0]?.user;
      if (!waliUser && santri.nis) {
        waliUser = await prisma.user.findFirst({
          where: { username: santri.nis }
        });
      }

      if (!waliUser) {
        const bcrypt2 = await import("bcryptjs");
        const defaultPassword = "Paas2026!";
        const hashed = await bcrypt2.default.hash(defaultPassword, 10);
        waliUser = await prisma.user.create({
          data: {
            username: santri.nis || `santri_${santri.id.substring(0, 8)}`,
            email: `wali_${santri.nis || santri.id.substring(0, 8)}@pesantren-alimam.com`,
            password: hashed,
            plain_password: defaultPassword,
            nama: santri.nama_lengkap,
            role: "WALI_SANTRI",
            is_active: true
          }
        });
        await prisma.orangTuaSantri.create({
          data: { user_id: waliUser.id, santri_id: santri.id }
        });
      }

      let updateData: any = {};
      let message = "";

      if (lock_mode === "unlock") {
        updateData = {
          spp_access_blocked: false,
          spp_blocked_reason: "UNLOCKED_MANUAL_BY_ADMIN"
        };
        message = `Akses portal wali santri untuk ananda ${santri.nama_lengkap} berhasil DIBUKA (Dispensasi Aktif).`;
      } else if (lock_mode === "lock") {
        updateData = {
          spp_access_blocked: true,
          spp_blocked_reason: reason || "LOCKED_MANUAL_BY_ADMIN"
        };
        message = `Akses portal wali santri untuk ananda ${santri.nama_lengkap} berhasil DIKUNCI secara manual.`;
      } else {
        // "auto" -> Kembalikan ke otomatisasi sistem SPP
        updateData = {
          spp_access_blocked: false,
          spp_blocked_reason: null
        };
        message = `Status akses portal ananda ${santri.nama_lengkap} dikembalikan ke sistem otomatisasi SPP.`;
      }

      await prisma.user.update({
        where: { id: waliUser.id },
        data: updateData
      });

      return NextResponse.json({
        success: true,
        message,
        lock_mode,
        user_id: waliUser.id
      });
    }

    // 2. ACTION: Lunaskan Semua Tunggakan Santri (Juli s/d Bulan Berjalan)
    if (body.action === "lunaskan_semua") {
      const { santri_id, tahun = 2026 } = body;
      if (!santri_id) {
        return NextResponse.json({ error: "santri_id wajib diisi" }, { status: 400 });
      }

      const santri = await prisma.santriAktif.findUnique({
        where: { id: santri_id },
        select: { id: true, nama_lengkap: true }
      });
      if (!santri) {
        return NextResponse.json({ error: "Santri tidak ditemukan" }, { status: 404 });
      }

      const currentMonth = new Date().getMonth() + 1;
      const nominalStd = 1000000;
      const updatedMonths: string[] = [];

      for (let m = 7; m <= currentMonth; m++) {
        await prisma.pembayaranSPP.upsert({
          where: {
            santri_id_bulan_tahun: { santri_id, bulan: m, tahun: Number(tahun) }
          },
          create: {
            santri_id,
            bulan: m,
            tahun: Number(tahun),
            status: "lunas",
            nominal: nominalStd,
            tanggal_bayar: new Date(),
            metode_bayar: "transfer",
            catatan: "Dilunaskan serentak oleh Admin Keuangan"
          },
          update: {
            status: "lunas",
            tanggal_bayar: new Date(),
            catatan: "Dilunaskan serentak oleh Admin Keuangan"
          }
        });
        updatedMonths.push(NAMA_BULAN[m - 1]);
      }

      return NextResponse.json({
        success: true,
        message: `Seluruh SPP ananda ${santri.nama_lengkap} (Juli s/d ${NAMA_BULAN[currentMonth - 1]} ${tahun}) berhasil dicatat LUNAS. Akses portal wali dibuka penuh.`,
        updatedMonths
      });
    }

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
        nominal: Number(nominal) || 1000000,
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
