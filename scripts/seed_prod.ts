import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = 'alimam2026';

async function run() {
  try {
    console.log("Memulai proses seeding...");
    
    // 1. Get existing Kelas IDs
    const kelasMTs = await prisma.kelas.findFirst({ where: { nama: '7 MTs' } });
    const kelasIL = await prisma.kelas.findFirst({ where: { nama: 'I\'dad Lughowy' } });
    
    if (!kelasMTs || !kelasIL) {
      throw new Error("Data Kelas (7 MTs atau I'dad Lughowy) tidak ditemukan di database.");
    }
    console.log(`ID Kelas MTs: ${kelasMTs.id}`);
    console.log(`ID Kelas IL: ${kelasIL.id}`);
    
    // 2. Read Excel
    const filePath = 'C:\\Users\\itpua\\Dev\\Work\\al-andalus\\alandalus-alimam\\Data_Monitoring_PPDB_AlImam_Final_V8.xlsx';
    const workbook = XLSX.readFile(filePath);
    let santriAdded = 0;
    
    // Process MTs
    const mtsData = XLSX.utils.sheet_to_json<any>(workbook.Sheets['Data MTs'], { header: 1 });
    // Rows start from index 3 (4th row)
    for (let i = 3; i < mtsData.length; i++) {
      const row = mtsData[i];
      if (!row || row.length === 0) continue;
      
      const nis = String(row[1] || '').trim();
      const nama = row[3];
      const jk = row[5] === 'L' ? 'L' : 'P';
      const status = row[7];
      
      if (status === 'Diterima' && nama) {
        await prisma.santriAktif.upsert({
          where: { nis: nis || `temp-nis-${i}-mts` },
          update: { nama_lengkap: nama, jenis_kelamin: jk },
          create: {
            nis: nis || null,
            nama_lengkap: nama,
            jenis_kelamin: jk,
            kelas_id: kelasMTs.id,
          }
        });
        santriAdded++;
      }
    }
    
    // Process IL
    const ilData = XLSX.utils.sheet_to_json<any>(workbook.Sheets['Data IL'], { header: 1 });
    for (let i = 3; i < ilData.length; i++) {
      const row = ilData[i];
      if (!row || row.length === 0) continue;
      
      const nis = String(row[1] || '').trim();
      const nama = row[3];
      const jk = row[5] === 'L' ? 'L' : 'P';
      const status = row[7];
      
      if (status === 'Diterima' && nama) {
        await prisma.santriAktif.upsert({
          where: { nis: nis || `temp-nis-${i}-il` },
          update: { nama_lengkap: nama, jenis_kelamin: jk },
          create: {
            nis: nis || null,
            nama_lengkap: nama,
            jenis_kelamin: jk,
            kelas_id: kelasIL.id,
          }
        });
        santriAdded++;
      }
    }
    
    console.log(`Berhasil memasukkan/update ${santriAdded} Santri Aktif.`);
    
    // 3. Process Pegawai -> Users
    const pegawaiList = await prisma.pegawai.findMany();
    console.log(`Ditemukan ${pegawaiList.length} data Pegawai/Guru.`);
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    let usersAdded = 0;
    
    let csvOutput = "Nama Lengkap,Email/Username,Password,Role\n";
    
    for (const p of pegawaiList) {
      if (!p.user_id) {
        // Generate email if not exists
        let email = p.email;
        if (!email) {
          const firstWord = p.nama_lengkap.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
          email = `${firstWord}@alimam.sch.id`;
        }
        
        // Ensure email is unique
        let userExists = await prisma.user.findUnique({ where: { email } });
        let suffix = 1;
        while (userExists) {
          const firstWord = p.nama_lengkap.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
          email = `${firstWord}${suffix}@alimam.sch.id`;
          userExists = await prisma.user.findUnique({ where: { email } });
          suffix++;
        }
        
        const user = await prisma.user.create({
          data: {
            email: email,
            password: hashedPassword,
            nama: p.nama_lengkap,
            role: 'GURU', // Default role
          }
        });
        
        await prisma.pegawai.update({
          where: { id: p.id },
          data: { user_id: user.id }
        });
        
        usersAdded++;
        csvOutput += `${p.nama_lengkap},${email},${DEFAULT_PASSWORD},GURU\n`;
      } else {
        // Just note they already have an account
        const user = await prisma.user.findUnique({ where: { id: p.user_id } });
        if (user) {
          csvOutput += `${p.nama_lengkap},${user.email},[Password Tersimpan],${user.role}\n`;
        }
      }
    }
    
    console.log(`Berhasil membuat ${usersAdded} Akun User baru.`);
    
    // 4. Output CSV
    const csvPath = 'C:\\Users\\itpua\\Dev\\Work\\al-andalus\\Akun_Guru_SIKAP.csv';
    fs.writeFileSync(csvPath, csvOutput);
    console.log(`File CSV kredensial guru berhasil disimpan di: ${csvPath}`);
    
    console.log("SELESAI. Semua data sudah ready!");
    
  } catch (error) {
    console.error("Terjadi kesalahan:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
