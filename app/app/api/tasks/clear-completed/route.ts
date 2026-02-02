import { NextResponse } from "next/server";
import { clearCompletedTasks } from "../task-store";
import { isAuthorized, unauthorizedResponse } from "@/lib/auth";

export async function DELETE(request: Request) {
  if (!isAuthorized(request)) return unauthorizedResponse();

  try {
    const url = new URL(request.url);
    const workingDir = url.searchParams.get("workingDir") || undefined;
    const count = await clearCompletedTasks(workingDir);
    return NextResponse.json({ ok: true, cleared: count });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to clear completed tasks";
    console.error("[tasks clear-completed]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
