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
      const kName = assignment.kelasNama.trim();
      const kUpper = kName.toUpperCase();

      const OR_conditions: any[] = [
        { nama: { equals: kName, mode: "insensitive" } },
        { nama: { contains: kName, mode: "insensitive" } },
      ];

      if (kUpper === "IL" || kUpper.includes("IDAD") || kUpper.includes("I'DAD") || kUpper.includes("LUGHO") || kUpper.includes("ISLAM")) {
        OR_conditions.push(
          { nama: { contains: "I'dad", mode: "insensitive" } },
          { nama: { contains: "Idad", mode: "insensitive" } },
          { nama: { contains: "Lugho", mode: "insensitive" } },
          { nama: { equals: "IL", mode: "insensitive" } },
          { jenjang: { equals: "I'dad Lughowi", mode: "insensitive" } },
          { jenjang: { equals: "IL", mode: "insensitive" } },
          { jenjang: { contains: "Islam", mode: "insensitive" } }
        );
      } else {
        const numMatch = kName.match(/\d+/);
        if (numMatch) {
          const num = numMatch[0];
          OR_conditions.push(
            { nama: { startsWith: num, mode: "insensitive" } },
            { nama: { contains: `${num} MTs`, mode: "insensitive" } },
            { nama: { contains: `${num} MA`, mode: "insensitive" } }
          );
        }
      }

      // 1. Ensure Kelas exists
      let kelas = await prisma.kelas.findFirst({
        where: {
          is_active: true,
          OR: OR_conditions,
        },
        include: {
          _count: { select: { santri: true } },
        },
        orderBy: {
          santri: { _count: "desc" },
        },
      }).catch(async () => {
        // Fallback without sort if santri relation ordering fails
        return await prisma.kelas.findFirst({
          where: { is_active: true, OR: OR_conditions },
        });
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
      const mName = assignment.mapelNama.trim();
      const mapelOR: any[] = [
        { nama: { equals: mName, mode: "insensitive" } },
        { nama: { contains: mName, mode: "insensitive" } },
      ];
      if (mName.toLowerCase().includes("tahsin")) {
        mapelOR.push({ nama: { contains: "Tahsin", mode: "insensitive" } });
      }

      let mapel = await prisma.mataPelajaran.findFirst({
        where: {
          kelas_id: kelas.id,
          OR: mapelOR,
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

    // Clean up old assignments that are no longer selected or duplicate entries
    const allTeacherAssignments = await prisma.asatidzmMapel.findMany({
      where: { pegawai_id: pegawaiId },
    });

    const seenKey = new Set<string>();
    for (const cur of allTeacherAssignments) {
      const pairKey = `${cur.mapel_id}_${cur.kelas_id}`;
      const stillActive = activeMapelIds.some(
        (a) => a.mapel_id === cur.mapel_id && a.kelas_id === cur.kelas_id
      );

      // If no longer active OR if we've already seen this exact pair (duplicate row)
      if (!stillActive || seenKey.has(pairKey)) {
        await prisma.asatidzmMapel.delete({
          where: { id: cur.id },
        }).catch(() => {});
      } else {
        seenKey.add(pairKey);
      }
    }
  } catch (error) {
    console.error("Error in syncAsatidzMapel:", error);
  }
}
