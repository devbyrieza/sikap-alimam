const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const ust = await prisma.pegawai.findMany({
    where: { OR: [
      { nama_lengkap: { contains: 'Wahyudi', mode: 'insensitive' } },
      { nama_lengkap: { contains: 'Zeidhan', mode: 'insensitive' } },
      { nama_lengkap: { contains: 'Agus Cohyono', mode: 'insensitive' } },
      { nama_lengkap: { contains: 'Azzam', mode: 'insensitive' } },
      { nama_lengkap: { contains: 'Iqbal', mode: 'insensitive' } }
    ]}
  });
  console.log(ust.map(u => ({ id: u.id, nama: u.nama_lengkap })));
  
  const santriList = [
    'Rasyid', 'Andi Ibra Faeyza', 'Abdurrahman Pati Raja', 'Fiqri', 'Nurcahya Eka Putra', 'Dicky', 'Radil',
    'Muhammad Rizki', 'Azka Panji', 'Abdullah Rasyid', 'Muhammad Hafizh Reo', 'Naufal Dzakiy', 'Pandi',
    'Panji Ahmad', 'Mizan', 'Fariq Malaibui', 'Labibullah', 'Daffa Muhammad', 'Muhammad Fazril', 'Muhammad Hafizh', 'Iman', 'Salman', 'Wahyu', 'Khairul Azzam', 'Khubaib',
    'Abdul Aziz', 'Abdul Hakim', 'Atqonul Ummah', 'Haidar', 'Farid', 'Rifqi Arsyad', 'Muhammad Azzam', 'Ahmad Farros', 'Yaseer', 'Ken Alfareza', 'Yahya Ayyash', 'Lalu',
    'Khalish', 'Muhammad Rifqi Hamid', 'Syeh Al Bani', 'Hariri', 'Favian', 'Hibban', 'Naufal Al fariri', 'Muhammad Asrorin', 'Rahim', 'Syafiq', 'Rahman'
  ];
  const santri = await prisma.santriAktif.findMany({
    where: { is_active: true }
  });
  console.log('Santri Count:', santri.length);
  
  // Fuzzy match santri
  const matched = [];
  const missing = [];
  santriList.forEach(name => {
     if(!name) return;
     const cleanName = name.replace('Khairul+C8:F28', 'Khairul').trim().toLowerCase();
     const found = santri.find(s => s.nama_lengkap.toLowerCase().includes(cleanName));
     if(found) matched.push({ excel: name, db: found.nama_lengkap, id: found.id });
     else {
        // try partial match on first word
        const firstWord = cleanName.split(' ')[0];
        const partial = santri.find(s => s.nama_lengkap.toLowerCase().includes(firstWord));
        if (partial) matched.push({ excel: name, db: partial.nama_lengkap, id: partial.id });
        else missing.push(name);
     }
  });
  
  console.log('Missing:', missing);
  console.log('Matched:', matched.length);
  
  require('fs').writeFileSync('import_report.json', JSON.stringify({ ust, matched, missing }, null, 2));
}
run().finally(() => prisma.$disconnect());
