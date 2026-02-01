import { NextResponse } from "next/server";
import { clearCompletedTasks } from "../task-store";
import { isAuthorized, unauthorizedResponse } from "@/lib/auth";

export async function DELETE(request: Request) {
  if (!isAuthorized(request)) return unauthorizedResponse();

  try {
    const count = await clearCompletedTasks();
    return NextResponse.json({ ok: true, cleared: count });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to clear completed tasks";
    console.error("[tasks clear-completed]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
