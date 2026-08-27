const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    take: 10,
    select: { email: true, username: true, plain_password: true, role: true }
  });
  console.log(users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
