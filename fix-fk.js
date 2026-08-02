const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.$executeRawUnsafe('UPDATE pegawai SET user_id = NULL');
  console.log('Cleared user_id');
}
run().catch(console.error);
