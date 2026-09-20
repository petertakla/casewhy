import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site/metadata";
import type { ReactNode } from "react";
import Link from "next/link";
import { PublicPage } from "@/components/PublicPage";
import { PageFilter } from "@/components/PageFilter";
import { slugify } from "@/lib/search/slugify";

// Round 73 item 8 — the common trust/product questions this audience
// actually asks, previously scattered across the ToS, privacy policy, and
// inline disclaimers with no single page answering them directly.
// Answers below are pulled verbatim-in-substance from already-approved
// language (terms.html §2-3, privacy.html §4/§6 as of round 100's
// renumbering — was §3/§5, the Get Help hub's "free, no ads, ever" line) —
// this is a compilation task, not new policy-writing.
// See round73-seo-geo-foundation-task.md item 8.
//
// Round 104 — expanded 5 -> 16 questions, grouped under five headings.
// The original 5 stay word-for-word (per the task doc's own instruction)
// except "How is my case data protected?", which gains one new sentence.
// Every number/claim in the 11 new answers was checked against the real
// source of truth before shipping, per the task doc's explicit
// verification rule (round 97's own lesson) -- three real corrections
// came out of that check, documented inline below at each one.

export const metadata: Metadata = pageMetadata("/faq", {
  title: "Frequently Asked Questions | CaseWhy",
  description:
    "Answers to common questions about CaseWhy — tracking a case, AI explanations, Plus pricing, privacy, and how your data is protected.",

  languages: {
    en: "https://app.casewhy.com/faq",
    es: "https://app.casewhy.com/es/faq",
  },
});

// Round 110 follow-up — this page was statically prerendered, which meant
// the root layout's AuthHeader (needs per-request session data) couldn't
// be baked into the static HTML at all: Next.js deferred it to a client-
// only render for this page specifically. Confirmed live -- curl (no JS)
// showed zero <header> content, while a real browser showed it fine after
// hydration, but not in the initial HTML a crawler or slow-JS client
// would see. force-dynamic matches every other page in the app that
// needs the real signed-in header (processing-times, policy, etc.).
export const dynamic = "force-dynamic";

interface Faq {
  question: string;
  answer: ReactNode;
  /** Plain-text version for the FAQPage schema below — JSON-LD "text" can't
   * hold JSX, so any answer converted to JSX for real links needs its
   * link-free equivalent spelled out here too. Answers that are already a
   * plain string don't need this — the schema falls back to `answer` itself. */
  plainText?: string;
}

interface FaqGroup {
  heading: string;
  faqs: Faq[];
}

