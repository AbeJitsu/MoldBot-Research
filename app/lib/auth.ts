import { NextResponse } from "next/server";

// Token-based auth for remote access (Tailscale)
// If BRIDGETTE_TOKEN is empty/unset, all requests are allowed (local dev mode)

function getToken(): string {
  return process.env.BRIDGETTE_TOKEN || "";
}

export function isAuthorized(request: Request): boolean {
  const token = getToken();
  if (!token) return true; // No token configured = local dev, allow all

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ") && authHeader.slice(7) === token) {
    return true;
  }

  // Also check query param for browser convenience
  const url = new URL(request.url);
  if (url.searchParams.get("token") === token) {
    return true;
  }

  return false;
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
