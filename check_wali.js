const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const wali = await prisma.user.findMany({ where: { role: 'WALI_SANTRI' }, include: { orang_tua: { include: { santri: true } } } });
  console.log(wali.map(w => ({
    username: w.username,
    nis: w.orang_tua[0]?.santri?.nis
  })));
}
main().finally(() => prisma.$disconnect());
