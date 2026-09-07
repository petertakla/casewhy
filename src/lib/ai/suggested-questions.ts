// Round 20, item 4 — contextual suggested-question pills for the AI chat.
// Deliberately keyed only off status text/form type (data every case
// actually has), not visa-bulletin priority-date proximity — nothing in the
// Case Status API ties a specific case to a country/category/priority date,
// so a bulletin-based suggestion would have to guess. Every question here is
// answerable from what's already in the KB/chat's own grounding, per the
// round-20 scope note — no new content requirement.

export function suggestedQuestions(statusText: string, formType: string): string[] {
  const s = statusText.toLowerCase();
  const qs: string[] = [];

  if (s.includes("request for evidence") || s.includes("rfe")) {
    qs.push("What is an RFE?", "How long do I have to respond to this?");
  } else if (s.includes("notice of intent to deny") || s.includes("noid")) {
    qs.push("What is a NOID, and does it mean my case will be denied?");
  } else if (s.includes("interview")) {
    qs.push("What should I bring to my interview?", "How can I prepare for this?");
  } else if (s.includes("biometrics")) {
    qs.push("What happens at a biometrics appointment?");
  } else if (s.includes("approved")) {
    qs.push("What happens next now that this is approved?");
  } else if (s.includes("card was")) {
    qs.push("Is there anything else I need to do?");
  } else {
    qs.push("What does this status mean?", "Why might this be taking longer than usual?");
  }

  if (formType.toUpperCase() === "N-400") {
    qs.push("What happens after naturalization is approved?");
  }

  return qs.slice(0, 4);
}
