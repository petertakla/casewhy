import type { MetadataRoute } from "next";
import { getAttorneyDirectory } from "@/lib/attorneys/directory";
import { getAccreditedRepresentativeDirectory } from "@/lib/accredited-representatives/directory";
import { getLegalAidDirectory } from "@/lib/legal-aid/directory";
import { getDsoDirectory } from "@/lib/dso/directory";
import { getCommunityOrgDirectory } from "@/lib/community-orgs/directory";
import { getProBonoRepresentationDirectory } from "@/lib/pro-bono-representation/directory";
import { POLICY_MEMOS } from "@/lib/kb/policy-memos";
import { COURT_RULINGS } from "@/lib/kb/court-rulings";
import { getPublishedUpdates } from "@/lib/updates/updates";
import { PUBLIC_PAGES } from "@/lib/site/pages";

const BASE_URL = "https://app.casewhy.com";

// Round 73 — app.casewhy.com had never had a sitemap at all (confirmed:
// zero site:app.casewhy.com results). Build-time/request-time generation,
// not a hand-maintained file, per the task's own instruction — this project
// adds new public pages (and re-seeds entity directories) too often for a
// static list to stay accurate. Revalidated hourly rather than on every
// request: a sitemap doesn't need per-request freshness, and several of
// these directories are already large (thousands of rows).
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Round 99 — driven by the same registry the human site index and
  // footer read from (src/lib/site/pages.ts), instead of its own
  // hand-maintained copy of the same list. External pages (the marketing
  // site, privacy/terms) never had `showInSitemapXml: true` and are
  // filtered out here the same as before.
  const staticPaths = PUBLIC_PAGES.filter((p) => p.showInSitemapXml && !p.external).flatMap((p) =>
    p.hrefEs && p.hrefEs.startsWith("/") ? [p.href, p.hrefEs] : [p.href]
  );

  // A DB outage shouldn't take the entire build down over a metadata route —
  // degrade to static-only paths rather than failing the build/request.
  let attorneys: Awaited<ReturnType<typeof getAttorneyDirectory>> = [];
  let reps: Awaited<ReturnType<typeof getAccreditedRepresentativeDirectory>> = [];
  let legalAid: Awaited<ReturnType<typeof getLegalAidDirectory>> = [];
  let dsos: Awaited<ReturnType<typeof getDsoDirectory>> = [];
  let communityOrgs: Awaited<ReturnType<typeof getCommunityOrgDirectory>> = [];
  let proBono: Awaited<ReturnType<typeof getProBonoRepresentationDirectory>> = [];
  let updates: Awaited<ReturnType<typeof getPublishedUpdates>> = [];
  try {
    [attorneys, reps, legalAid, dsos, communityOrgs, proBono, updates] = await Promise.all([
      getAttorneyDirectory(),
      getAccreditedRepresentativeDirectory(),
      getLegalAidDirectory(),
      getDsoDirectory(),
      getCommunityOrgDirectory(),
      getProBonoRepresentationDirectory(),
      getPublishedUpdates(),
    ]);
  } catch (err) {
    console.error("sitemap.xml: DB-dependent paths unavailable, falling back to static paths only", err);
  }

  const entityPaths = [
    ...attorneys.map((a) => `/attorneys/${a.slug}`),
    ...reps.map((r) => `/accredited-representatives/${r.slug}`),
    ...legalAid.map((l) => `/legal-aid/${l.slug}`),
    ...dsos.map((d) => `/dso/${d.slug}`),
    ...communityOrgs.map((c) => `/community-orgs/${c.slug}`),
    ...proBono.map((p) => `/pro-bono-representation/${p.slug}`),
  ];

  const policyPaths = POLICY_MEMOS.map((memo) => `/policy/${memo.id}`);
  const courtRulingPaths = COURT_RULINGS.map((ruling) => `/court-rulings/${ruling.id}`);
  // Round 108 — each post's own lastmod is now its real publishedAt
  // (America/New_York, set from the round-89 queue row's postedAt),
  // not the blanket "now" every other path below gets -- these are the
  // "sitemap.xml lastmod for the five URLs" the task doc's verify-live
  // step checks directly.
  const updateEntries = updates.map((post) => ({
    url: `${BASE_URL}/updates/${post.slug}`,
    lastModified: new Date(`${post.publishedAt}T00:00:00Z`),
  }));

  // /news/[id] permalinks deliberately excluded — they resolve against a
  // live feed and age out within days/weeks (see news/[id]/page.tsx's own
  // comment), not stable enough for a sitemap entry.
  const lastModified = new Date();
  return [
    // Round 73 follow-up (Sep 18) — the root entry (`path === ""`, per
    // pages.ts's own comment) rendered as `https://app.casewhy.com` with
    // no trailing slash; every other entry already had one via its own
    // leading `/`. Cosmetic-only fix, doesn't change the entry's own
    // deliberate inclusion despite being a redirect (see pages.ts).
    ...[...staticPaths, ...entityPaths, ...policyPaths, ...courtRulingPaths].map((path) => ({
      url: path === "" ? `${BASE_URL}/` : `${BASE_URL}${path}`,
      lastModified,
    })),
    ...updateEntries,
  ];
}
