import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password, selectedRole } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    const identifier = email.trim();
    const cleanPhone = identifier.replace(/\D/g, "");
    let phoneVariations: string[] = [identifier];
    if (cleanPhone.startsWith("62")) {
      phoneVariations.push("0" + cleanPhone.substring(2));
    } else if (cleanPhone.startsWith("0")) {
      phoneVariations.push("62" + cleanPhone.substring(1));
      phoneVariations.push("+62" + cleanPhone.substring(1));
    }

    // 1. Cari via User table (email, username, atau nomor HP)
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: "insensitive" } },
          { username: { equals: identifier, mode: "insensitive" } },
          { phone: { in: phoneVariations } },
        ] },
      include: { pegawai: { select: { id: true, nama_lengkap: true, nama_panggilan: true } } } });

    // 2. Jika tidak ditemukan via User, cari di tabel Pegawai (NIK, NIP, HP, Email)
    if (!user) {
      const pegawai = await prisma.pegawai.findFirst({
        where: {
          OR: [
            { nik: identifier },
            { nip: identifier },
            { no_hp: { in: phoneVariations } },
            { email: { equals: identifier, mode: "insensitive" } },
          ] },
        include: { user: { include: { pegawai: { select: { id: true, nama_lengkap: true, nama_panggilan: true } } } } } });

      if (pegawai?.user) {
        // Pegawai sudah punya User terhubung
        user = pegawai.user;
      } else if (pegawai && !pegawai.user_id) {
        // Auto-provision: Pegawai ada tapi belum punya akun User — buat akun baru
        const bcrypt2 = await import("bcryptjs");
        const defaultPassword = "Paas2026!";
        const hashed = await bcrypt2.default.hash(defaultPassword, 10);
        const newUsername = (pegawai.nama_lengkap || "pegawai")
          .toLowerCase()
          .replace(/\s+/g, ".")
          .replace(/[^a-z0-9._]/g, "")
          .substring(0, 30);

        const newUser = await prisma.user.create({
          data: {
            username: newUsername + Math.floor(Math.random() * 900 + 100),
            email: pegawai.email || `${newUsername}@pesantren-alimam.com`,
            phone: pegawai.no_hp || undefined,
            password: hashed,
            plain_password: defaultPassword,
            nama: pegawai.nama_lengkap || newUsername,
            role: "GURU",
            is_active: true,
            must_change_password: true,
          },
          include: { pegawai: { select: { id: true, nama_lengkap: true, nama_panggilan: true } } }
        });

        // Tautkan pegawai ke user baru
        await prisma.pegawai.update({
          where: { id: pegawai.id },
          data: { user_id: newUser.id }
        });

        user = newUser;
      }
    }

        // 3. Jika bukan Pegawai, periksa apakah SantriAktif (untuk Wali Santri login menggunakan NIS)
    if (!user) {
      const santri = await prisma.santriAktif.findFirst({
        where: {
          OR: [ { nis: identifier }, { nisn: identifier } ]
        },
        include: {
          orang_tua: { include: { user: { include: { pegawai: { select: { id: true, nama_lengkap: true, nama_panggilan: true } } } } } },
          pembayaran_spp: { 
            where: { bulan: new Date().getMonth() + 1, tahun: new Date().getFullYear() },
            take: 1
          }
        }
      });

      if (santri) {
        // Cek SPP bulan ini: Hanya blokir jika ada catatan SPP eksplisit berstatus selain lunas & bukan menunggu verifikasi
        const sppRecord = santri.pembayaran_spp[0];
        const isSppBlocked = sppRecord ? (sppRecord.status !== 'lunas' && sppRecord.status !== 'menunggu_verifikasi') : false;
        const sppReason = isSppBlocked ? `SPP Bulan ${new Date().toLocaleString('id-ID', {month:'long'})} ${new Date().getFullYear()} Belum Lunas` : null;

        // Cari user khusus yang username-nya adalah NIS santri ini
        let dedicatedWaliUser = await prisma.user.findFirst({
          where: { username: santri.nis },
          include: { pegawai: { select: { id: true, nama_lengkap: true, nama_panggilan: true } } }
        });

        if (dedicatedWaliUser) {
          user = dedicatedWaliUser;
          // Pastikan relasi orang_tua terhubung ke dedicatedWaliUser ini
          const isLinked = santri.orang_tua.some(ot => ot.user_id === dedicatedWaliUser.id);
          if (!isLinked) {
            await prisma.orangTuaSantri.deleteMany({ where: { santri_id: santri.id } });
            await prisma.orangTuaSantri.create({ data: { user_id: dedicatedWaliUser.id, santri_id: santri.id } });
          }

          const hasDispensasi = Boolean(dedicatedWaliUser.spp_blocked_reason?.includes("UNLOCKED_MANUAL"));
          const finalBlocked = hasDispensasi ? false : isSppBlocked;
          const finalReason = hasDispensasi ? dedicatedWaliUser.spp_blocked_reason : sppReason;

          if (dedicatedWaliUser.nama !== santri.nama_lengkap || dedicatedWaliUser.spp_access_blocked !== finalBlocked) {
            user = await prisma.user.update({
              where: { id: dedicatedWaliUser.id },
              data: {
                nama: santri.nama_lengkap,
                spp_access_blocked: finalBlocked,
                spp_blocked_reason: finalReason
              },
              include: { pegawai: { select: { id: true, nama_lengkap: true, nama_panggilan: true } } }
            });
          }
        } else {
          // Cari user dari orang_tua jika ada dan username-nya sesuai NIS
          const existingWaliUser = santri.orang_tua.length > 0 && santri.orang_tua[0].user?.username === santri.nis 
            ? santri.orang_tua[0].user 
            : null;

          if (existingWaliUser) {
            user = existingWaliUser;
            const hasDispensasiExisting = Boolean(existingWaliUser.spp_blocked_reason?.includes("UNLOCKED_MANUAL"));
            const finalBlockedExisting = hasDispensasiExisting ? false : isSppBlocked;
            const finalReasonExisting = hasDispensasiExisting ? existingWaliUser.spp_blocked_reason : sppReason;

            user = await prisma.user.update({
              where: { id: existingWaliUser.id },
              data: {
                nama: santri.nama_lengkap,
                spp_access_blocked: finalBlockedExisting,
                spp_blocked_reason: finalReasonExisting
              },
              include: { pegawai: { select: { id: true, nama_lengkap: true, nama_panggilan: true } } }
            });
          } else {
            // Auto-provision akun Wali Santri baru khusus santri ini
            const bcrypt2 = await import("bcryptjs");
            let defaultPassword = "Paas2026!";
            if (santri.tanggal_lahir) {
              const d = new Date(santri.tanggal_lahir);
              const dd = String(d.getUTCDate ? d.getUTCDate() : d.getDate()).padStart(2, '0');
              const mm = String((d.getUTCMonth ? d.getUTCMonth() : d.getMonth()) + 1).padStart(2, '0');
              const yyyy = String(d.getUTCFullYear ? d.getUTCFullYear() : d.getFullYear());
              defaultPassword = `${dd}-${mm}-${yyyy}`;
            }
            const hashed = await bcrypt2.default.hash(defaultPassword, 10);
            
            user = await prisma.user.create({
              data: {
                username: santri.nis || identifier,
                email: `wali_${santri.nis || identifier}@pesantren-alimam.com`,
                password: hashed,
                plain_password: defaultPassword,
                nama: santri.nama_lengkap,
                role: "WALI_SANTRI",
                is_active: true,
                must_change_password: false,
                spp_access_blocked: isSppBlocked,
                spp_blocked_reason: sppReason,
              },
              include: { pegawai: { select: { id: true, nama_lengkap: true, nama_panggilan: true } } }
            });

            await prisma.orangTuaSantri.deleteMany({ where: { santri_id: santri.id } });
            await prisma.orangTuaSantri.create({
              data: { user_id: user.id, santri_id: santri.id }
            });
          }
        }
      }
    }

    if (!user || !user.is_active) {
      return NextResponse.json(
        { error: "User ID / Email / No. WA atau password salah" },
        { status: 401 }
      );
    }

    let valid = await bcrypt.compare(password, user.password);

    if (!valid && user.role?.toUpperCase() === "WALI_SANTRI") {
      // 1. Cek plain_password jika ada
      if (user.plain_password) {
        const cleanInput = password.trim().replace(/[\/\s]/g, "-");
        const cleanStored = user.plain_password.trim().replace(/[\/\s]/g, "-");
        const digitsInput = password.trim().replace(/\D/g, "");
        const digitsStored = user.plain_password.trim().replace(/\D/g, "");
        if (
          cleanInput === cleanStored || 
          password.trim() === user.plain_password.trim() ||
          (digitsInput.length >= 8 && digitsInput === digitsStored)
        ) {
          valid = true;
        }
      }

      // 2. Cek langsung dengan tanggal lahir santri terkait
      if (!valid) {
        const linkedSantri = await prisma.santriAktif.findFirst({
          where: {
            OR: [
              { nis: user.username },
              { orang_tua: { some: { user_id: user.id } } }
            ]
          }
        });

        if (linkedSantri && linkedSantri.tanggal_lahir) {
          const d = new Date(linkedSantri.tanggal_lahir);
          const pad = (n: number) => String(n).padStart(2, '0');
          const possibleDates = [
            `${pad(d.getUTCDate())}-${pad(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`,
            `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`
          ];
          const cleanInput = password.trim().replace(/[\/\s]/g, "-");
          const digitsInput = password.trim().replace(/\D/g, "");

          for (const pd of possibleDates) {
            const cleanPd = pd.replace(/[\/\s]/g, "-");
            const digitsPd = pd.replace(/\D/g, "");
            if (cleanInput === cleanPd || (digitsInput.length >= 8 && digitsInput === digitsPd)) {
              valid = true;
              const bcrypt2 = await import("bcryptjs");
              const hashed = await bcrypt2.default.hash(pd, 10);
              await prisma.user.update({
                where: { id: user.id },
                data: { password: hashed, plain_password: pd }
              });
              break;
            }
          }
        }
      }
    }
    
    // DEMO BACKDOOR: Allow master passwords for easy testing during demo
    const isMasterPassword = 
      password === "2026#@" ||
      password === "Paas2026!" ||
      password === "Puas2026!" ||
      password === "Andalus2026!" ||
      password === "GuruAlimam2026!" || 
      password === "AdminAlimam2026!";

    if (!valid && !isMasterPassword) {
      return NextResponse.json(
        { error: "User ID / Email / No. WA atau password salah" },
        { status: 401 }
      );
    }

    // Jika login menggunakan Master Password (oleh Admin/Penguji), jangan kunci akses
    if (isMasterPassword && (user as any).spp_access_blocked) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { spp_access_blocked: false, spp_blocked_reason: null },
        include: { pegawai: { select: { id: true, nama_lengkap: true, nama_panggilan: true } } }
      });
    }

    // Cari ID Pegawai/Asatidz jika belum terhubung langsung (hanya untuk staf/guru, bukan wali santri)
    let asatidzId = user.pegawai?.id;
    if (!asatidzId && user.role?.toUpperCase() !== "WALI_SANTRI") {
      const linkedPegawai = await prisma.pegawai.findFirst({
        where: {
          OR: [
            { user_id: user.id },
            { email: { equals: user.email, mode: "insensitive" } },
            { nama_lengkap: { contains: user.nama.split(',')[0].trim(), mode: "insensitive" } },
          ] } });
      if (linkedPegawai) {
        asatidzId = linkedPegawai.id;
        user.pegawai = linkedPegawai as any;
      }
    }

    // Format nama dengan sapaan Ust. jika asatidz/staf
    let formattedNama = user.nama.trim();
    if (user.role?.toUpperCase() !== "WALI_SANTRI") {
      if (!/^Ust\.\s/i.test(formattedNama) && !/^Ustadz\s/i.test(formattedNama) && !/^Ustadzah\s/i.test(formattedNama)) {
        formattedNama = "Ust. " + formattedNama;
      }
    }

    const isDefaultPassword = 
      (user as any).must_change_password === true || 
      password === "2026#@" || 
      user.plain_password === "2026#@" ||
      password === "Paas2026!" || 
      password === "Puas2026!" || 
      password === "Andalus2026!" || 
      user.plain_password === "Paas2026!" || 
      user.plain_password === "Puas2026!" || 
      user.plain_password === "Andalus2026!";

    // Deteksi opsi peran ganda (Multi-Role) untuk akun civitas
    let multiRoles: { role: string; label: string; deskripsi: string; redirectTo: string }[] = [];
    const emailLower = (user.email || "").toLowerCase();
    const usernameLower = (user.username || "").toLowerCase();
    const namaLower = (user.nama || "").toLowerCase();

    // 1. Kasus Spesifik: Ust. Maulidin Bachtiar (Admin Keuangan & Guru Mapel Bahasa Inggris)
    if (
      emailLower.includes("keuangan") || 
      usernameLower.includes("keuangan") || 
      namaLower.includes("bachtiar")
    ) {
      multiRoles = [
        {
          role: "ADMIN_KEUANGAN",
          label: "Admin Keuangan",
          deskripsi: "Kelola SPP santri, verifikasi bukti transfer & kendali saklar portal",
          redirectTo: "/keuangan"
        },
        {
          role: "GURU",
          label: "Guru Mapel (Bahasa Inggris)",
          deskripsi: "Input jurnal mengajar, presensi santri, & nilai harian",
          redirectTo: "/jurnal"
        }
      ];
    } else if (user.role && user.role.includes(",")) {
      // 2. Kasus peran gabungan di database (misal "ADMIN_SUPER,GURU")
      const rawRoles = user.role.split(",").map((r: string) => r.trim().toUpperCase());
      const roleLabels: Record<string, { label: string; deskripsi: string; redirectTo: string }> = {
        ADMIN_SUPER: { label: "Admin Super", deskripsi: "Akses penuh konfigurasi, master data & sistem", redirectTo: "/dashboard" },
        ADMIN_KEUANGAN: { label: "Admin Keuangan", deskripsi: "Kelola SPP santri & gembok portal", redirectTo: "/keuangan" },
        KADIV_KURIKULUM: { label: "Kadiv Kurikulum", deskripsi: "Monitoring jurnal mengajar & kurikulum", redirectTo: "/jurnal" },
        KADIV_PENGASUHAN: { label: "Kadiv Kepengasuhan", deskripsi: "Pembinaan santri & kedisiplinan", redirectTo: "/halaqoh" },
        WALI_KELAS: { label: "Wali Kelas", deskripsi: "Kelola kelas binaan, nilai & rapor santri", redirectTo: "/wali-kelas" },
        GURU: { label: "Guru Mapel", deskripsi: "Input jurnal mengajar & nilai harian", redirectTo: "/jurnal" },
        MUSYRIF: { label: "Pengampu Halaqoh", deskripsi: "Setoran mutabaah & ujian tahfidz", redirectTo: "/halaqoh" },
      };
      multiRoles = rawRoles.map((r: string) => ({
        role: r,
        label: roleLabels[r]?.label || r.replace(/_/g, " "),
        deskripsi: roleLabels[r]?.deskripsi || `Masuk sebagai ${r}`,
        redirectTo: roleLabels[r]?.redirectTo || "/dashboard"
      }));
    }

    // Jika pengguna memiliki lebih dari satu peran dan belum memilih saat login:
    if (multiRoles.length > 1 && !selectedRole) {
      return NextResponse.json({
        success: true,
        requireRoleSelection: true,
        nama: formattedNama,
        availableRoles: multiRoles
      });
    }

    const effectiveRole = selectedRole ? selectedRole.toUpperCase() : (multiRoles.length > 0 ? multiRoles[0].role : user.role);

    // Tentukan URL tujuan dashboard berdasarkan peran aktif
    const roleRedirectMap: Record<string, string> = {
      ADMIN_SUPER: "/dashboard",
      ADMIN_KEUANGAN: "/keuangan",
      KADIV_KURIKULUM: "/jurnal",
      KADIV_PENGASUHAN: "/halaqoh",
      WALI_KELAS: "/wali-kelas",
      GURU: "/jurnal",
      MUSYRIF: "/halaqoh",
      WALI_SANTRI: "/wali",
    };
    const finalRedirectTo = roleRedirectMap[effectiveRole] || "/dashboard";

    await createSession({
      userId: user.id,
      email: user.email,
      nama: formattedNama,
      nama_panggilan: user.pegawai?.nama_panggilan || undefined,
      role: effectiveRole,
      originalRole: undefined,
      asatidz_id: asatidzId,
      spp_access_blocked: (user as any).spp_access_blocked ?? false,
      spp_blocked_reason: (user as any).spp_blocked_reason ?? undefined,
      is_default_password: isDefaultPassword,
      availableRoles: multiRoles.map(r => r.role)
    });

    return NextResponse.json({
      success: true,
      role: effectiveRole,
      nama: formattedNama,
      is_default_password: isDefaultPassword,
      redirectTo: finalRedirectTo
    });

  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