const GROUPS: FaqGroup[] = [
  {
    heading: "About CaseWhy",
    faqs: [
      {
        question: "Is CaseWhy affiliated with USCIS?",
        answer:
          "No. CaseWhy is not affiliated with, endorsed by, or operated by USCIS, the Department of Homeland Security, or any other government agency. CaseWhy displays information sourced from public government systems, but doesn't control that data and can't guarantee its accuracy, completeness, or timeliness.",
      },
      {
        question: "Who built CaseWhy, and why?",
        plainText:
          "CaseWhy is built by CaseWhy LLC, a small company in Florida, by a founder who spent fifteen years as a solution architect and then watched a family naturalization case stall at the last step. There's no venture funding and no ad network behind it. The founder's own account of why it exists is on the Updates page.",
        answer: (
          <>
            CaseWhy is built by CaseWhy LLC, a small company in Florida, by a
            founder who spent fifteen years as a solution architect and then
            watched a family naturalization case stall at the last step.
            There&apos;s no venture funding and no ad network behind it. The
            founder&apos;s own account of why it exists is on the{" "}
            <Link
              href="/updates/a-note-from-the-founder"
              className="text-brand-600 hover:underline dark:text-brand-400"
            >
              Updates page
            </Link>
            .
          </>
        ),
      },
      {
        question: "Is anything CaseWhy tells me legal advice?",
        plainText:
          "No. CaseWhy is not a law firm, does not provide legal advice, and using it does not create an attorney-client relationship of any kind. Explanations of your case status, AI chat answers, processing-time estimates, visa bulletin information, and escalation-toolkit drafting assistance are all general, informational content drawn from public USCIS materials — describing what a status or process generally means, never a conclusion about what you, specifically, should do about your case. For asylum (I-589) and DACA (I-821D) cases in particular, CaseWhy will never tell you whether you're eligible for relief or predict your case's outcome — only a licensed immigration attorney or accredited representative can do that, and CaseWhy will direct you to one whenever a question depends on your individual facts.",
        answer: (
          <>
            No. CaseWhy is not a law firm, does not provide legal advice, and
            using it does not create an attorney-client relationship of any
            kind. Explanations of your case status, AI chat answers,{" "}
            <Link
              href="/processing-times"
              className="text-brand-600 hover:underline dark:text-brand-400"
            >
              processing-time estimates
            </Link>
            ,{" "}
            <Link
              href="/visa-bulletin"
              className="text-brand-600 hover:underline dark:text-brand-400"
            >
              visa bulletin information
            </Link>
            , and escalation-toolkit drafting assistance are all general,
            informational content drawn from public USCIS materials — describing
            what a status or process generally means, never a conclusion about
            what you, specifically, should do about your case. For asylum
            (I-589) and DACA (I-821D) cases in particular, CaseWhy will never
            tell you whether you&apos;re eligible for relief or predict your
            case&apos;s outcome — only a licensed immigration attorney or
            accredited representative can do that, and CaseWhy will direct you
            to one whenever a question depends on your individual facts.
          </>
        ),
      },
    ],
  },
  {
    heading: "Tracking a case",
    faqs: [
      {
        question: "Which USCIS cases can I track?",
        answer:
          "Any case that has a USCIS receipt number — the 13-character number on your I-797 notice, three letters followed by ten digits (for example IOE, MSC, EAC, WAC, LIN, SRC, NBC, YSC; CaseWhy accepts any valid receipt-number format, not only these examples). That covers family petitions (I-130), green card applications (I-485), naturalization (N-400), work permits (I-765), travel documents (I-131), removal of conditions (I-751), employer petitions (I-129, I-140), asylum (I-589), and DACA (I-821D), among others. If USCIS Case Status Online shows it, CaseWhy can track it.",
      },
      {
        question: "How often does CaseWhy check my case?",
        answer:
          'Every tracked case is checked automatically once a day. CaseWhy Plus adds a "Check now" button for an on-demand check whenever you want one.',
      },
      {
        question: "How will I know when my status changes?",
        answer:
          "You get an email the day a status changes, and a push notification if you've turned notifications on for CaseWhy in your browser or phone. On iPhone, push requires adding CaseWhy to your home screen first — the Settings page walks you through it. Every change is also kept in the case's history timeline.",
      },
      {
        question: "Can I track a family member's case?",
        answer:
          "Yes — the free tier tracks up to three cases, and Plus tracks up to ten (with more available on request). You'll need the receipt number from their notice. Track only cases you're entitled to see; CaseWhy shows the same public status USCIS would show anyone with that number.",
      },
      {
        question:
          'What does "Case Was Received" mean, and what\'s a stalled case?',
        plainText:
          '"Case Was Received" is the first status almost every case shows; it confirms USCIS has your filing and fee, and nothing more. A case becomes "outside normal processing time" when it has waited longer than the time USCIS itself publishes for that form and office — CaseWhy Plus flags this automatically and shows the formal channels that open up at that point (a USCIS e-Request, a congressional inquiry, the CIS Ombudsman), and can draft those letters for you.',
        answer: (
          <>
            &quot;Case Was Received&quot; is the first status almost every case
            shows; it confirms USCIS has your filing and fee, and nothing more.
            A case becomes{" "}
            <Link
              href="/updates/when-your-case-goes-silent"
              className="text-brand-600 hover:underline dark:text-brand-400"
            >
              &quot;outside normal processing time&quot;
            </Link>{" "}
            when it has waited longer than the time USCIS itself publishes for
            that form and office — CaseWhy Plus flags this automatically and
            shows the formal channels that open up at that point (a USCIS
            e-Request, a congressional inquiry, the CIS Ombudsman), and can
            draft those letters for you. See also{" "}
            <Link
              href="/updates/what-case-was-received-actually-means"
              className="text-brand-600 hover:underline dark:text-brand-400"
            >
              what &quot;Case Was Received&quot; actually means
            </Link>
            .
          </>
        ),
      },
    ],
  },
  {
    heading: "Ask CaseWhy and AI explanations",
    faqs: [
      {
        question: "Do I need an account to ask a question?",
        plainText:
          "No. Ask CaseWhy on the Get Help page answers three questions without any sign-in. Asking about your own tracked case is a CaseWhy Plus feature, with unlimited questions.",
        answer: (
          <>
            No. Ask CaseWhy on the{" "}
            <Link
              href="/get-help"
              className="text-brand-600 hover:underline dark:text-brand-400"
            >
              Get Help
            </Link>{" "}
            page answers three questions without any sign-in. Asking about your
            own tracked case is a{" "}
            <Link href="/plus" className="text-brand-600 hover:underline dark:text-brand-400">
              CaseWhy Plus
            </Link>{" "}
            feature, with unlimited questions.
          </>
        ),
      },
      {
        // Corrected during round 104's verification pass: the draft claimed
        // a "Report incorrect information" link exists on explanation
        // pages -- it doesn't. Round 41 built that link only for Get Help
        // directory listings (ReportListingLink.tsx), a different feature
        // entirely; nothing similar exists near AI explanations or chat.
        // Rewritten to point at the real corrections@ alias instead (round
        // 70's alias pipeline confirms it's a real, handled address).
        question: "How accurate are the AI explanations?",
        answer:
          "The explanations describe what a status or process generally means, drawn from USCIS's own published materials. Every account gets the complete plain-language explanation; CaseWhy Plus additionally shows the specific source it was built from. They can be wrong or out of date, and they never know facts about your case that USCIS hasn't published. If something looks off, email corrections@casewhy.com — a person reads every message.",
      },
      {
        // Corrected during round 104's verification pass: the draft
        // claimed case explanations are available in Spanish. Checked
        // src/lib/ai/explain.ts and chat.ts directly -- neither takes a
        // locale parameter or has any language instruction at all, so
        // signed-in case explanations and the "Ask a question" chat
        // always reply in English, regardless of the page's language.
        // Only the separate anonymous Get Help chat (round 105) is
        // actually Spanish-aware. Rewritten to state this real gap
        // honestly rather than overclaim -- per the task doc's own "if a
        // draft answer describes something the product doesn't do, the
        // answer changes, never the product" rule.
        question: "Is CaseWhy available in Spanish?",
        plainText:
          'Yes — the site, the app, Get Help (including its free-text question box), and the FAQ are available in Spanish; use the Español link at the top of any page. Some reference pages are still English-only and marked "(en inglés)" where they\'re linked. The AI-generated case explanations and the signed-in "Ask a question" chat currently reply in English only, even on a Spanish-language page — a gap we\'re aware of.',
        answer: (
          <>
            Yes — the site, the app,{" "}
            <Link
              href="/get-help"
              className="text-brand-600 hover:underline dark:text-brand-400"
            >
              Get Help
            </Link>{" "}
            (including its free-text question box), and the FAQ are available in
            Spanish; use the Español link at the top of any page. Some reference
            pages are still English-only and marked &quot;(en inglés)&quot;
            where they&apos;re linked. The AI-generated case explanations and
            the signed-in &quot;Ask a question&quot; chat currently reply in
            English only, even on a Spanish-language page — a gap we&apos;re
            aware of.
          </>
        ),
      },
    ],
  },
  {
    heading: "CaseWhy Plus",
    faqs: [
      {
        question: "Is CaseWhy really free?",
        plainText:
          "CaseWhy has a free tier — up to three tracked cases, a status timeline, and AI-generated plain-language explanations — plus an optional paid Plus tier for tracking more cases, AI chat about your case, and other add-ons (see the Plus page for current pricing). Get Help — CaseWhy's directories of free legal aid, accredited representatives, attorneys, and other resources — is free to everyone, always, regardless of subscription: no fees, no ads, no hidden cost.",
        answer: (
          <>
            CaseWhy has a free tier — up to three tracked cases, a status
            timeline, and AI-generated plain-language explanations — plus an
            optional paid Plus tier for tracking more cases, AI chat about
            your case, and other add-ons
            (see the{" "}
            <Link
              href="/plus"
              className="text-brand-600 hover:underline dark:text-brand-400"
            >
              Plus page
            </Link>{" "}
            for current pricing).{" "}
            <Link
              href="/get-help"
              className="text-brand-600 hover:underline dark:text-brand-400"
            >
              Get Help
            </Link>{" "}
            — CaseWhy&apos;s directories of free legal aid, accredited
            representatives, attorneys, and other resources — is free to
            everyone, always, regardless of subscription: no fees, no ads, no
            hidden cost.
          </>
        ),
      },
      {
        // Corrected during round 104's verification pass: the draft said
        // to cancel from "Settings -> Manage subscription." /settings has
        // no billing UI at all (confirmed by reading the file -- the same
        // finding round 109 hit independently). The real "Manage
        // subscription" link lives on the /plus page itself.
        question: "What does Plus cost, and how do I cancel?",
        plainText:
          "Plus is $9.99 a month, $39.99 every 6 months, or $69.99 a year, billed through Stripe. Cancel any time from the Manage subscription link on the Plus page; you keep Plus until the end of the period you've paid for, with no refund for unused time. Switching between plans later is prorated automatically.",
        answer: (
          <>
            Plus is $9.99 a month, $39.99 every 6 months, or $69.99 a year,
            billed through Stripe. Cancel any time from the &quot;Manage
            subscription&quot; link on the{" "}
            <Link
              href="/plus"
              className="text-brand-600 hover:underline dark:text-brand-400"
            >
              Plus page
            </Link>
            ; you keep Plus until the end of the period you&apos;ve paid for,
            with no refund for unused time. Switching between plans later is
            prorated automatically.
          </>
        ),
      },
      {
        question: "Can I share my case with my attorney?",
        plainText:
          "Plus includes an attorney-handoff PDF: your case timeline, status history, and the explanations in one document you can send to your lawyer or accredited representative. If you don't have one yet, Get Help lists free legal aid, accredited representatives, and attorneys, free to everyone.",
        answer: (
          <>
            Plus includes an attorney-handoff PDF: your case timeline, status
            history, and the explanations in one document you can send to your
            lawyer or accredited representative. If you don&apos;t have one yet,{" "}
            <Link
              href="/get-help"
              className="text-brand-600 hover:underline dark:text-brand-400"
            >
              Get Help
            </Link>{" "}
            lists free legal aid, accredited representatives, and attorneys,
            free to everyone.
          </>
        ),
      },
    ],
  },
  {
    heading: "Privacy and your data",
    faqs: [
      {
        question: "How is my case data protected?",
        answer:
          "Case and account data is encrypted both at rest and in transit. CaseWhy doesn't sell or rent personal information to third parties, doesn't use case data for advertising, and runs no advertising of any kind — there's no ad network for data to reach in the first place. Data is retained for as long as an account is active; a dormant account doesn't get different handling or earlier deletion. USCIS treats receipt numbers as personally identifiable information, and so does CaseWhy: receipt numbers get additional application-level encryption before they're stored, are used only to check your case status with USCIS (and, on Plus, to draft escalation letters that have to state them), and no CaseWhy staff member can view them in plaintext through any administrative tool.",
      },
      {
        question: "What happens to my data if I cancel or delete my account?",
        answer:
          "You can remove an individual tracked case at any time from your dashboard — that deletes it immediately. Full account deletion is a request, not a self-serve button: email privacy@casewhy.com and your account and case data are permanently deleted within 30 days.",
      },
    ],
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: GROUPS.flatMap((group) =>
    group.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.plainText ?? (faq.answer as string),
      },
    })),
  ),
};

