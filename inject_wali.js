const fs = require('fs');
let code = fs.readFileSync('src/app/api/auth/login/route.ts', 'utf8');

const anchor = 'if (!user || !user.is_active) {';

const newLogic = `    // 3. Jika bukan Pegawai, periksa apakah SantriAktif (untuk Wali Santri login menggunakan NIS)
    if (!user) {
      const santri = await prisma.santriAktif.findFirst({
        where: {
          OR: [ { nis: identifier }, { nisn: identifier } ]
        },
        include: {
          orang_tua: { include: { user: true } },
          pembayaran_spp: { 
            where: { bulan: new Date().getMonth() + 1, tahun: new Date().getFullYear() },
            take: 1
          }
        }
      });

      if (santri) {
        // Cek SPP bulan ini
        const isSppLunas = santri.pembayaran_spp[0]?.status === 'lunas';
        const sppBlocked = !isSppLunas;
        const sppReason = sppBlocked ? \`SPP Bulan \${new Date().toLocaleString('id-ID', {month:'long'})} \${new Date().getFullYear()} Belum Lunas\` : null;

        if (santri.orang_tua.length > 0 && santri.orang_tua[0].user) {
          // Update status SPP di akun Wali Santri
          user = await prisma.user.update({
            where: { id: santri.orang_tua[0].user.id },
            data: { spp_access_blocked: sppBlocked, spp_blocked_reason: sppReason },
            include: { pegawai: { select: { id: true, nama_lengkap: true, nama_panggilan: true } } }
          });
        } else {
          // Auto-provision akun Wali Santri baru
          const bcrypt2 = await import("bcryptjs");
          const defaultPassword = "Sikap2026!";
          const hashed = await bcrypt2.default.hash(defaultPassword, 10);
          
          user = await prisma.user.create({
            data: {
              username: santri.nis || identifier,
              email: \`wali_\${santri.nis || identifier}@pesantren-alimam.com\`,
              password: hashed,
              plain_password: defaultPassword,
              nama: \`Wali dari \${santri.nama_lengkap}\`,
              role: "WALI_SANTRI",
              is_active: true,
              must_change_password: true,
              spp_access_blocked: sppBlocked,
              spp_blocked_reason: sppReason,
            },
            include: { pegawai: { select: { id: true, nama_lengkap: true, nama_panggilan: true } } }
          });

          await prisma.orangTuaSantri.create({
            data: { user_id: user.id, santri_id: santri.id }
          });
        }
      }
    }

    ${anchor}`;

code = code.replace(anchor, newLogic);
fs.writeFileSync('src/app/api/auth/login/route.ts', code);
