// Round 90 — real X API v2 poster. Posts a thread: draftText is split on
// the "\n\n---\n\n" separator draft-news-post.ts/poll-policy-news inserted
// between posts (also what Peter would see and could edit in the queue
// textarea -- keeping the same separator through editing is documented in
// that row's own guardrailNotes), first post as a plain tweet, each
// following post as a reply to the one before it, forming a real thread.
//
// Posting a tweet on X API v2 needs user-context auth, not just an app
// bearer token -- OAuth 1.0a (four credentials: API key/secret + a fixed
// access token/secret for the CaseWhy account itself) is the standard
// server-side path that needs no interactive/redirect flow at post time,
// unlike OAuth 2.0 user context (PKCE, refreshable tokens, more moving
// parts for a single owned account posting on its own behalf). No OAuth
// library exists in this codebase's dependencies -- HMAC-SHA1 signing is
// hand-rolled below (same "no new heavy dependency" precedent as
// extract-article.ts's dependency-free HTML extraction) rather than adding
// one for four lines of crypto.
//
// Needs Peter's own one-time setup (identity/authorization, not something
// any secret this session could generate substitutes for -- same category
// as the GitHub App install or cron-job.org registration): an X developer
// project + app on the CaseWhy account, Basic tier, OAuth 1.0a enabled
// with Read+Write permissions, then four env vars set via `vercel env add`:
// X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET. Until
// those exist, this poster throws a clear "not configured" error rather
// than a confusing API failure -- approveForAutoPost surfaces that error
// to Peter directly (src/app/admin/marketing/actions.ts), so the item
// stays "approved" and he can retry once the keys are set, not a silent
// no-op.

import { createHmac, randomBytes } from "crypto";
import type { Poster } from "./types";
import { assertXWriteBudget } from "./x-rate-limit";
import { isUnconfigured } from "./env";

const X_API_BASE = "https://api.x.com/2/tweets";

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!*'()]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function oauthHeader(method: string, url: string, credentials: { apiKey: string; apiSecret: string; accessToken: string; accessTokenSecret: string }): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: credentials.apiKey,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: credentials.accessToken,
    oauth_version: "1.0",
  };

  // POST body here is JSON, not form-encoded params -- OAuth 1.0a's
  // signature base string only includes the OAuth params themselves in
  // that case (no query string, no form body to fold in), per the spec.
  const paramString = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`)
    .join("&");
  const baseString = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(paramString)}`;
  const signingKey = `${percentEncode(credentials.apiSecret)}&${percentEncode(credentials.accessTokenSecret)}`;
  const signature = createHmac("sha1", signingKey).update(baseString).digest("base64");

  const headerParams: Record<string, string> = { ...oauthParams, oauth_signature: signature };
  return (
    "OAuth " +
    Object.keys(headerParams)
      .sort()
      .map((k) => `${percentEncode(k)}="${percentEncode(headerParams[k])}"`)
      .join(", ")
  );
}

function requireCredentials() {
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;
  if (isUnconfigured(apiKey) || isUnconfigured(apiSecret) || isUnconfigured(accessToken) || isUnconfigured(accessTokenSecret)) {
    throw new Error(
      "X posting isn't configured yet -- X_API_KEY/X_API_SECRET/X_ACCESS_TOKEN/X_ACCESS_TOKEN_SECRET aren't all set. See the round 90 checklist in CLOUD_CLAUDE.md for the one-time developer-project setup."
    );
  }
  return { apiKey: apiKey!, apiSecret: apiSecret!, accessToken: accessToken!, accessTokenSecret: accessTokenSecret! };
}

async function postOneTweet(text: string, replyToId: string | null, credentials: ReturnType<typeof requireCredentials>): Promise<string> {
  const body: { text: string; reply?: { in_reply_to_tweet_id: string } } = { text };
  if (replyToId) body.reply = { in_reply_to_tweet_id: replyToId };

  const res = await fetch(X_API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: oauthHeader("POST", X_API_BASE, credentials),
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as { data?: { id?: string }; detail?: string; title?: string };
  if (!res.ok || !data.data?.id) {
    throw new Error(`X API error (${res.status}): ${data.detail ?? data.title ?? "unknown"}`);
  }
  return data.data.id;
}

export const postToX: Poster = async (item) => {
  const credentials = requireCredentials();
  const posts = item.draftText
    .split(/\n\n---\n\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (posts.length === 0) throw new Error("X poster: empty draft, nothing to post.");

  // Round 112 Part B — checked before any real API call, not after a
  // partial failure mid-thread. See x-rate-limit.ts's own comment for why
  // this counts real posted writes from marketing_queue rather than
  // calling X's own usage endpoint.
  await assertXWriteBudget(posts.length);

  let previousId: string | null = null;
  let firstId: string | null = null;
  for (const post of posts) {
    previousId = await postOneTweet(post, previousId, credentials);
    if (!firstId) firstId = previousId;
  }

  // The API response only returns the tweet id, not the posting account's
  // handle -- X_HANDLE lets the returned URL be correct without a second
  // API call just to look up the account's own username.
  const handle = process.env.X_HANDLE || "CaseWhy";
  return { url: `https://x.com/${handle}/status/${firstId}` };
};
