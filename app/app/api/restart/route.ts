import { NextResponse } from "next/server";
import { isAuthorized, unauthorizedResponse } from "@/lib/auth";

export async function POST(request: Request) {
  if (!isAuthorized(request)) return unauthorizedResponse();

  console.log("[server] Restart requested via REST API");

  // Respond before shutting down so the client gets the confirmation
  const response = NextResponse.json({ ok: true, message: "Restarting..." });

  // Schedule shutdown after response is sent
  // launchd KeepAlive will restart the process
  setTimeout(() => {
    console.log("[server] Shutting down for restart...");
    process.exit(0);
  }, 500);

  return response;
}
