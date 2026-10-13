import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const DATA_SANTRI_48 = [
  {
    nis: "2601070001",
    nama: "Abdul Aziz Ali",
    tanggal_lahir_iso: "2013-11-05",
    password: "05-11-2013"
  },
  {
    nis: "2601070002",
    nama: "Abdul Hakim",
    tanggal_lahir_iso: "2012-10-12",
    password: "12-10-2012"
  },
  {
    nis: "2601070003",
    nama: "Ahmad Farros Al Barqy",
    tanggal_lahir_iso: "2014-06-07",
    password: "07-06-2014"
  },
  {
    nis: "2601070016",
    nama: "Andi Ibra Faeyza Hasan Alnasr",
    tanggal_lahir_iso: "2013-03-25",
    password: "25-03-2013"
  },
  {
    nis: "2601070004",
    nama: "Atqanul Ummah Ahmad",
    tanggal_lahir_iso: "2014-06-14",
    password: "14-06-2014"
  },
  {
    nis: "2601070005",
    nama: "Azka Panji Kusuma",
    tanggal_lahir_iso: "2011-09-01",
    password: "01-09-2011"
  },
  {
    nis: "2601070006",
    nama: "Fariq Malaibui",
    tanggal_lahir_iso: "2012-03-15",
    password: "15-03-2012"
  },
  {
    nis: "2601070007",
    nama: "Haidar Ayyubi",
    tanggal_lahir_iso: "2014-05-10",
    password: "10-05-2014"
  },
  {
    nis: "2601070017",
    nama: "Khalish",
    tanggal_lahir_iso: "2012-12-06",
    password: "06-12-2012"
  },
  {
    nis: "2601070008",
    nama: "Labibullah El Fatih",
    tanggal_lahir_iso: "2013-12-11",
    password: "11-12-2013"
  },
  {
    nis: "2601070009",
    nama: "M Fazril Alkais",
    tanggal_lahir_iso: "2012-04-12",
    password: "12-04-2012"
  },
  {
    nis: "2601070010",
    nama: "Muh Asrorin Da Silva",
    tanggal_lahir_iso: "2013-11-24",
    password: "24-11-2013"
  },
  {
    nis: "2601070011",
    nama: "Muhammad Azzam Al Hafiz",
    tanggal_lahir_iso: "2014-03-07",
    password: "07-03-2014"
  },
  {
    nis: "2601070012",
    nama: "Muhammad Hafidz Reo Afelano",
    tanggal_lahir_iso: "2013-11-18",
    password: "18-11-2013"
  },
  {
    nis: "2601070013",
    nama: "Muhammad Rifqi Hamid",
    tanggal_lahir_iso: "2013-08-16",
    password: "16-08-2013"
  },
  {
    nis: "2601070014",
    nama: "Muhammad Yahya Ayyash",
    tanggal_lahir_iso: "2013-09-25",
    password: "25-09-2013"
  },
  {
    nis: "2601070015",
    nama: "Naufal Dzakiy Purnama",
    tanggal_lahir_iso: "2013-03-31",
    password: "31-03-2013"
  },
  {
    nis: "2602070015",
    nama: "Abdullah Rasyid",
    tanggal_lahir_iso: "2010-12-12",
    password: "12-12-2010"
  },
  {
    nis: "2602070001",
    nama: "Abdurrahim Pati Raja",
    tanggal_lahir_iso: "2011-09-12",
    password: "12-09-2011"
  },
  {
    nis: "2602070002",
    nama: "Daffa Muammar Dzaki",
    tanggal_lahir_iso: "2010-07-01",
    password: "01-07-2010"
  },
  {
    nis: "2602070003",
    nama: "Fanni Hariri Hamonangan",
    tanggal_lahir_iso: "2010-03-23",
    password: "23-03-2010"
  },
  {
    nis: "2602070004",
    nama: "Farid",
    tanggal_lahir_iso: "2010-10-12",
    password: "12-10-2010"
  },
  {
    nis: "2602070005",
    nama: "Favian Radi",
    tanggal_lahir_iso: "2010-10-29",
    password: "29-10-2010"
  },
  {
    nis: "2602070016",
    nama: "Fiqri Ramdan Handoko",
    tanggal_lahir_iso: "2011-08-21",
    password: "21-08-2011"
  },
  {
    nis: "2602070006",
    nama: "Hibban Hibaturrahman",
    tanggal_lahir_iso: "2010-09-20",
    password: "20-09-2010"
  },
  {
    nis: "2602070007",
    nama: "Ken Alfarezha Haryadi",
    tanggal_lahir_iso: "2011-03-27",
    password: "27-03-2011"
  },
  {
    nis: "2602070008",
    nama: "Khubaib Abdul Aziz",
    tanggal_lahir_iso: "2011-07-10",
    password: "10-07-2011"
  },
  {
    nis: "2602070009",
    nama: "Lalu Muhamad Rizky Ananda",
    tanggal_lahir_iso: "2011-01-18",
    password: "18-01-2011"
  },
  {
    nis: "2602070010",
    nama: "Miizan Alghifary Dizlilar",
    tanggal_lahir_iso: "2011-08-11",
    password: "11-08-2011"
  },
  {
    nis: "2602070011",
    nama: "Muhammad Rasyid Ridho",
    tanggal_lahir_iso: "2010-08-27",
    password: "27-08-2010"
  },
  {
    nis: "2602070012",
    nama: "Muhammad Rizky",
    tanggal_lahir_iso: "2011-02-26",
    password: "26-02-2011"
  },
  {
    nis: "2602070017",
    nama: "Nurcahya Eka Putra",
    tanggal_lahir_iso: "2007-02-06",
    password: "06-02-2007"
  },
  {
    nis: "2602070018",
    nama: "Panji Ahmad",
    tanggal_lahir_iso: "2010-12-12",
    password: "12-12-2010"
  },
  {
    nis: "2602070019",
    nama: "Wahyu Hidayat",
    tanggal_lahir_iso: "2011-06-29",
    password: "29-06-2011"
  },
  {
    nis: "2601070018",
    nama: "M Naufal Alfaniri",
    tanggal_lahir_iso: "2013-05-16",
    password: "16-05-2013"
  },
  {
    nis: "2601070019",
    nama: "Rifqi Arsyad Fadilah",
    tanggal_lahir_iso: "2013-06-10",
    password: "10-06-2013"
  },
  {
    nis: "2602070020",
    nama: "Muhammad Khoirul Azzam",
    tanggal_lahir_iso: "2009-12-18",
    password: "18-12-2009"
  },
  {
    nis: "2602070021",
    nama: "Muhammad Hafidz Abdurrahman",
    tanggal_lahir_iso: "2011-04-15",
    password: "15-04-2011"
  },
  {
    nis: "2602070022",
    nama: "Syeh Al Bani Irsyad Amrulloh",
    tanggal_lahir_iso: "2009-10-08",
    password: "08-10-2009"
  },
  {
    nis: "2602070023",
    nama: "Iman Prayogo",
    tanggal_lahir_iso: "2012-08-24",
    password: "24-08-2012"
  },
  {
    nis: "121232020034222003",
    nama: "Pandi Rianto",
    tanggal_lahir_iso: "2009-09-17",
    password: "17-09-2009"
  },
  {
    nis: "510032020813211029",
    nama: "Muhammad Abdul Rahman",
    tanggal_lahir_iso: "2008-11-23",
    password: "23-11-2008"
  },
  {
    nis: "510032020813211030",
    nama: "Muhammad Abdul Rahim",
    tanggal_lahir_iso: "2008-11-23",
    password: "23-11-2008"
  },
  {
    nis: "121232020034221005",
    nama: "Salman Abdulrahim Uran",
    tanggal_lahir_iso: "2009-09-17",
    password: "17-09-2009"
  },
  {
    nis: "131232020011241006",
    nama: "Yasser Ali Nurdin",
    tanggal_lahir_iso: "2008-01-06",
    password: "06-01-2008"
  },
  {
    nis: "510032020813211031",
    nama: "Syafiq Karimalai",
    tanggal_lahir_iso: "2009-02-11",
    password: "11-02-2009"
  },
  {
    nis: "131232020011241007",
    nama: "Radil",
    tanggal_lahir_iso: "2009-12-12",
    password: "12-12-2009"
  },
  {
    nis: "131232020011222010",
    nama: "Dicky Dwy AP",
    tanggal_lahir_iso: "2007-04-11",
    password: "11-04-2007"
  }
];

