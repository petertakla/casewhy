import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { PublicPage } from "@/components/PublicPage";

// Round 73 item 8 — the common trust/product questions this audience
// actually asks, previously scattered across the ToS, privacy policy, and
// inline disclaimers with no single page answering them directly.
// Answers below are pulled verbatim-in-substance from already-approved
// language (terms.html §2-3, privacy.html §4/§6 as of round 100's
// renumbering — was §3/§5, the Get Help hub's "free, no ads, ever" line) —
// this is a compilation task, not new policy-writing.
// See round73-seo-geo-foundation-task.md item 8.

export const metadata: Metadata = {
  title: "Frequently Asked Questions | CaseWhy",
  description:
    "Answers to common questions about CaseWhy — affiliation with USCIS, pricing, legal advice, and how your case data is protected.",
  alternates: {
    languages: {
      en: "https://app.casewhy.com/faq",
      es: "https://app.casewhy.com/es/faq",
    },
  },
};

interface Faq {
  question: string;
  answer: ReactNode;
  /** Plain-text version for the FAQPage schema below — JSON-LD "text" can't
   * hold JSX, so any answer converted to JSX for real links needs its
   * link-free equivalent spelled out here too. Answers that are already a
   * plain string don't need this — the schema falls back to `answer` itself. */
  plainText?: string;
}

// Complete-check follow-up (round 84's internal-linking audit) — these
// answers reference the Plus page, Get Help, processing-time estimates,
// and visa bulletin information by name without linking to any of them.
// Only the two answers that actually reference other CaseWhy pages needed
// converting from a plain string to JSX; the rest stay plain strings.
const FAQS: Faq[] = [
  {
    question: "Is CaseWhy affiliated with USCIS?",
    answer:
      "No. CaseWhy is not affiliated with, endorsed by, or operated by USCIS, the Department of Homeland Security, or any other government agency. CaseWhy displays information sourced from public government systems, but doesn't control that data and can't guarantee its accuracy, completeness, or timeliness.",
  },
  {
    question: "Is CaseWhy really free?",
    plainText:
      "CaseWhy has a free tier — up to three tracked cases, a status timeline, AI-generated plain-language explanations, and three AI questions about your case each month — plus an optional paid Plus tier for tracking more cases, unlimited questions, and other add-ons (see the Plus page for current pricing). Get Help — CaseWhy's directories of free legal aid, accredited representatives, attorneys, and other resources — is free to everyone, always, regardless of subscription: no fees, no ads, no hidden cost.",
    answer: (
      <>
        CaseWhy has a free tier — up to three tracked cases, a status timeline, AI-generated plain-language
        explanations, and three AI questions about your case each month — plus an optional paid Plus tier for
        tracking more cases, unlimited questions, and other add-ons (see the{" "}
        <Link href="/plus" className="text-brand-600 hover:underline dark:text-brand-400">
          Plus page
        </Link>{" "}
        for current pricing).{" "}
        <Link href="/get-help" className="text-brand-600 hover:underline dark:text-brand-400">
          Get Help
        </Link>{" "}
        — CaseWhy&apos;s directories of free legal aid, accredited representatives, attorneys, and other resources —
        is free to everyone, always, regardless of subscription: no fees, no ads, no hidden cost.
      </>
    ),
  },
  {
    question: "Is anything CaseWhy tells me legal advice?",
    plainText:
      "No. CaseWhy is not a law firm, does not provide legal advice, and using it does not create an attorney-client relationship of any kind. Explanations of your case status, AI chat answers, processing-time estimates, visa bulletin information, and escalation-toolkit drafting assistance are all general, informational content drawn from public USCIS materials — describing what a status or process generally means, never a conclusion about what you, specifically, should do about your case. For asylum (I-589) and DACA (I-821D) cases in particular, CaseWhy will never tell you whether you're eligible for relief or predict your case's outcome — only a licensed immigration attorney or accredited representative can do that, and CaseWhy will direct you to one whenever a question depends on your individual facts.",
    answer: (
      <>
        No. CaseWhy is not a law firm, does not provide legal advice, and using it does not create an
        attorney-client relationship of any kind. Explanations of your case status, AI chat answers,{" "}
        <Link href="/processing-times" className="text-brand-600 hover:underline dark:text-brand-400">
          processing-time estimates
        </Link>
        ,{" "}
        <Link href="/visa-bulletin" className="text-brand-600 hover:underline dark:text-brand-400">
          visa bulletin information
        </Link>
        , and escalation-toolkit drafting assistance are all general, informational content drawn from public USCIS
        materials — describing what a status or process generally means, never a conclusion about what you,
        specifically, should do about your case. For asylum (I-589) and DACA (I-821D) cases in particular, CaseWhy
        will never tell you whether you&apos;re eligible for relief or predict your case&apos;s outcome — only a
        licensed immigration attorney or accredited representative can do that, and CaseWhy will direct you to one
        whenever a question depends on your individual facts.
      </>
    ),
  },
  {
    question: "How is my case data protected?",
    answer:
      "Case and account data is encrypted both at rest and in transit. CaseWhy doesn't sell or rent personal information to third parties, doesn't use case data for advertising, and runs no advertising of any kind — there's no ad network for data to reach in the first place. Data is retained for as long as an account is active; a dormant account doesn't get different handling or earlier deletion.",
  },
  {
    question: "What happens to my data if I cancel or delete my account?",
    answer:
      "If you delete your account, your case data is permanently deleted within 30 days. You can access, correct, or delete your data at any time from account settings, or by emailing privacy@casewhy.com.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.plainText ?? (faq.answer as string) },
  })),
};

export default function FaqPage() {
  return (
    <PublicPage es={false} switcherHref="/es/faq">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <h1 className="text-2xl font-bold tracking-tight">Frequently asked questions</h1>
      <p className="mb-8 mt-2 text-muted">
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

      <div className="space-y-6">
        {FAQS.map((faq) => (
          <div key={faq.question}>
            <h2 className="text-base font-semibold text-foreground">{faq.question}</h2>
            <p className="mt-2 text-sm text-muted">{faq.answer}</p>
          </div>
        ))}
      </div>
    </PublicPage>
  );
}
