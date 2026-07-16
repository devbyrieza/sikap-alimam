const { execSync } = require('child_process');

console.log('Running prisma db push with overridden DIRECT_URL...');
// Overwrite DIRECT_URL with DATABASE_URL to avoid authentication errors 
// if DIRECT_URL is pointing to a stale IP in Coolify.
process.env.DIRECT_URL = process.env.DATABASE_URL;

try {
  execSync('npx prisma db push --accept-data-loss --skip-generate', { stdio: 'inherit', env: process.env });
  console.log('Prisma db push successful.');
} catch (error) {
  // PENTING: Jangan matikan container jika db push gagal.
  // Server tetap berjalan agar bisa debug via logs.
  // DB push bisa gagal karena koneksi lambat saat startup — biasanya schema sudah sinkron.
  console.error('⚠️  Prisma db push failed — server will still start.');
  console.error('    Check DATABASE_URL and DB connectivity if schema is out of sync.');
}
