// Round 119 follow-up — grounds the alias-reply drafter (src/lib/email-
// aliases/draft-response.ts) in CaseWhy's real product knowledge instead
// of the model's own general training. Before this, draftAliasResponse()
// got only a one-line `purpose` string per alias -- accurate enough for
// the model to know what KIND of email this is, but nothing about how
// the actual app works, so a real "how do I add multiple receipts?"
// question had no grounded answer to draw from.
//
// Same category-tag-and-match shape as kb/policy-memos.ts's
// findRelevantPolicyContext() -- entries are content, categories are the
// reuse key, so a fact (e.g. Plus pricing/limits) is written once and
// reused by every alias whose own category list includes it, rather than
// duplicated per alias. Kept as code, not an admin-editable DB table --
// same convention as policy-memos.ts/faq-search-data.ts: this is curated
// product content a founder writes and reviews, not a runtime setting.
//
// Every answer below was verified against the real UI code before being
// written here (see each entry's own comment), not guessed at -- the
// whole point of this file is to stop the model from guessing.

export type HelpCategory = "tracking" | "account" | "billing" | "notifications" | "privacy" | "documents";

export interface HelpKnowledgeEntry {
  id: string;
  categories: HelpCategory[];
  topic: string;
  answer: string;
}

export const HELP_KNOWLEDGE: HelpKnowledgeEntry[] = [
  {
    id: "add-a-case",
    categories: ["tracking", "account"],
    topic: "Tracking an additional case (adding a receipt number)",
    // Verified against src/app/dashboard/DashboardSearchArea.tsx +
    // TrackCaseButton.tsx: the search box's own placeholder text and the
    // button's real cap-reached copy.
    answer:
      "On the Dashboard, look up a receipt number in the search box, then click \"Track this case\" on the result to save it. Repeat for each additional case. The free tier tracks up to 3 cases at once; CaseWhy Plus tracks up to 10.",
  },
  {
    id: "remove-a-case",
    categories: ["tracking", "account"],
    // Verified against src/app/dashboard/TrackedCasesList.tsx: the real
    // button label and its action, untrackCase().
    topic: "Removing a tracked case",
    answer:
      "On the Dashboard, find the case in your tracked-cases list and click \"Stop tracking.\" This only removes it from your account -- it does not affect the real USCIS case in any way.",
  },
  {
    id: "upgrade-to-plus",
    categories: ["billing", "account"],
    // Verified against src/app/plus/page.tsx (per-tier Subscribe button,
    // Stripe Checkout) and round 118's real current prices.
    topic: "Upgrading to CaseWhy Plus",
    answer:
      "Go to the Plus page and click Subscribe on the plan you want -- $9.99/month, $39.99/6 months, or $69.99/year, billed through Stripe. Plus adds tracking up to 10 cases, faster/on-demand status checks, the Ask CaseWhy AI chat, and an attorney-handoff PDF.",
  },
  {
    id: "switch-or-cancel-plus",
    categories: ["billing", "account"],
    // Verified against round 115's /plus/manage build: real prorated
    // switching, downgrade-to-free/cancel as a de-emphasized option.
    topic: "Switching plans or cancelling Plus",
    answer:
      "Go to the Plus page (it links to \"Manage plan\" once subscribed) to switch between plans -- Stripe shows the real prorated charge before you confirm. Cancelling is also there, listed below the plan picker; it takes effect at the end of the current billing period, not immediately.",
  },
  {
    id: "email-and-push-notifications",
    categories: ["notifications", "account"],
    // Verified against src/app/settings/SettingsForm.tsx: the real email
    // toggle (updateStatusChangeEmails) and push toggle (PushNotificationsRow).
    topic: "Turning notifications on or off",
    answer:
      "On the Settings page: email notifications for status changes can be toggled on/off directly. Push notifications need to be explicitly enabled there too (the browser will ask for permission) -- on iPhone/iPad, CaseWhy must first be added to the home screen (Share -> Add to Home Screen), since Safari doesn't support push notifications in a regular browser tab.",
  },
  {
    id: "documents-per-case",
    categories: ["documents", "tracking"],
    // Verified against src/app/dashboard/DocumentVault.tsx: documents are
    // tied to one tracked case, not the account as a whole.
    topic: "Storing documents for a case",
    answer:
      "Each tracked case has its own document area on its Dashboard card -- documents are attached to that specific case, not shared across every case on the account. A case has to actually be tracked first before documents can be stored for it.",
  },
  {
    id: "account-and-data-deletion",
    categories: ["privacy", "account"],
    // Verified against src/lib/search/faq-search-data.ts's own real FAQ
    // entry (the source of truth for this fact, reused here rather than
    // restated independently).
    topic: "Deleting a case vs. deleting the whole account",
    answer:
      "Removing a single case is instant and self-service (\"Stop tracking\" on the Dashboard). Deleting the entire account and all its data is a request to privacy@casewhy.com or privacy-requests@casewhy.com, completed within 30 days.",
  },
];

// Round 119 follow-up — which categories each alias draws from. New
// aliases default to no categories (an empty array) rather than
// everything, so a future alias doesn't silently start citing product
// facts nobody has reviewed for its context -- add categories
// deliberately per alias, the same "don't guess, be told" discipline as
// the rest of this file.
export const ALIAS_HELP_CATEGORIES: Record<string, HelpCategory[]> = {
  help: ["tracking", "account", "notifications", "documents", "billing"],
  billing: ["billing", "account"],
  acknowledgment: ["account"],
  corrections: ["tracking"],
  "privacy-requests": ["privacy", "account"],
  privacy: ["privacy"],
};

export function getRelevantHelpKnowledge(alias: string): HelpKnowledgeEntry[] {
  const categories = ALIAS_HELP_CATEGORIES[alias];
  if (!categories || categories.length === 0) return [];
  return HELP_KNOWLEDGE.filter((entry) => entry.categories.some((c) => categories.includes(c)));
}
