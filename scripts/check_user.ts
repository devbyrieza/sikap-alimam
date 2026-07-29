import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({ 
    where: { email: 'riezaekatomara@gmail.com' },
    include: { pegawai: { select: { id: true } } }
  });
  console.log(user);
}
main().finally(() => prisma.$disconnect());
