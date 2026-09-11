// Round 69 — one entry per legal document, reusing the "Last updated" date
// already printed on terms.html/privacy.html as the version string (not a
// separate scheme). Bump the matching entry here (version + effectiveDate +
// summary) every time either static page has a material change; nothing
// reads this automatically from the HTML.

export type PolicyType = "tos" | "privacy";

export interface PolicyVersionInfo {
  /** Matches the "Last updated" date on the corresponding static page. */
  version: string;
  /** Same date, as a real Date — an account created on/after this date
   * already agreed to this version at signup, so it's never gated for it. */
  effectiveDate: Date;
  /** Plain-language bullets shown on the acknowledgment gate. */
  summary: string[];
}

export const POLICY_VERSIONS: Record<PolicyType, PolicyVersionInfo> = {
  tos: {
    version: "September 11, 2026",
    effectiveDate: new Date("2026-09-11T00:00:00Z"),
    summary: [
      "CaseWhy is now operated by CaseWhy LLC, a Florida limited liability company — not a sole proprietorship as before.",
      "Material changes to these Terms now require your active acknowledgment (like this screen), not just an email notice.",
    ],
  },
  privacy: {
    version: "September 11, 2026",
    effectiveDate: new Date("2026-09-11T00:00:00Z"),
    summary: [
      "Added a data-breach notification commitment — if a breach ever affects your data, we'll notify you and explain what to do next.",
      "Clarified that a dormant (inactive but not deleted) account is retained under this same policy, not handled any differently.",
      "Clarified that we never share de-identified or anonymized data with anyone beyond the service providers already listed in this policy.",
      "Material changes to this policy now require your active acknowledgment (like this screen), not just an email notice.",
    ],
  },
};
