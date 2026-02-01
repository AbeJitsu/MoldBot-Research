import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import { join } from "path";
import { isAuthorized, unauthorizedResponse } from "@/lib/auth";

const MEMORY_DIR = join(process.cwd(), "..", "memory");

interface MemoryFile {
  name: string;
  path: string;
  size: number;
  modified: string;
}

async function listFiles(dir: string, prefix = ""): Promise<MemoryFile[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: MemoryFile[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (entry.isDirectory() && !entry.name.startsWith(".")) {
      const nested = await listFiles(fullPath, relativePath);
      files.push(...nested);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      const info = await stat(fullPath);
      files.push({
        name: entry.name,
        path: relativePath,
        size: info.size,
        modified: info.mtime.toISOString(),
      });
    }
  }

  return files;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return unauthorizedResponse();
  try {
    const files = await listFiles(MEMORY_DIR);
    return NextResponse.json({ files });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to list memory files" },
      { status: 500 }
    );
  }
}
