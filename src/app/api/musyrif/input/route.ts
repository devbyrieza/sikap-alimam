import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isMusyrifOrKesehatanSession } from "@/lib/waliAccess";
import { isValidPengasuhanSkala, validateCatatanMusyrif } from "@/lib/pengasuhanRules";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId || !isMusyrifOrKesehatanSession(session)) {
      return NextResponse.json({ success: false, error: "Forbidden: Khusus Musyrif / Pengasuh / Kesehatan" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const santriId = searchParams.get("santri_id");
    const semester = searchParams.get("semester") || "Ganjil";
    const tahunAjaran = searchParams.get("tahun_ajaran") || "2026/2027";

    if (!santriId) {
      const [santriList, musyrifList] = await Promise.all([
        prisma.santriAktif.findMany({
          where: { is_active: true },
          include: {
            kelas: { select: { nama: true } },
            musyrif: { select: { id: true, nama_lengkap: true } },
            pengasuhan: { where: { semester, tahun_ajaran: tahunAjaran }, take: 1 },
            keaktifan_arab: { where: { semester, tahun_ajaran: tahunAjaran }, take: 1 },
            kesehatan: { orderBy: [{ tanggal: "desc" }], take: 1 },
            _count: { select: { pelanggaran: true } },
          },
          orderBy: { nama_lengkap: "asc" },
        }),
        prisma.pegawai.findMany({
          select: { id: true, nama_lengkap: true, jabatan: true },
          orderBy: { nama_lengkap: "asc" },
        }),
      ]);

      return NextResponse.json({
        success: true,
        santriList: santriList.map((s) => ({
          id: s.id,
          nama: s.nama_lengkap,
          nis: s.nis,
          kelas: s.kelas?.nama || "-",
          kamarAktif: s.kamar_aktif || "",
          musyrifId: s.musyrif_id || "",
          musyrifNama: s.musyrif?.nama_lengkap || "-",
          hasPengasuhan: s.pengasuhan.length > 0,
          arabPredikat: s.keaktifan_arab[0]?.predikat || null,
          hasKesehatan: s.kesehatan.length > 0,
          jumlahPelanggaran: s._count.pelanggaran,
        })),
        musyrifList,
      });
    }

    const [santri, pengasuhan, keaktifanArab, pelanggaran, kesehatan] = await Promise.all([
      prisma.santriAktif.findUnique({
        where: { id: santriId },
        include: { kelas: true, musyrif: { select: { id: true, nama_lengkap: true } } },
      }),
      prisma.pengasuhanSantri.findFirst({
        where: { santri_id: santriId, semester, tahun_ajaran: tahunAjaran },
      }),
      prisma.keaktifanArabSantri.findFirst({
        where: { santri_id: santriId, semester, tahun_ajaran: tahunAjaran },
      }),
      prisma.pelanggaranSantri.findMany({
        where: { santri_id: santriId },
        orderBy: [{ tanggal: "desc" }, { created_at: "desc" }],
      }),
      prisma.kesehatanSantri.findMany({
        where: { santri_id: santriId },
        orderBy: [{ tanggal: "desc" }, { created_at: "desc" }],
        take: 10,
      }),
    ]);

    if (!santri) {
      return NextResponse.json({ success: false, error: "Santri tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        santri: {
          id: santri.id,
          nama: santri.nama_lengkap,
          nis: santri.nis,
          kelas: santri.kelas?.nama || "-",
          kamarAktif: santri.kamar_aktif || "",
          musyrifId: santri.musyrif_id || "",
        },
        pengasuhan,
        keaktifanArab,
        pelanggaran,
        kesehatan,
      },
    });
  } catch (error) {
    console.error("GET /api/musyrif/input error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat data pengasuhan" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId || !isMusyrifOrKesehatanSession(session)) {
      return NextResponse.json({ success: false, error: "Forbidden: Khusus Musyrif / Pengasuh / Kesehatan" }, { status: 403 });
    }

    const body = await req.json();
    const { action, santri_id } = body;

    if (!santri_id) {
      return NextResponse.json({ success: false, error: "santri_id wajib diisi" }, { status: 400 });
    }

    const pegawai = await prisma.pegawai.findFirst({
      where: { user_id: session.userId },
      select: { id: true },
    });

    if (action === "pengasuhan") {
      const {
        semester = "Ganjil",
        tahun_ajaran = "2026/2027",
        kebersihan_diri_kamar,
        kerapian_diri_barang,
        kemandirian,
        kepatuhan_kedisiplinan,
        ibadah_akhlak,
        mentoring_mulahadzoh,
        catatan_musyrif,
        kamar_aktif,
        musyrif_id,
      } = body;

      const aspects = [
        kebersihan_diri_kamar,
        kerapian_diri_barang,
        kemandirian,
        kepatuhan_kedisiplinan,
        ibadah_akhlak,
        mentoring_mulahadzoh,
      ];
      if (!aspects.every(isValidPengasuhanSkala)) {
        return NextResponse.json(
          { success: false, error: "Seluruh 6 aspek pengasuhan wajib dipilih (Sangat Baik / Baik / Kurang)." },
          { status: 400 }
        );
      }

      const catatanCheck = validateCatatanMusyrif(catatan_musyrif);
      if (!catatanCheck.valid || !catatanCheck.normalized) {
        return NextResponse.json({ success: false, error: catatanCheck.error }, { status: 400 });
      }

      if (kamar_aktif !== undefined || musyrif_id !== undefined) {
        await prisma.santriAktif.update({
          where: { id: santri_id },
          data: {
            ...(kamar_aktif !== undefined ? { kamar_aktif: kamar_aktif || null } : {}),
            ...(musyrif_id !== undefined ? { musyrif_id: musyrif_id || null } : {}),
          },
        });
      }

      const saved = await prisma.pengasuhanSantri.upsert({
        where: {
          santri_id_semester_tahun_ajaran: { santri_id, semester, tahun_ajaran },
        },
        update: {
          pegawai_id: pegawai?.id || null,
          tanggal: new Date(),
          kebersihan_diri_kamar,
          kerapian_diri_barang,
          kemandirian,
          kepatuhan_kedisiplinan,
          ibadah_akhlak,
          mentoring_mulahadzoh,
          catatan_musyrif: catatanCheck.normalized,
        },
        create: {
          santri_id,
          pegawai_id: pegawai?.id || null,
          semester,
          tahun_ajaran,
          tanggal: new Date(),
          kebersihan_diri_kamar,
          kerapian_diri_barang,
          kemandirian,
          kepatuhan_kedisiplinan,
          ibadah_akhlak,
          mentoring_mulahadzoh,
          catatan_musyrif: catatanCheck.normalized,
        },
      });

      return NextResponse.json({ success: true, message: "Data pengasuhan berhasil disimpan", data: saved });
    }

    if (action === "arab") {
      const { semester = "Ganjil", tahun_ajaran = "2026/2027", predikat, catatan } = body;
      if (!["Baik", "Cukup", "Kurang"].includes(predikat)) {
        return NextResponse.json(
          { success: false, error: "Predikat keaktifan bahasa Arab harus Baik, Cukup, atau Kurang." },
          { status: 400 }
        );
      }

      const saved = await prisma.keaktifanArabSantri.upsert({
        where: {
          santri_id_semester_tahun_ajaran: { santri_id, semester, tahun_ajaran },
        },
        update: {
          pegawai_id: pegawai?.id || null,
          predikat,
          catatan: catatan || null,
          tanggal: new Date(),
        },
        create: {
          santri_id,
          pegawai_id: pegawai?.id || null,
          semester,
          tahun_ajaran,
          predikat,
          catatan: catatan || null,
          tanggal: new Date(),
        },
      });

      return NextResponse.json({ success: true, message: "Keaktifan bahasa Arab berhasil disimpan", data: saved });
    }

    if (action === "pelanggaran") {
      const { tanggal, pelanggaran, sanksi, kategori = "ringan" } = body;
      if (!pelanggaran?.trim() || !sanksi?.trim()) {
        return NextResponse.json(
          { success: false, error: "Pelanggaran dan sanksi wajib diisi." },
          { status: 400 }
        );
      }

      const saved = await prisma.pelanggaranSantri.create({
        data: {
          santri_id,
          pegawai_id: pegawai?.id || null,
          tanggal: tanggal ? new Date(tanggal) : new Date(),
          pelanggaran: pelanggaran.trim(),
          sanksi: sanksi.trim(),
          kategori,
        },
      });

      return NextResponse.json({ success: true, message: "Riwayat pelanggaran berhasil ditambahkan", data: saved });
    }

    if (action === "hapus_pelanggaran") {
      const { id } = body;
      if (!id) return NextResponse.json({ success: false, error: "id pelanggaran wajib diisi" }, { status: 400 });
      await prisma.pelanggaranSantri.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Pelanggaran berhasil dihapus" });
    }

    if (action === "kesehatan") {
      const {
        tanggal,
        tinggi_badan,
        berat_badan,
        riwayat_sakit,
        penilaian_rambut,
        penilaian_kuku,
        penilaian_telinga,
        penilaian_gigi,
        catatan_gizi_kesehatan,
      } = body;

      const saved = await prisma.kesehatanSantri.create({
        data: {
          santri_id,
          pegawai_id: pegawai?.id || null,
          tanggal: tanggal ? new Date(tanggal) : new Date(),
          tinggi_badan: tinggi_badan !== undefined && tinggi_badan !== "" ? Number(tinggi_badan) : null,
          berat_badan: berat_badan !== undefined && berat_badan !== "" ? Number(berat_badan) : null,
          riwayat_sakit: riwayat_sakit?.trim() || null,
          penilaian_rambut: penilaian_rambut || null,
          penilaian_kuku: penilaian_kuku || null,
          penilaian_telinga: penilaian_telinga || null,
          penilaian_gigi: penilaian_gigi || null,
          catatan_gizi_kesehatan: catatan_gizi_kesehatan?.trim() || null,
        },
      });

      return NextResponse.json({ success: true, message: "Data kesehatan berhasil disimpan", data: saved });
    }

    return NextResponse.json({ success: false, error: "Action tidak dikenali" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/musyrif/input error:", error);
    return NextResponse.json({ success: false, error: "Gagal menyimpan data pengasuhan" }, { status: 500 });
  }
}
