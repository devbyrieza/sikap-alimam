import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nis = searchParams.get("nis") || "2601070001";

    const santri = await prisma.santriAktif.findFirst({
      where: {
        OR: [{ nis: nis }, { nisn: nis }]
      },
      include: {
        orang_tua: {
          include: {
            user: true
          }
        }
      }
    });

    const userByUsername = await prisma.user.findFirst({
      where: { username: nis }
    });

    const allUsersLikeNis = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: nis } },
          { email: { contains: nis } },
          { nama: { contains: "Abdul Aziz" } }
        ]
      }
    });

    return NextResponse.json({
      santri: {
        id: santri?.id,
        nis: santri?.nis,
        nama: santri?.nama_lengkap,
        tanggal_lahir: santri?.tanggal_lahir,
        orang_tua_count: santri?.orang_tua.length,
        orang_tua: santri?.orang_tua.map(ot => ({
          user_id: ot.user_id,
          user: ot.user ? {
            id: ot.user.id,
            username: ot.user.username,
            email: ot.user.email,
            plain_password: ot.user.plain_password,
            has_password: !!ot.user.password
          } : null
        }))
      },
      userByUsername: userByUsername ? {
        id: userByUsername.id,
        username: userByUsername.username,
        email: userByUsername.email,
        plain_password: userByUsername.plain_password,
        role: userByUsername.role
      } : null,
      allUsersLikeNis: allUsersLikeNis.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        plain_password: u.plain_password,
        role: u.role
      }))
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
