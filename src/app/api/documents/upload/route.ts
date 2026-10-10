import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filename = `${Date.now()}-${cleanName}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads");

        await writeFile(path.join(uploadDir, filename), buffer);

        // Match the object structure that app/page.tsx expects:
        return NextResponse.json({
            success: true,
            document: {
                originalFile: `/uploads/${filename}`,
            },
        });
    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json({ success: false, error: error.message || "Upload failed" }, { status: 500 });
    }
}