import { NextRequest, NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import { join } from "path";

// List subdirectories of a given path for the directory picker
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path") || process.env.HOME || "/";

  try {
    const entries = await readdir(path, { withFileTypes: true });
    const dirs = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith("."))
      .map((e) => ({
        name: e.name,
        path: join(path, e.name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ path, dirs });
  } catch {
    return NextResponse.json({ path, dirs: [], error: "Cannot read directory" }, { status: 400 });
  }
}