export async function GET(req: NextRequest) {
  try {
    const results = [];

    for (const item of DATA_SANTRI_48) {
      // 1. Cari santri berdasarkan NIS atau nama
      let santri = await prisma.santriAktif.findFirst({
        where: {
          OR: [
            { nis: item.nis },
            { nama_lengkap: { equals: item.nama, mode: "insensitive" } }
          ]
        },
        include: {
          orang_tua: {
            include: { user: true }
          }
        }
      });

      if (!santri) {
        results.push({ nis: item.nis, nama: item.nama, status: "santri_not_found" });
        continue;
      }

      // 2. Update tanggal_lahir di SantriAktif
      const birthDate = new Date(`${item.tanggal_lahir_iso}T00:00:00.000Z`);
      await prisma.santriAktif.update({
        where: { id: santri.id },
        data: {
          tanggal_lahir: birthDate,
          nis: item.nis // Pastikan NIS juga sinkron
        }
      });

      // 3. Hash password (format: DD-MM-YYYY)
      const hashedPassword = await bcrypt.hash(item.password, 10);

      // 4. Pastikan Akun User Wali Santri Unik per NIS
      const username = item.nis;
      const email = `wali_${item.nis}@pesantren-alimam.com`;

      let waliUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: username },
            { email: email }
          ]
        }
      });

      if (waliUser) {
        waliUser = await prisma.user.update({
          where: { id: waliUser.id },
          data: {
            username: username,
            email: email,
            password: hashedPassword,
            plain_password: item.password,
            nama: `Wali dari ${santri.nama_lengkap}`,
            role: "WALI_SANTRI",
            is_active: true,
            must_change_password: false,
            spp_access_blocked: false,
            spp_blocked_reason: null
          }
        });
      } else {
        waliUser = await prisma.user.create({
          data: {
            username: username,
            email: email,
            password: hashedPassword,
            plain_password: item.password,
            nama: `Wali dari ${santri.nama_lengkap}`,
            role: "WALI_SANTRI",
            is_active: true,
            must_change_password: false,
            spp_access_blocked: false,
            spp_blocked_reason: null
          }
        });
      }

      // 5. Bersihkan dan tautkan OrangTuaSantri secara tepat (1:1 ke santri ini)
      await prisma.orangTuaSantri.deleteMany({
        where: { santri_id: santri.id }
      });

      await prisma.orangTuaSantri.create({
        data: {
          user_id: waliUser.id,
          santri_id: santri.id
        }
      });

      results.push({
        nis: item.nis,
        nama: santri.nama_lengkap,
        password: item.password,
        status: "wali_user_synced_clean"
      });
    }

    return NextResponse.json({
      success: true,
      message: "Sinkronisasi tanggal lahir dan password wali santri berhasil!",
      total_data: DATA_SANTRI_48.length,
      processed: results.length,
      results
    });
  } catch (err: any) {
    console.error("Error sync-wali-passwords:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
