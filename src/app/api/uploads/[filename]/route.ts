import { NextRequest, NextResponse } from "next/server";
import { readFile, access } from "fs/promises";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> | any }
) {
  try {
    const { filename } = await params;

    const uploadDir = process.env.NODE_ENV === "production"
      ? "/app/storage_data/uploads"
      : path.join(process.cwd(), "storage_data", "uploads");

    const filePath = path.join(uploadDir, filename);
    let foundFilePath: string | null = null;
    try {
      await access(filePath);
      foundFilePath = filePath;
    } catch {
      // Not found in primary folder
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
        "Cache-Control": "public, max-age=31536000, immutable" } });
  } catch (error: any) {
    console.error("Error serving uploaded file in SIKAP:", error);
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });
  }
}
