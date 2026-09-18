// TEMPORARY, X credential debugging (Sep 2026) -- testXCredentials()'s
// GET /2/users/me check doesn't work on X's Free API tier (Free blocks
// most reads, posting only), so it can't confirm whether the pasted
// X_API_KEY/X_API_SECRET/X_ACCESS_TOKEN/X_ACCESS_TOKEN_SECRET actually
// work. Peter explicitly authorized a real one-off test post to check.
// Delete this route (and testXPost() in x.ts) once credentials are
// confirmed working -- same temporary-diagnostic pattern as
// devcheck-x-auth and devcheck-social-senders earlier this project.

import { createHmac } from "crypto";
import OAuth from "oauth-1.0a";
import { isAuthorizedCronRequest } from "@/lib/auth/cron-auth";
import { testXPost } from "@/lib/marketing/posters/x";

// One-time cross-check against a well-tested OAuth 1.0a library, added
// after the hand-rolled signing in x.ts failed with 401 on both a read
// and a real write using freshly-regenerated, correctly-shaped
// credentials -- ruling out a paste error. If this ALSO 401s with the
// same credentials, the signing code isn't the problem; if it succeeds,
// it is. Delete alongside the rest of this temporary route.
async function libraryCrossCheck(): Promise<{ status: number; body: unknown }> {
  const apiKey = process.env.X_API_KEY!;
  const apiSecret = process.env.X_API_SECRET!;
  const accessToken = process.env.X_ACCESS_TOKEN!;
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET!;

  const oauth = new OAuth({
    consumer: { key: apiKey, secret: apiSecret },
    signature_method: "HMAC-SHA1",
    hash_function(base_string, key) {
      return createHmac("sha1", key).update(base_string).digest("base64");
    },
  });

  const url = "https://api.x.com/2/users/me";
  const authHeader = oauth.toHeader(oauth.authorize({ url, method: "GET" }, { key: accessToken, secret: accessTokenSecret }));

  const res = await fetch(url, { headers: { ...authHeader } });
  const body = await res.json();
  return { status: res.status, body };
}

// X credentials are plain ASCII (alphanumeric, base64url-ish). Anything
// outside printable ASCII (0x20-0x7E) -- a zero-width space, smart quote,
// non-breaking space, BOM -- would break OAuth 1.0a's exact-string
// signing while looking completely normal on screen and passing the
// plain trim()-based whitespace check. Reports only the offending
// character's Unicode code point and index, never surrounding context,
// so it stays safe to log without exposing the credential itself.
function nonAsciiCheck(name: string): { name: string; clean: boolean; badChars: { index: number; codePoint: string }[] } {
  const raw = process.env[name];
  if (!raw) return { name, clean: true, badChars: [] };
  const badChars: { index: number; codePoint: string }[] = [];
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i);
    if (code < 0x20 || code > 0x7e) {
      badChars.push({ index: i, codePoint: "U+" + code.toString(16).toUpperCase().padStart(4, "0") });
    }
  }
  return { name, clean: badChars.length === 0, badChars };
}

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const nonAscii = ["X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET"].map(nonAsciiCheck);
  const crossCheck = await libraryCrossCheck().catch((err) => ({
    status: -1,
    body: err instanceof Error ? err.message : String(err),
  }));

  try {
    const result = await testXPost();
    return Response.json({ ok: true, ...result, crossCheck, nonAscii });
  } catch (err) {
    return Response.json({ ok: false, error: err instanceof Error ? err.message : String(err), crossCheck, nonAscii }, { status: 200 });
  }
}
