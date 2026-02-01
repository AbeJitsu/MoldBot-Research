import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { isAuthorized, unauthorizedResponse } from "@/lib/auth";
import { addAutomationToQueue } from "@/lib/automation-queue";

const AUTOMATIONS_DIR = join(process.cwd(), "..", "automations");

// Only allow safe alphanumeric + hyphen/underscore names (no path traversal possible)
const SAFE_NAME_RE = /^[a-zA-Z0-9_-]{1,100}$/;

function isValidAutomation(name: string): boolean {
  if (!SAFE_NAME_RE.test(name)) return false;
  return existsSync(join(AUTOMATIONS_DIR, name, "prompt.md"));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  if (!isAuthorized(request)) return unauthorizedResponse();
  const { name } = await params;

  if (!isValidAutomation(name)) {
    return NextResponse.json(
      { error: "Unknown automation" },
      { status: 404 }
    );
  }

  try {
    const promptPath = join(AUTOMATIONS_DIR, name, "prompt.md");
    const prompt = await readFile(promptPath, "utf-8");
    return NextResponse.json({ name, prompt });
  } catch {
    return NextResponse.json(
      { error: "Prompt template not found" },
      { status: 404 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  if (!isAuthorized(request)) return unauthorizedResponse();
  const { name } = await params;

  if (!isValidAutomation(name)) {
    return NextResponse.json(
      { error: "Unknown automation" },
      { status: 404 }
    );
  }

  try {
    const promptPath = join(AUTOMATIONS_DIR, name, "prompt.md");
    const prompt = await readFile(promptPath, "utf-8");

    // Queue the prompt for execution — WebSocket handler will pick it up on next message
    addAutomationToQueue(prompt);

    // Return 202 Accepted indicating the automation has been queued
    return NextResponse.json(
      {
        name,
        status: "queued",
        message: "Automation prompt queued for execution. Will execute via connected WebSocket client.",
      },
      { status: 202 }
    );
  } catch {
    return NextResponse.json(
      { error: "Prompt template not found" },
      { status: 404 }
    );
  }
}
