import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLiveSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getLiveSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kelas_id = searchParams.get("kelas_id");
    const musyrif_id = searchParams.get("musyrif_id");

    // Ambil seluruh santri aktif beserta info kelas, kelompok halaqoh, dan ujian
    const santriWhere: any = { is_active: true };
    if (kelas_id) santriWhere.kelas_id = kelas_id;

    const santriList = await prisma.santriAktif.findMany({
      where: santriWhere,
      include: {
        kelas: {
          select: { id: true, nama: true, jenjang: true }
        },
        halaqoh_anggota: {
          where: { is_active: true },
          include: {
            kelompok: {
              include: {
                pegawai: {
                  select: { id: true, nama_lengkap: true, no_hp: true }
                }
              }
            }
          }
        },
        ujian_tahfidz: {
          orderBy: { tanggal: "desc" },
          include: {
            pegawai: {
              select: { id: true, nama_lengkap: true }
            }
          }
        }
      },
      orderBy: { nama_lengkap: "asc" }
    });

    // Filter musyrif jika ada
    let filteredSantri = santriList;
    if (musyrif_id) {
      filteredSantri = filteredSantri.filter(s => 
        s.halaqoh_anggota.some(ha => ha.kelompok?.pegawai_id === musyrif_id)
      );
    }

    // Format santri matrix
    const santriMatrix = filteredSantri.map(s => {
      const activeHalaqoh = s.halaqoh_anggota[0]?.kelompok || null;
      const musyrifObj = activeHalaqoh?.pegawai || null;

      // Filter per jenis ujian
      const pekanan = s.ujian_tahfidz.filter(u => u.jenis_ujian === "ujian_pekanan");
      const bulanan = s.ujian_tahfidz.filter(u => u.jenis_ujian === "ujian_bulanan");
      const praTarget = s.ujian_tahfidz.filter(u => u.jenis_ujian === "ujian_pra_target");
      const target = s.ujian_tahfidz.filter(u => u.jenis_ujian === "ujian_target");
      const itqon = s.ujian_tahfidz.filter(u => u.jenis_ujian === "ujian_itqon");

      const formatExam = (list: typeof s.ujian_tahfidz) => {
        if (list.length === 0) return null;
        const latest = list[0];
        return {
          count: list.length,
          last_id: latest.id,
          last_tanggal: latest.tanggal.toISOString().split("T")[0],
          nilai_akhir: latest.nilai_akhir,
          nilai_bacaan: latest.nilai_bacaan,
          nilai_kelancaran: latest.nilai_kelancaran,
          nilai_sikap: latest.nilai_sikap,
          is_lulus: latest.is_lulus,
          surah_nama: latest.surah_nama || (latest.juz ? `Juz ${latest.juz}` : "-"),
          penguji: latest.pegawai?.nama_lengkap || "-"
        };
      };

      const examData = {
        pekanan: formatExam(pekanan),
        bulanan: formatExam(bulanan),
        pra_target: formatExam(praTarget),
        target: formatExam(target),
        itqon: formatExam(itqon)
      };

      // Hitung skor kelengkapan (Pekanan, Bulanan, Pra-Target adalah ujian wajib tengah semester)
      let countDone = 0;
      if (examData.pekanan) countDone++;
      if (examData.bulanan) countDone++;
      if (examData.pra_target) countDone++;
      if (examData.target) countDone++;
      if (examData.itqon) countDone++;

      return {
        id: s.id,
        nis: s.nis,
        nama_lengkap: s.nama_lengkap,
        kelas: s.kelas,
        kelompok: activeHalaqoh ? {
          id: activeHalaqoh.id,
          nama: activeHalaqoh.nama_kelompok,
          sesi: activeHalaqoh.sesi,
          musyrif_id: musyrifObj?.id || null,
          musyrif_nama: musyrifObj?.nama_lengkap || "Belum Ditentukan",
          musyrif_phone: musyrifObj?.no_hp || null
        } : null,
        ujian: examData,
        is_pra_target_done: !!examData.pra_target,
        is_pekanan_done: !!examData.pekanan,
        is_bulanan_done: !!examData.bulanan,
        is_target_done: !!examData.target,
        is_itqon_done: !!examData.itqon,
        total_ujian_types_done: countDone,
        progress_pts_percent: Math.round(((examData.pra_target ? 1 : 0) * 100))
      };
    });

    // Rekapitulasi per Musyrif
    const musyrifMap = new Map<string, {
      musyrif_id: string;
      musyrif_nama: string;
      musyrif_phone: string | null;
      kelompok_nama: string;
      total_santri: number;
      pra_target_done: number;
      pekanan_done: number;
      bulanan_done: number;
      target_done: number;
      itqon_done: number;
      santri_belum_pra_target: { id: string; nama: string; nis: string | null }[];
    }>();

    santriMatrix.forEach(sm => {
      const musyrifId = sm.kelompok?.musyrif_id || "unassigned";
      const musyrifNama = sm.kelompok?.musyrif_nama || "Tanpa Kelompok";
      const kelompokNama = sm.kelompok?.nama || "Tanpa Kelompok";
      const musyrifPhone = sm.kelompok?.musyrif_phone || null;

      if (!musyrifMap.has(musyrifId)) {
        musyrifMap.set(musyrifId, {
          musyrif_id: musyrifId,
          musyrif_nama: musyrifNama,
          musyrif_phone: musyrifPhone,
          kelompok_nama: kelompokNama,
          total_santri: 0,
          pra_target_done: 0,
          pekanan_done: 0,
          bulanan_done: 0,
          target_done: 0,
          itqon_done: 0,
          santri_belum_pra_target: []
        });
      }

      const m = musyrifMap.get(musyrifId)!;
      m.total_santri++;
      if (sm.ujian.pra_target) m.pra_target_done++;
      else m.santri_belum_pra_target.push({ id: sm.id, nama: sm.nama_lengkap, nis: sm.nis });

      if (sm.ujian.pekanan) m.pekanan_done++;
      if (sm.ujian.bulanan) m.bulanan_done++;
      if (sm.ujian.target) m.target_done++;
      if (sm.ujian.itqon) m.itqon_done++;
    });

    const rekapMusyrif = Array.from(musyrifMap.values()).map(m => ({
      ...m,
      pra_target_persen: m.total_santri > 0 ? Math.round((m.pra_target_done / m.total_santri) * 100) : 0,
      is_tuntas_pra_target: m.total_santri > 0 && m.pra_target_done === m.total_santri
    })).sort((a, b) => a.pra_target_persen - b.pra_target_persen);

    // Global Stats
    const totalSantri = santriMatrix.length;
    const praTargetCount = santriMatrix.filter(s => s.is_pra_target_done).length;
    const pekananCount = santriMatrix.filter(s => s.is_pekanan_done).length;
    const bulananCount = santriMatrix.filter(s => s.is_bulanan_done).length;
    const targetCount = santriMatrix.filter(s => s.is_target_done).length;
    const itqonCount = santriMatrix.filter(s => s.is_itqon_done).length;

    const globalStats = {
      total_santri: totalSantri,
      pra_target: {
        count: praTargetCount,
        percent: totalSantri > 0 ? Math.round((praTargetCount / totalSantri) * 100) : 0
      },
      pekanan: {
        count: pekananCount,
        percent: totalSantri > 0 ? Math.round((pekananCount / totalSantri) * 100) : 0
      },
      bulanan: {
        count: bulananCount,
        percent: totalSantri > 0 ? Math.round((bulananCount / totalSantri) * 100) : 0
      },
      target: {
        count: targetCount,
        percent: totalSantri > 0 ? Math.round((targetCount / totalSantri) * 100) : 0
      },
      itqon: {
        count: itqonCount,
        percent: totalSantri > 0 ? Math.round((itqonCount / totalSantri) * 100) : 0
      }
    };

    // Ambil daftar kelas dan musyrif untuk filter dropdown
    const kelasList = await prisma.kelas.findMany({
      select: { id: true, nama: true, jenjang: true },
      orderBy: { nama: "asc" }
    });

    const musyrifList = Array.from(
      new Map(
        rekapMusyrif
          .filter(m => m.musyrif_id !== "unassigned")
          .map(m => [m.musyrif_id, { id: m.musyrif_id, nama: m.musyrif_nama, kelompok: m.kelompok_nama }])
      ).values()
    );

    return NextResponse.json({
      global_stats: globalStats,
      santri: santriMatrix,
      rekap_musyrif: rekapMusyrif,
      filters: {
        kelas: kelasList,
        musyrif: musyrifList
      }
    });
  } catch (error: any) {
    console.error("[monitoring_ujian_error]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
