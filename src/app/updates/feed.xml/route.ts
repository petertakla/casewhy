import { getPublishedUpdates } from "@/lib/updates/updates";

// Round 93 — RSS 2.0 feed for /updates. Custom route (not the Next.js
// sitemap.ts special file, which only ever produces sitemap.xml) since
// there's no built-in metadata-route convention for an arbitrary feed
// path -- same gating as the HTML pages: only posts whose round 89
// marketing_queue row is posted/edited_posted appear here.

export const dynamic = "force-dynamic";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = await getPublishedUpdates();

  const items = posts
    .map((post) => {
      const url = `https://app.casewhy.com/updates/${post.slug}`;
      const pubDate = new Date(`${post.date}T00:00:00Z`).toUTCString();
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(post.summary)}</description>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>CaseWhy Updates</title>
    <link>https://app.casewhy.com/updates</link>
    <description>Plain-language explanations of how USCIS processing actually works, from CaseWhy.</description>
    <language>en-us</language>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
