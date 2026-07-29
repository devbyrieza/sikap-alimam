import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://coolify:FfJ8to6XLZ1LooULnKW7ULXDbIfQn3KxMUPAUXz15Q0=@72.61.141.50:5432/ppdb_alimam'
});

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'riezaekatomara@gmail.com' },
    include: { pegawai: { select: { id: true } } }
  });
  console.log('User found:', !!user);
  if (user) {
    console.log('Is Active:', user.is_active);
    const valid = await bcrypt.compare('alimam2026', user.password);
    console.log('Password valid:', valid);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
