import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const emailToDelete = 'pribadi.guru@pesantren-alimam.com'

  console.log(`Menyiapkan penghapusan permanen untuk akun: ${emailToDelete}...`)

  // 1. Cari User
  const user = await prisma.user.findUnique({
    where: { email: emailToDelete },
    include: { pegawai: true }
  })

  if (!user) {
    console.log(`[INFO] Akun dengan email ${emailToDelete} tidak ditemukan. Mungkin sudah dihapus.`)
    return
  }

  const pegawaiId = user.pegawai?.id

  try {
    await prisma.$transaction(async (tx) => {
      console.log(`Memulai transaksi penghapusan untuk User ID: ${user.id}`)

      // A. Hapus token reset password (jika ada)
      const delTokens = await tx.passwordResetToken.deleteMany({
        where: { user_id: user.id }
      })
      console.log(`- Dihapus: ${delTokens.count} PasswordResetToken`)

      if (pegawaiId) {
        console.log(`Ditemukan data Pegawai terkait (ID: ${pegawaiId}). Menghapus data relasi pegawai...`)

        // B. Hapus Jurnal Mengajar
        const delJurnal = await tx.jurnalMengajar.deleteMany({
          where: { pegawai_id: pegawaiId }
        })
        console.log(`- Dihapus: ${delJurnal.count} JurnalMengajar`)

        // C. Hapus Presensi Asatidz
        const delPresensi = await tx.presensiAsatidz.deleteMany({
          where: { pegawai_id: pegawaiId }
        })
        console.log(`- Dihapus: ${delPresensi.count} PresensiAsatidz`)

        // D. Hapus AsatidzmMapel (Jadwal/Pengampu)
        const delMapel = await tx.asatidzmMapel.deleteMany({
          where: { pegawai_id: pegawaiId }
        })
        console.log(`- Dihapus: ${delMapel.count} AsatidzmMapel`)

        // E. Hapus Capaian Tahfidz (Mutabaah) yang diinput oleh guru ini
        const delTahfidz = await tx.capaianTahfidz.deleteMany({
          where: { pegawai_id: pegawaiId }
        })
        console.log(`- Dihapus: ${delTahfidz.count} CapaianTahfidz`)

        // F. Hapus IbadahAdabSantri (Mutabaah Ibadah)
        const delIbadah = await tx.ibadahAdabSantri.deleteMany({
          where: { pegawai_id: pegawaiId }
        })
        console.log(`- Dihapus: ${delIbadah.count} IbadahAdabSantri`)
        
        // G. Hapus JadwalPelajaran
        const delJadwal = await tx.jadwalPelajaran.deleteMany({
          where: { pegawai_id: pegawaiId }
        })
        console.log(`- Dihapus: ${delJadwal.count} JadwalPelajaran`)

        // H. Hapus Pegawai itu sendiri
        await tx.pegawai.delete({
          where: { id: pegawaiId }
        })
        console.log(`- Dihapus: Data Pegawai (ID: ${pegawaiId})`)
      }

      // I. Terakhir, Hapus User
      await tx.user.delete({
        where: { id: user.id }
      })
      console.log(`- Dihapus: Data User (ID: ${user.id})`)

      console.log('✅ SELURUH DATA TERKAIT AKUN TELAH BERHASIL DIHAPUS SECARA PERMANEN.')
    })
  } catch (error) {
    console.error('❌ TERJADI KESALAHAN SAAT MENGHAPUS DATA:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