export default function FaqPage() {
  return (
    <PublicPage es={false} switcherHref="/es/faq">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <h1 className="text-2xl font-bold tracking-tight">
        Frequently asked questions
      </h1>
      <p className="mb-2 mt-2 text-muted">
        Looking for a step-by-step walkthrough instead? See the{" "}
        <Link
          href="/help"
          className="text-brand-600 hover:underline dark:text-brand-400"
        >
          How-To Guides
        </Link>
        .
      </p>
      <p className="mb-8 text-muted">
        The most common questions about CaseWhy. For full detail, see the{" "}
        <a
          href="https://casewhy.com/terms.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 hover:underline dark:text-brand-400"
        >
          Terms of Service
        </a>{" "}
        and{" "}
        <a
          href="https://casewhy.com/privacy.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 hover:underline dark:text-brand-400"
        >
          Privacy Policy
        </a>
        .
      </p>

      <PageFilter
        basePath="/faq"
        placeholder="Search these questions…"
        noMatchText="No questions on this page match."
        isSpanish={false}
      />

      <div className="space-y-10">
        {GROUPS.map((group) => (
          <div key={group.heading}>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted">
              {group.heading}
            </h2>
            <div className="space-y-6">
              {group.faqs.map((faq) => (
                <div
                  key={faq.question}
                  id={slugify(faq.question)}
                  className="scroll-mt-20"
                >
                  <h3 className="text-base font-semibold text-foreground">
                    {faq.question}
                  </h3>
                  <p className="mt-2 text-sm text-muted">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PublicPage>
  );
}
