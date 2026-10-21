const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      nama: true,
      role: true,
      plain_password: true,
      must_change_password: true
    }
  });
  console.log(`=== SIKAP AL-IMAM USERS (${users.length}) ===`);
  users.forEach(u => {
    console.log(`[${u.role}] ${u.nama} | user: ${u.username || '-'} | email: ${u.email} | plain_pass: ${u.plain_password || '-'}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
