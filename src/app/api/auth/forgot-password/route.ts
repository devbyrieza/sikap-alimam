import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/wablas";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { identifier } = await req.json();

    if (!identifier) {
      return NextResponse.json(
        { error: "NIP/NIK atau No WhatsApp wajib diisi" },
        { status: 400 }
      );
    }

    const ident = identifier.trim();

    // Cari user berdasarkan NIK/NIP atau No HP
    const pegawai = await prisma.pegawai.findFirst({
      where: {
        OR: [
          { nik: ident },
          { nip: ident },
          { no_hp: ident },
        ] },
      include: { user: true } });

    if (!pegawai || !pegawai.user) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan atau akun belum aktif" },
        { status: 404 }
      );
    }

    const user = pegawai.user;
    let targetPhone = pegawai.no_hp;

    if (!targetPhone) {
      return NextResponse.json(
        { error: "Akun ini tidak memiliki nomor WhatsApp yang terdaftar. Hubungi Admin." },
        { status: 400 }
      );
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 menit

    // Simpan ke DB
    await prisma.passwordResetToken.create({
      data: {
        user_id: user.id,
        token: token,
        expires_at: expiresAt } });

    // Kirim pesan WhatsApp
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://sikap.pesantren-alimam.com"}/reset-password?token=${token}`;
    
    const message = `*SIAKAD AL-IMAM*
Assalamu'alaikum wr. wb.

Kami menerima permintaan untuk mereset kata sandi akun SIAKAD Anda.
Nama: *${pegawai.nama_lengkap}*

Silakan klik tautan berikut untuk membuat kata sandi baru (berlaku 15 menit):
${resetUrl}

Jika Anda tidak merasa meminta reset kata sandi, abaikan pesan ini.

Terima kasih.`;

    const success = await sendWhatsAppMessage(targetPhone, message);

    if (!success) {
      return NextResponse.json(
        { error: "Gagal mengirim pesan WhatsApp. Pastikan nomor aktif atau hubungi admin." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tautan reset kata sandi telah dikirim ke WhatsApp Anda." });
  } catch (error: any) {
    console.error("[FORGOT_PASSWORD]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server", details: error.message },
      { status: 500 }
    );
  }
}
