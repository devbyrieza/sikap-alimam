import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStandardMapelName } from "@/lib/mapel";
import { syncAsatidzMapel } from "@/lib/syncAsatidzMapel";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const logs: string[] = [];

    // 1. Ambil semua kelas aktif
    const classes = await prisma.kelas.findMany({
      where: { is_active: true }
    });

    let totalMerged = 0;
    let totalRenamed = 0;

    for (const k of classes) {
      const isMA = k.jenjang === "MA" || k.nama.toUpperCase().includes("MA");

      // Ambil seluruh mapel kelas ini dengan hitungan nilai
      const mapels = await prisma.mataPelajaran.findMany({
        where: { kelas_id: k.id },
        include: {
          _count: {
            select: {
              nilai: true,
              jurnal: true,
              asatidz_mapel: true
            }
          }
        }
      });

      // Kelompokkan mapel berdasarkan standardName
      const grouped = new Map<string, typeof mapels>();

      for (const m of mapels) {
        const standard = getStandardMapelName(m.nama, isMA);
        if (!grouped.has(standard)) {
          grouped.set(standard, []);
        }
        grouped.get(standard)!.push(m);
      }

      // Evaluasi per kelompok
      for (const [standardName, groupList] of grouped.entries()) {
        if (groupList.length === 1) {
          // Hanya 1 mapel, cukup update namanya jika belum baku
          const single = groupList[0];
          if (single.nama !== standardName) {
            try {
              await prisma.mataPelajaran.update({
                where: { id: single.id },
                data: { nama: standardName }
              });
              logs.push(`[${k.nama}] Renamed: "${single.nama}" -> "${standardName}"`);
              totalRenamed++;
            } catch (singleErr: any) {
              logs.push(`[${k.nama}] Warning renaming single "${single.nama}": ${singleErr.message}`);
            }
          }
        } else {
          // Lebih dari 1 mapel (DUPLIKAT DETECTED!)
          // Prioritaskan mapel yang memiliki data nilai terbanyak
          const sorted = [...groupList].sort((a, b) => {
            if (b._count.nilai !== a._count.nilai) {
              return b._count.nilai - a._count.nilai;
            }
            if (b._count.jurnal !== a._count.jurnal) {
              return b._count.jurnal - a._count.jurnal;
            }
            // Jika sama-sama 0, prioritaskan yang namanya sudah persis standardName
            if (a.nama === standardName) return -1;
            if (b.nama === standardName) return 1;
            return 0;
          });

          const canonical = sorted[0];
          const duplicates = sorted.slice(1);

          logs.push(
            `[${k.nama}] Merging duplicates for "${standardName}". Canonical: "${canonical.nama}" (ID: ${canonical.id}, Nilai: ${canonical._count.nilai})`
          );

          // Pindahkan seluruh data dari duplicates ke canonical TERLEBIH DAHULU
          for (const dup of duplicates) {
            logs.push(`  -> Merging and deleting duplicate: "${dup.nama}" (ID: ${dup.id}, Nilai: ${dup._count.nilai})`);

            // 1. Nilai Santri
            await prisma.nilaiSantri.updateMany({
              where: { mapel_id: dup.id },
              data: { mapel_id: canonical.id }
            });

            // 2. Jurnal Mengajar
            await prisma.jurnalMengajar.updateMany({
              where: { mapel_id: dup.id },
              data: { mapel_id: canonical.id }
            });

            // 3. Jadwal Pelajaran
            await prisma.jadwalPelajaran.updateMany({
              where: { mapel_id: dup.id },
              data: { mapel_id: canonical.id }
            });

            // 4. Presensi Siswa
            await prisma.presensiSiswa.updateMany({
              where: { mapel_id: dup.id },
              data: { mapel_id: canonical.id }
            });

            // 5. Asatidz Mapel
            const oldAssignments = await prisma.asatidzmMapel.findMany({
              where: { mapel_id: dup.id }
            });

            for (const am of oldAssignments) {
              const alreadyExists = await prisma.asatidzmMapel.findFirst({
                where: {
                  pegawai_id: am.pegawai_id,
                  mapel_id: canonical.id,
                  kelas_id: am.kelas_id
                }
              });

              if (!alreadyExists) {
                await prisma.asatidzmMapel.create({
                  data: {
                    pegawai_id: am.pegawai_id,
                    mapel_id: canonical.id,
                    kelas_id: am.kelas_id
                  }
                }).catch(() => {});
              }
            }

            await prisma.asatidzmMapel.deleteMany({
              where: { mapel_id: dup.id }
            });

            // 6. Hapus mata pelajaran duplikat
            await prisma.mataPelajaran.delete({
              where: { id: dup.id }
            });

            totalMerged++;
          }

          // SETELAH semua duplikat dihapus, sekarang aman untuk merename canonical ke standardName
          if (canonical.nama !== standardName) {
            try {
              await prisma.mataPelajaran.update({
                where: { id: canonical.id },
                data: { nama: standardName }
              });
              logs.push(`  -> Renamed canonical [${canonical.id}]: "${canonical.nama}" -> "${standardName}"`);
              totalRenamed++;
            } catch (err: any) {
              logs.push(`  -> Warning rename canonical: ${err.message}`);
            }
          }
        }
      }
    }

    // 2. Standardisasi penugasan mata pelajaran di tabel pegawai
    const teachers = await prisma.pegawai.findMany({
      where: {
        mata_pelajaran: { not: null }
      }
    });

    let teacherSyncCount = 0;
    for (const t of teachers) {
      if (!t.mata_pelajaran) continue;

      let cleanedStr = t.mata_pelajaran;
      // Replace non-standard terms in string
      cleanedStr = cleanedStr
        .replace(/\bAqidah\b/gi, "Akidah")
        .replace(/\bFiqih\b/gi, "Fikih")
        .replace(/\bFiqh\b/gi, "Fikih")
        .replace(/\bShorf\b/gi, "Shorof")
        .replace(/\bSharaf\b/gi, "Shorof")
        .replace(/\bHadits\b/gi, "Hadis")
        .replace(/\bSiroh\b/gi, "Sirah")
        .replace(/\bAkhlaq\b/gi, "Akhlak")
        .replace(/\bB\. Indonesia\b/gi, "Bahasa Indonesia")
        .replace(/\bB\. Arab\b/gi, "Bahasa Arab")
        .replace(/\bB\. Inggris\b/gi, "Bahasa Inggris")
        .replace(/\bMTK\b/gi, "Matematika");

      if (cleanedStr !== t.mata_pelajaran) {
        await prisma.pegawai.update({
          where: { id: t.id },
          data: { mata_pelajaran: cleanedStr }
        });
        logs.push(`Standardized teacher [${t.nama_lengkap}]: "${t.mata_pelajaran}" -> "${cleanedStr}"`);
      }

      // Sinkronkan kembali relasi asatidz_mapel
      await syncAsatidzMapel(t.id, cleanedStr);
      teacherSyncCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Pembersihan mapel berhasil! ${totalRenamed} mapel distandardisasi, ${totalMerged} mapel duplikat dimerge & dihapus, ${teacherSyncCount} guru disinkronkan.`,
      stats: { totalRenamed, totalMerged, teacherSyncCount },
      logs
    });
  } catch (error: any) {
    console.error("Cleanup mapel error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}