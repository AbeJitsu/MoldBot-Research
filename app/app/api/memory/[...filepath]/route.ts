import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

const MEMORY_DIR = join(process.cwd(), "..", "memory");

function resolveFilePath(filepath: string[]): string {
  const resolved = join(MEMORY_DIR, ...filepath);

  // Prevent path traversal
  if (!resolved.startsWith(MEMORY_DIR)) {
    throw new Error("Path traversal detected");
  }

  return resolved;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filepath: string[] }> }
) {
  try {
    const { filepath } = await params;
    const fullPath = resolveFilePath(filepath);
    const content = await readFile(fullPath, "utf-8");
    return NextResponse.json({ path: filepath.join("/"), content });
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to read file" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ filepath: string[] }> }
) {
  try {
    const { filepath } = await params;
    const fullPath = resolveFilePath(filepath);
    const { content } = await request.json();

    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "Content must be a string" },
        { status: 400 }
      );
    }

    await writeFile(fullPath, content, "utf-8");
    return NextResponse.json({ path: filepath.join("/"), saved: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to write file" },
      { status: 500 }
    );
  }
}
