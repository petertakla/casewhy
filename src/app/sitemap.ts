import type { MetadataRoute } from "next";
import { getAttorneyDirectory } from "@/lib/attorneys/directory";
import { getAccreditedRepresentativeDirectory } from "@/lib/accredited-representatives/directory";
import { getLegalAidDirectory } from "@/lib/legal-aid/directory";
import { getDsoDirectory } from "@/lib/dso/directory";
import { getCommunityOrgDirectory } from "@/lib/community-orgs/directory";
import { getProBonoRepresentationDirectory } from "@/lib/pro-bono-representation/directory";
import { POLICY_MEMOS } from "@/lib/kb/policy-memos";

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
  const staticPaths = [
    "",
    "/get-help",
    "/get-help/ask",
    "/attorneys",
    "/attorneys/join",
    "/accredited-representatives",
    "/accredited-representatives/join",
    "/legal-aid",
    "/legal-aid/join",
    "/dso",
    "/dso/join",
    "/community-orgs",
    "/community-orgs/join",
    "/pro-bono-representation",
    "/pro-bono-representation/join",
    "/news",
    "/policy",
    "/sitemap",
    "/faq",
    "/plus",
    "/processing-times",
    "/visa-bulletin",
    // Round 79 — Spanish translations of /plus, /get-help, and the six
    // entity-type list pages. Join forms and detail/permalink pages stay
    // English-only, out of this round's scope.
    "/es/plus",
    "/es/get-help",
    "/es/attorneys",
    "/es/accredited-representatives",
    "/es/legal-aid",
    "/es/dso",
    "/es/community-orgs",
    "/es/pro-bono-representation",
  ];

  const [attorneys, reps, legalAid, dsos, communityOrgs, proBono] = await Promise.all([
    getAttorneyDirectory(),
    getAccreditedRepresentativeDirectory(),
    getLegalAidDirectory(),
    getDsoDirectory(),
    getCommunityOrgDirectory(),
    getProBonoRepresentationDirectory(),
  ]);

  const entityPaths = [
    ...attorneys.map((a) => `/attorneys/${a.slug}`),
    ...reps.map((r) => `/accredited-representatives/${r.slug}`),
    ...legalAid.map((l) => `/legal-aid/${l.slug}`),
    ...dsos.map((d) => `/dso/${d.slug}`),
    ...communityOrgs.map((c) => `/community-orgs/${c.slug}`),
    ...proBono.map((p) => `/pro-bono-representation/${p.slug}`),
  ];

  const policyPaths = POLICY_MEMOS.map((memo) => `/policy/${memo.id}`);

  // /news/[id] permalinks deliberately excluded — they resolve against a
  // live feed and age out within days/weeks (see news/[id]/page.tsx's own
  // comment), not stable enough for a sitemap entry.
  const lastModified = new Date();
  return [...staticPaths, ...entityPaths, ...policyPaths].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified,
  }));
}
