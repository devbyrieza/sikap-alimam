import { NextRequest, NextResponse } from "next/server";
import { readFile, access } from "fs/promises";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> | any }
) {
  try {
    const { filename } = await params;

    // Resolve upload directory candidates
    const candidateDirs = process.env.NODE_ENV === "production"
      ? ["/app/storage_data/uploads"]
      : [
          path.join(process.cwd(), "storage_data", "uploads"),
          path.join(process.cwd(), "..", "simpeg-alimam", "storage_data", "uploads"),
        ];

    let foundFilePath: string | null = null;
    for (const dir of candidateDirs) {
      const p = path.join(dir, filename);
      try {
        await access(p);
        foundFilePath = p;
        break;
      } catch {
        // Try next candidate
      }
    }

    if (!foundFilePath) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });
    }

    const fileBuffer = await readFile(foundFilePath);

    const ext = path.extname(filename).toLowerCase();
    let contentType = "image/png";
    if (ext === ".jpg" || ext === ".jpeg") {
      contentType = "image/jpeg";
    } else if (ext === ".webp") {
      contentType = "image/webp";
    } else if (ext === ".svg") {
      contentType = "image/svg+xml";
    }

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Error serving uploaded file in SIKAP:", error);
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });
  }
}
