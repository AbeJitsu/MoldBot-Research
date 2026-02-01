import { NextResponse } from "next/server";
import { advanceAllByStatus, VALID_STATUSES, type Task } from "../task-store";
import { isAuthorized, unauthorizedResponse, parseJsonBody } from "@/lib/auth";

export async function POST(request: Request) {
  if (!isAuthorized(request)) return unauthorizedResponse();

  const result = await parseJsonBody(request);
  if (result instanceof NextResponse) return result;
  const body = result;

  const from = body.from as Task["status"];
  const to = body.to as Task["status"];

  if (!from || !to || !VALID_STATUSES.includes(from) || !VALID_STATUSES.includes(to)) {
    return NextResponse.json(
      { error: `Invalid statuses. 'from' and 'to' must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  if (from === to) {
    return NextResponse.json(
      { error: "'from' and 'to' must be different statuses" },
      { status: 400 }
    );
  }

  try {
    const count = await advanceAllByStatus(from, to);
    return NextResponse.json({ ok: true, advanced: count });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to advance tasks";
    console.error("[tasks advance-all]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
