import { NextRequest, NextResponse } from "next/server";
import { writeFile, access, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("foto") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "Tidak ada file yang diunggah" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || ".jpg";
    const fileName = `${crypto.randomUUID()}${ext}`;

    const uploadDir = process.env.NODE_ENV === "production"
      ? "/app/storage_data/uploads"
      : path.join(process.cwd(), "storage_data", "uploads");

    try {
      await access(uploadDir);
    } catch {
      await mkdir(uploadDir, { recursive: true });
    }

    await writeFile(path.join(uploadDir, fileName), buffer);

    return NextResponse.json({ success: true, url: `/api/uploads/${fileName}` });
  } catch (error: any) {
    console.error("Error uploading file in SIKAP:", error);
    return NextResponse.json({ success: false, error: "Gagal mengunggah file" }, { status: 500 });
  }
}
