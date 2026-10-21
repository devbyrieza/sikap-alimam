const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log("=== UPDATING PASSWORDS IN SIKAP-ALIMAM ===");
  const hashPaas = await bcrypt.hash("Paas2026!", 10);
  const hashWahab = await bcrypt.hash("2026#@", 10);

  const allUsers = await prisma.user.findMany();
  console.log(`Total users found: ${allUsers.length}`);

  for (const u of allUsers) {
    const isWahab =
      u.username === "wahabrajasam" ||
      u.username === "wahab" ||
      (u.nama && u.nama.toLowerCase().includes("wahab rajasam")) ||
      u.email === "wahab@pesantren-alimam.com" ||
      u.email === "mudir@pesantren-alandalus.com";

    if (isWahab) {
      await prisma.user.update({
        where: { id: u.id },
        data: {
          username: "wahabrajasam",
          password: hashWahab,
          plain_password: "2026#@",
          must_change_password: true,
        }
      });
      console.log(`[WAHAB] ${u.nama} (@wahabrajasam) -> 2026#@`);
    } else {
      await prisma.user.update({
        where: { id: u.id },
        data: {
          password: hashPaas,
          plain_password: "Paas2026!",
          must_change_password: true,
        }
      });
      console.log(`[USER] ${u.nama} (@${u.username || '-'}) -> Paas2026!`);
    }
  }

  // Verification
  const verifyAll = await prisma.user.findMany({
    select: { id: true, nama: true, username: true, role: true, plain_password: true }
  });
  console.log("\n--- VERIFICATION SIKAP AL-IMAM ---");
  verifyAll.forEach(u => console.log(`[${u.role}] ${u.nama} (@${u.username || '-'}) => ${u.plain_password}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
