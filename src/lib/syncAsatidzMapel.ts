import { prisma } from "@/lib/prisma";

/**
 * Helper to sync a teacher's `mata_pelajaran` text representation (e.g. "7 MTs: Aqidah, Fiqih; IL: Nahwu")
 * with the relational `asatidz_mapel`, `kelas`, and `mata_pelajaran` tables in SIKAP.
 */
export async function syncAsatidzMapel(pegawaiId: string, mapelString: string | null | undefined) {
  if (!pegawaiId) return;

  if (!mapelString || !mapelString.trim()) {
    // Delete existing assignments if mapel was cleared
    await prisma.asatidzmMapel.deleteMany({
      where: { pegawai_id: pegawaiId },
    }).catch((e) => console.warn("Failed to clear asatidz_mapel:", e));
    return;
  }

  try {
    // Format is typically semicolon-separated groups or comma-separated items:
    // e.g., "7 MTs: Aqidah, Fiqih; 8 MTs: Tafsir" OR "7 MTs - Aqidah, 8 MTs - Fiqih" OR "Aqidah, Fiqih"
    const groups = mapelString.split(";").map((s) => s.trim()).filter(Boolean);

    const targetAssignments: { kelasNama: string; jenjang: string; mapelNama: string }[] = [];

    for (const group of groups) {
      if (group.includes(":")) {
        const [kelasPart, mapelsPart] = group.split(":");
        const kelasNama = kelasPart.trim();
        const jenjang = kelasNama.toUpperCase().includes("MTS") ? "MTs" : "Islamiyah";
        const mapels = mapelsPart.split(",").map((m) => m.trim()).filter(Boolean);

        for (const mapelNama of mapels) {
          targetAssignments.push({ kelasNama, jenjang, mapelNama });
        }
      } else {
        // Simple comma separated or flat list
        const items = group.split(",").map((i) => i.trim()).filter(Boolean);
        for (const item of items) {
          if (item.includes(" - ")) {
            const [kelasNama, mapelNama] = item.split(" - ").map((x) => x.trim());
            const jenjang = kelasNama.toUpperCase().includes("MTS") ? "MTs" : "Islamiyah";
            targetAssignments.push({ kelasNama, jenjang, mapelNama });
          } else {
            // Default to 7 MTs if no class specified
            targetAssignments.push({ kelasNama: "7 MTs", jenjang: "MTs", mapelNama: item });
          }
        }
      }
    }

    if (targetAssignments.length === 0) return;

    // Process each assignment
    const activeMapelIds: { pegawai_id: string; mapel_id: string; kelas_id: string }[] = [];

    for (const assignment of targetAssignments) {
      // 1. Ensure Kelas exists
      let kelas = await prisma.kelas.findFirst({
        where: {
          OR: [
            { nama: { equals: assignment.kelasNama, mode: "insensitive" } },
          ],
        },
      });

      if (!kelas) {
        kelas = await prisma.kelas.create({
          data: {
            nama: assignment.kelasNama,
            jenjang: assignment.jenjang,
            is_active: true,
          },
        });
      }

      // 2. Ensure MataPelajaran exists
      let mapel = await prisma.mataPelajaran.findFirst({
        where: {
          nama: { equals: assignment.mapelNama, mode: "insensitive" },
          kelas_id: kelas.id,
        },
      });

      if (!mapel) {
        mapel = await prisma.mataPelajaran.create({
          data: {
            nama: assignment.mapelNama,
            kelas_id: kelas.id,
            kategori: "syariah",
            is_active: true,
          },
        });
      }

      // 3. Upsert AsatidzmMapel
      const existingRel = await prisma.asatidzmMapel.findFirst({
        where: {
          pegawai_id: pegawaiId,
          mapel_id: mapel.id,
          kelas_id: kelas.id,
        },
      });

      if (!existingRel) {
        await prisma.asatidzmMapel.create({
          data: {
            pegawai_id: pegawaiId,
            mapel_id: mapel.id,
            kelas_id: kelas.id,
          },
        }).catch((e) => console.warn("Rel create skipped:", e));
      }

      activeMapelIds.push({ pegawai_id: pegawaiId, mapel_id: mapel.id, kelas_id: kelas.id });
    }

    // Clean up old assignments that are no longer selected
    const allTeacherAssignments = await prisma.asatidzmMapel.findMany({
      where: { pegawai_id: pegawaiId },
    });

    for (const cur of allTeacherAssignments) {
      const stillActive = activeMapelIds.some(
        (a) => a.mapel_id === cur.mapel_id && a.kelas_id === cur.kelas_id
      );
      if (!stillActive) {
        await prisma.asatidzmMapel.delete({
          where: { id: cur.id },
        }).catch(() => {});
      }
    }
  } catch (error) {
    console.error("Error in syncAsatidzMapel:", error);
  }
}
