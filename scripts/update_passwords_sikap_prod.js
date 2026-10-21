const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PAAS_HASH = "$2b$10$UgKo93SQxiXg46WYmKFrlu1WgxBjvpw8wAFiDCwJs7lYco53nuSOi";
const WAHAB_HASH = "$2b$10$oPJmtU2BD2tOWau530SaDe.TvPGbL2GFXU01sJJu5xF8.99/HAMky";

async function main() {
  console.log("=== UPDATING PASSWORDS IN PROD SIKAP-ALIMAM ===");

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
          password: WAHAB_HASH,
          plain_password: "2026#@",
          must_change_password: true,
        }
      });
      console.log(`[WAHAB] ${u.nama} (@${u.username}) -> 2026#@`);
    } else {
      await prisma.user.update({
        where: { id: u.id },
        data: {
          password: PAAS_HASH,
          plain_password: "Paas2026!",
          must_change_password: true,
        }
      });
    }
  }

  console.log(`✅ Updated all ${allUsers.length} users in sikap-alimam!`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
