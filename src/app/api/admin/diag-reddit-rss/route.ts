// Temporary diagnostic — confirms r/USCIS's Atom RSS feed is reachable
// from the deployed Vercel environment specifically (not just a local
// shell, which doesn't share Vercel's IP ranges and wouldn't catch a
// datacenter-ASN block). Bearer-secured with ADMIN_DIAG_SECRET, same
// pattern as every other one-off diagnostic route this project uses. To
// be deleted once the Reddit RSS question is answered.

const USER_AGENT = "web:casewhy-community-monitor:1.0 (by /u/casewhy)";

export async function GET(request: Request) {
  const expected = process.env.ADMIN_DIAG_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = "https://www.reddit.com/r/USCIS/new.rss";
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    const body = await res.text();
    return Response.json({
      url,
      httpStatus: res.status,
      contentType: res.headers.get("content-type"),
      bodyLength: body.length,
      bodyPreview: body.slice(0, 500),
      looksLikeAtom: body.includes("<feed") && body.includes("<entry>"),
    });
  } catch (err) {
    return Response.json({ url, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
