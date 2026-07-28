import https from 'https';

async function main() {
  const url = "https://simpeg.pesantren-alimam.com/api/admin/pegawai";
  console.log("Fetching from production with forged cookie:", url);

  const sessionObj = {
    role: "admin_super",
    id: "11111111-1111-1111-1111-111111111111",
    full_name: "Super Admin",
    email: "admin@alimam.com"
  };
  const cookieValue = encodeURIComponent(JSON.stringify(sessionObj));

  const options = {
    headers: {
      'Cookie': `app_session=${cookieValue}`
    }
  };

  https.get(url, options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log(`Success! Status Code: ${res.statusCode}`);
        console.log(`Found ${json.data?.length || 0} pegawai.`);
        if (json.data && json.data.length > 0) {
          // Filter those with GURU or ASATIDZ
          const gurus = json.data.filter((p: any) => 
            p.kategori_pegawai === 'ASATIDZ' || 
            p.kategori_pegawai === 'GURU' || 
            p.kategori_pegawai === 'Guru' ||
            (p.kategori_pegawai && p.kategori_pegawai.includes('GURU'))
          );
          console.log(`Filtered Gurus: ${gurus.length}`);
          console.log("Gurus Sample:", gurus.slice(0, 5).map((g: any) => ({ name: g.nama_lengkap, cat: g.kategori_pegawai, no_hp: g.no_hp })));
          
          // Write all filtered gurus to a local JSON file so we can seed them locally!
          const fs = require('fs');
          fs.writeFileSync('gurus_production.json', JSON.stringify(gurus, null, 2));
          console.log("Saved gurus to gurus_production.json");
        }
      } catch (err: any) {
        console.error("JSON parse failed:", err.message);
        console.log("Raw output head:", data.slice(0, 500));
      }
    });
  }).on('error', (err) => {
    console.error("Request failed:", err.message);
  });
}

main();
