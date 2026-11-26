import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isWaliKelasSession } from "@/lib/waliAccess";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId || !isWaliKelasSession(session)) {
      return NextResponse.json({ success: false, error: "Forbidden: Khusus Wali Kelas / Admin" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const kelasId = searchParams.get("kelas_id");
    const semester = searchParams.get("semester") || "Ganjil";
    const tahunAjaran = searchParams.get("tahun_ajaran") || "2026/2027";

    const kelasList = await prisma.kelas.findMany({
      where: { is_active: true },
      orderBy: { nama: "asc" },
      select: { id: true, nama: true, jenjang: true, wali_kelas_id: true },
    });

    const targetKelasId = kelasId || kelasList[0]?.id || "";
    if (!targetKelasId) {
      return NextResponse.json({ success: true, kelasList: [], santriList: [] });
    }

    const santriRows = await prisma.santriAktif.findMany({
      where: { is_active: true, kelas_id: targetKelasId },
      orderBy: { nama_lengkap: "asc" },
      include: {
        penilaian_wali_kelas: {
          where: { semester, tahun_ajaran: tahunAjaran },
        },
        ekskul: {
          where: { semester, tahun_ajaran: tahunAjaran },
          orderBy: { nama_ekskul: "asc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      kelasList,
      selectedKelasId: targetKelasId,
      santriList: santriRows.map((s) => ({
        id: s.id,
        nama: s.nama_lengkap,
        nis: s.nis,
        penilaian: s.penilaian_wali_kelas[0] || null,
        ekskul: s.ekskul,
      })),
    });
  } catch (error) {
    console.error("GET /api/wali-kelas/penilaian error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat data wali kelas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId || !isWaliKelasSession(session)) {
      return NextResponse.json({ success: false, error: "Forbidden: Khusus Wali Kelas / Admin" }, { status: 403 });
    }

    const body = await req.json();
    const {
      santri_id,
      semester = "Ganjil",
      tahun_ajaran = "2026/2027",
      nilai_sikap,
      skor_sikap,
      nilai_kedisiplinan,
      skor_kedisiplinan,
      catatan_wali_kelas,
      ekskulList,
    } = body;

    if (!santri_id || !nilai_sikap || !nilai_kedisiplinan) {
      return NextResponse.json(
        { success: false, error: "Santri, nilai sikap, dan nilai kedisiplinan wajib diisi." },
        { status: 400 }
      );
    }

    const pegawai = await prisma.pegawai.findFirst({
      where: { user_id: session.userId },
      select: { id: true },
    });

    const penilaian = await prisma.penilaianWaliKelas.upsert({
      where: {
        santri_id_semester_tahun_ajaran: {
          santri_id,
          semester,
          tahun_ajaran,
        },
      },
      update: {
        pegawai_id: pegawai?.id || null,
        nilai_sikap,
        skor_sikap: skor_sikap !== undefined && skor_sikap !== "" ? Number(skor_sikap) : null,
        nilai_kedisiplinan,
        skor_kedisiplinan:
          skor_kedisiplinan !== undefined && skor_kedisiplinan !== "" ? Number(skor_kedisiplinan) : null,
        catatan_wali_kelas: catatan_wali_kelas || null,
      },
      create: {
        santri_id,
        pegawai_id: pegawai?.id || null,
        semester,
        tahun_ajaran,
        nilai_sikap,
        skor_sikap: skor_sikap !== undefined && skor_sikap !== "" ? Number(skor_sikap) : null,
        nilai_kedisiplinan,
        skor_kedisiplinan:
          skor_kedisiplinan !== undefined && skor_kedisiplinan !== "" ? Number(skor_kedisiplinan) : null,
        catatan_wali_kelas: catatan_wali_kelas || null,
      },
    });

    if (Array.isArray(ekskulList)) {
      await prisma.ekskulSantri.deleteMany({
        where: { santri_id, semester, tahun_ajaran },
      });

      const validEkskul = ekskulList.filter(
        (e: { nama_ekskul?: string; nilai?: string }) => e.nama_ekskul?.trim() && e.nilai?.trim()
      );
      if (validEkskul.length > 0) {
        await prisma.ekskulSantri.createMany({
          data: validEkskul.map(
            (e: { nama_ekskul: string; nilai: string; nilai_angka?: number | string; keterangan?: string }) => ({
              santri_id,
              pegawai_id: pegawai?.id || null,
              semester,
              tahun_ajaran,
              nama_ekskul: e.nama_ekskul.trim(),
              nilai: String(e.nilai).trim(),
              nilai_angka:
                e.nilai_angka !== undefined && e.nilai_angka !== "" ? Number(e.nilai_angka) : null,
              keterangan: e.keterangan?.trim() || null,
            })
          ),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Penilaian wali kelas & ekskul berhasil disimpan",
      data: penilaian,
    });
  } catch (error) {
    console.error("POST /api/wali-kelas/penilaian error:", error);
    return NextResponse.json({ success: false, error: "Gagal menyimpan penilaian wali kelas" }, { status: 500 });
  }
}
