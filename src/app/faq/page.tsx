import type { Metadata } from "next";
import Link from "next/link";

// Round 73 item 8 — the common trust/product questions this audience
// actually asks, previously scattered across the ToS, privacy policy, and
// inline disclaimers with no single page answering them directly.
// Answers below are pulled verbatim-in-substance from already-approved
// language (terms.html §2-3, privacy.html §3/§5, the Get Help hub's "free,
// no ads, ever" line) — this is a compilation task, not new policy-writing.
// See round73-seo-geo-foundation-task.md item 8.

export const metadata: Metadata = {
  title: "Frequently Asked Questions | CaseWhy",
  description:
    "Answers to common questions about CaseWhy — affiliation with USCIS, pricing, legal advice, and how your case data is protected.",
};

interface Faq {
  question: string;
  answer: string;
}

const FAQS: Faq[] = [
  {
    question: "Is CaseWhy affiliated with USCIS?",
    answer:
      "No. CaseWhy is not affiliated with, endorsed by, or operated by USCIS, the Department of Homeland Security, or any other government agency. CaseWhy displays information sourced from public government systems, but doesn't control that data and can't guarantee its accuracy, completeness, or timeliness.",
  },
  {
    question: "Is CaseWhy really free?",
    answer:
      "CaseWhy has a free tier — one tracked case, a status timeline, and AI-generated plain-language explanations — plus an optional paid Plus tier for tracking multiple cases and other add-ons (see the Plus page for current pricing). Get Help — CaseWhy's directories of attorneys, accredited representatives, legal aid organizations, and other resources — is free to everyone, always, regardless of subscription: no fees, no ads, no hidden cost.",
  },
  {
    question: "Is anything CaseWhy tells me legal advice?",
    answer:
      "No. CaseWhy is not a law firm, does not provide legal advice, and using it does not create an attorney-client relationship of any kind. Explanations of your case status, AI chat answers, processing-time estimates, visa bulletin information, and escalation-toolkit drafting assistance are all general, informational content drawn from public USCIS materials — describing what a status or process generally means, never a conclusion about what you, specifically, should do about your case. For asylum (I-589) and DACA (I-821D) cases in particular, CaseWhy will never tell you whether you're eligible for relief or predict your case's outcome — only a licensed immigration attorney or accredited representative can do that, and CaseWhy will direct you to one whenever a question depends on your individual facts.",
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
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export default function FaqPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
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

      <p className="mt-8 text-xs text-muted">
        Have a question this doesn&apos;t answer? See the{" "}
        <Link href="/sitemap" className="text-brand-600 hover:underline dark:text-brand-400">
          site index
        </Link>{" "}
        or email <a href="mailto:hello@casewhy.com" className="text-brand-600 hover:underline dark:text-brand-400">hello@casewhy.com</a>.
      </p>
    </main>
  );
}
