// Round 85 — Reddit polling for the community-forum monitor.
//
// The task doc assumed reddit.com/r/X/new.json needs no login or API key.
// Checked live before building against it (Sep 13/14, 2026): both
// www.reddit.com/r/USCIS/new.json and old.reddit.com/r/USCIS/new.json now
// return a hard 403 (or a login redirect) to a plain server-side request,
// even with a descriptive User-Agent — Reddit has locked down unauthenticated
// JSON access since that assumption was written. The only real path left is
// Reddit's own OAuth API (a free "script" app, read-only, no user login
// required beyond the app's own client credentials) — a genuine correction
// to the task doc's premise, not a guess. Gated behind two env vars Peter
// has to create at reddit.com/prefs/apps ("create app" -> type "script");
// isRedditConfigured() lets the poller skip cleanly until they're set, same
// pattern as isGmailApiConfigured() in round 70.
//
// DORMANT as of Sep 15, 2026 — do not wire this back into
// poll-marketing-sources without a fresh check. Reddit denied the
// Responsible Builder Policy application this code depends on (ticket
// 18455163, generic non-compliance/insufficient-detail response) — no
// REDDIT_CLIENT_ID/SECRET will exist, so isRedditConfigured() will stay
// false indefinitely. The fallback (subreddit .rss feeds, no auth needed)
// was then live-tested from the actual deployed Vercel environment: a
// clean 200 from a local shell, but a 403 challenge page then a 429 on
// retry from Vercel itself — Reddit blocks this app's outbound IP range at
// the network level, not just unauthenticated JSON specifically. Reddit is
// manual-only for now (poll-marketing-sources/route.ts), same as
// Facebook/Quora. This file is kept, not deleted, because Peter's plan is
// to reapply once CaseWhy has real users and posting history to point
// to — a post-launch item. Re-verify RSS reachability from the deployed
// environment again before ever reconnecting either path; IP-range blocks
// like this one don't self-resolve, and OAuth approval could take a
// different amount of time on a second application.

const USER_AGENT = "web:casewhy-community-monitor:1.0 (by /u/casewhy)";

export interface RedditThread {
  url: string;
  title: string;
  bodyText: string;
  subreddit: string;
  createdAt: Date;
}

export function isRedditConfigured(): boolean {
  return Boolean(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET);
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;

  const clientId = process.env.REDDIT_CLIENT_ID!;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET!;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`Reddit OAuth token request failed: HTTP ${res.status}`);

  const data = (await res.json()) as { access_token: string; expires_in: number };
  // Refresh 60s early to avoid a request racing right on expiry.
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.token;
}

interface RedditListingChild {
  data?: {
    id?: string;
    title?: string;
    selftext?: string;
    permalink?: string;
    subreddit?: string;
    created_utc?: number;
    removed_by_category?: unknown;
  };
}

export async function fetchNewThreads(subreddit: string, limit = 15): Promise<RedditThread[]> {
  const token = await getAccessToken();
  const res = await fetch(`https://oauth.reddit.com/r/${subreddit}/new?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": USER_AGENT,
    },
  });
  if (!res.ok) throw new Error(`r/${subreddit}: HTTP ${res.status}`);

  const data = (await res.json()) as { data?: { children?: RedditListingChild[] } };
  const children = data.data?.children ?? [];

  return children
    .map((child) => child.data)
    .filter((post): post is NonNullable<RedditListingChild["data"]> => Boolean(post?.id && post.permalink))
    .filter((post) => !post.removed_by_category) // skip mod-removed posts, nothing useful to reply to
    .map((post) => ({
      url: `https://www.reddit.com${post.permalink}`,
      title: post.title?.trim() ?? "",
      bodyText: post.selftext?.trim() ?? "",
      subreddit: post.subreddit ?? subreddit,
      createdAt: post.created_utc ? new Date(post.created_utc * 1000) : new Date(),
    }))
    .filter((thread) => thread.title);
}
