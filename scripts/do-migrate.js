const fs = require('fs');

async function migrate() {
  console.log("Fetching from SIMPEG...");
  const res = await fetch("https://simpeg.pesantren-alimam.com/api/export-semua");
  const data = await res.json();
  
  if (data.error) {
    console.error("Error from SIMPEG:", data.error);
    return;
  }

  console.log(`Got ${data.pegawai.length} pegawai and ${data.users.length} users.`);
  
  console.log("Pushing to SIKAP...");
  const res2 = await fetch("https://sikap.pesantren-alimam.com/api/debug-db/import-semua", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  
  const result = await res2.json();
  console.log("Result from SIKAP:", result);
}

migrate();
