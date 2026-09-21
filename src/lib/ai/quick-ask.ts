// Round 66 — the two quick-ask questions, extracted to a shared module in
// round 127 so both the client (CaseChat.tsx) and the server (/api/chat's
// route, to reliably detect these two exact prompts and append a guaranteed
// disclaimer — see that route's own comment) import the identical message
// text, rather than risking drift between two copies.
//
// Round 127 — the "applies" message used to literally instruct the model to
// "Answer yes, no, or uncertain" — a direct legal-conclusion verdict. Found
// to conflict with chat.ts's own new guardrail rule (never assert a
// personalized legal conclusion, in either direction) while wiring up the
// same two questions for policy memos and court rulings. Reworded to ask
// for the same useful information — whether the general category this
// policy/ruling describes plausibly matches this case's facts — without
// requesting a yes/no verdict, so the prompt itself no longer fights the
// guardrail that's supposed to constrain its answer.
export const QUICK_ASK = {
  applies: {
    label: "Does it apply to me?",
    labelEs: "¿Aplica a mi caso?",
    message:
      "Based on the general category, form type, dates, or facts this specific policy or news item describes, does my case's own form type, status, and dates plausibly fall into that same general description? Explain your reasoning by comparing the policy's stated scope to my case's facts — don't issue a yes/no verdict about whether it legally applies to me, and don't get into what it would mean for my case yet, just whether the general description plausibly matches.",
  },
  explains: {
    label: "How it applies to me?",
    labelEs: "¿Cómo aplica a mi caso?",
    message:
      "Assuming the general category this policy or news item describes plausibly matches my case's facts, explain concretely what that generally means for someone in that situation — what it generally changes about expected next steps or timeline — without concluding that it definitely does or doesn't apply to my specific case.",
  },
} as const;

export type QuickAskKind = keyof typeof QUICK_ASK;
