import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    const logs = [];
    
    // 1. Jalankan Prisma DB Push
    try {
      logs.push("Running prisma db push...");
      const pushOutput = execSync('npx prisma db push --accept-data-loss', { encoding: 'utf8' });
      logs.push(pushOutput);
    } catch (e: any) {
      logs.push("Error di db push: " + e.message);
      if (e.stdout) logs.push(e.stdout.toString());
      if (e.stderr) logs.push(e.stderr.toString());
    }

    // 3. Jalankan TS Seed untuk membuat User Admin & Guru
    try {
      logs.push("\nRunning TS Seed (Membuat akun Admin & Guru)...");
      const tsSeedOutput = execSync('npm run seed', { encoding: 'utf8' });
      logs.push(tsSeedOutput);
    } catch (e: any) {
      logs.push("Error di TS Seed: " + e.message);
      if (e.stdout) logs.push(e.stdout.toString());
      if (e.stderr) logs.push(e.stderr.toString());
    }

    return NextResponse.json({
      success: true,
      message: "Proses setup database telah dijalankan. Cek logs di bawah.",
      logs: logs.join('\n')
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
