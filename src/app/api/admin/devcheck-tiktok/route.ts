// TEMPORARY, round 91A follow-up (Sep 18) -- TikTok's authorize page
// returned "We couldn't log in with TikTok... client_key" after Peter
// pasted TIKTOK_CLIENT_KEY/TIKTOK_CLIENT_SECRET. Same non-ASCII/
// whitespace diagnostic pattern as the X credential debugging earlier
// this session -- never reports the raw value, only its shape. Delete
// once resolved.

import { isAuthorizedCronRequest } from "@/lib/auth/cron-auth";

function shapeCheck(name: string): { name: string; set: boolean; hasWhitespace: boolean; length: number; nonAsciiAt: number[] } {
  const raw = process.env[name];
  if (!raw) return { name, set: false, hasWhitespace: false, length: 0, nonAsciiAt: [] };
  const nonAsciiAt: number[] = [];
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i);
    if (code < 0x20 || code > 0x7e) nonAsciiAt.push(i);
  }
  return { name, set: true, hasWhitespace: raw !== raw.trim(), length: raw.length, nonAsciiAt };
}

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const checks = ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"].map(shapeCheck);
  return Response.json({ checks });
}
