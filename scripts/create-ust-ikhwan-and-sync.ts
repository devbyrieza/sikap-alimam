import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("=== CREATING USTADZ IKHWAN ACCOUNT & SYNCING HALAQOH ===");

  const email = "ikhwan@pesantren-alimam.com";
  const plainPass = "GuruAlimam2026!";
  const hashPass = await bcrypt.hash(plainPass, 10);

  // 1. Create or update User for Ust. Ikhwan
  let user = await prisma.user.findFirst({
    where: { email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        nama: "Ust. Ikhwan",
        role: "musyrif",
        password: hashPass,
        plain_password: plainPass,
        is_active: true,
      },
    });
    console.log("✅ Created User for Ust. Ikhwan:", user.email);
  }
 else {
    console.log("ℹ️ Existing User found for Ust. Ikhwan:", user.email);
  }

  // 2. Create or update Pegawai for Ust. Ikhwan
  let pegawai = await prisma.pegawai.findFirst({
    where: {
      OR: [
        { user_id: user.id },
        { email },
        { nama_lengkap: { contains: "Ikhwan", mode: "insensitive" } },
      ],
    },
  });

  if (!pegawai) {
    pegawai = await prisma.pegawai.create({
      data: {
        user_id: user.id,
        nama_lengkap: "Ust. Ikhwan",
        jenis_kelamin: "L",
        email,
        kategori_pegawai: "ASATIDZ",
        jabatan: "Musyrif Halaqoh (Pengabdian)",
      },
    });
    console.log("✅ Created Pegawai record for Ust. Ikhwan:", pegawai.id);
  } else {
    pegawai = await prisma.pegawai.update({
      where: { id: pegawai.id },
      data: { user_id: user.id, email },
    });
    console.log("ℹ️ Updated Pegawai record for Ust. Ikhwan:", pegawai.id);
  }

  // 3. Link pegawai_id on halaqoh_kelompok for Ust. Ikhwan
  const updatedKelompok = await prisma.halaqohKelompok.updateMany({
    where: { nama_kelompok: { contains: "Ikhwan", mode: "insensitive" } },
    data: { pegawai_id: pegawai.id },
  });

  console.log(`✅ Updated ${updatedKelompok.count} halaqoh kelompok entries to point to Ust. Ikhwan (Pegawai ID: ${pegawai.id})!`);
}

main()
  .catch((e) => {
    console.error("Error creating Ust. Ikhwan:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
