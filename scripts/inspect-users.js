const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const pegawais = await prisma.pegawai.findMany({
    orderBy: { created_at: 'asc' }
  });
  console.log('=== TOTAL PEGAWAI / CIVITAS (' + pegawais.length + ') ===');
  pegawais.forEach((p, idx) => {
    console.log(`${idx + 1}. [${p.kategori_pegawai}] ${p.nama_lengkap} | NIK: ${p.nik || '-'} | Email: ${p.email || '-'} | HP: ${p.no_hp || '-'} | UserID: ${p.user_id || '-'}`);
  });

  const users = await prisma.user.findMany({
    orderBy: { created_at: 'asc' }
  });
  console.log('\n=== TOTAL USERS SIKAP (' + users.length + ') ===');
  users.forEach((u, idx) => {
    console.log(`${idx + 1}. [${u.role}] ${u.nama} | Email: ${u.email} | Active: ${u.is_active}`);
  });

  try {
    const profiles = await prisma.profile.findMany({
      orderBy: { created_at: 'asc' }
    });
    console.log('\n=== TOTAL PROFILES SIMPEG / PPDB (' + profiles.length + ') ===');
    profiles.forEach((pr, idx) => {
      console.log(`${idx + 1}. [${pr.role}] sec: ${JSON.stringify(pr.secondary_roles)} | ${pr.full_name} | Email: ${pr.email || '-'} | Phone: ${pr.phone}`);
    });
  } catch (e) {
    console.log('Profile error:', e.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
