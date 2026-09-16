// TEMPORARY — round 113 follow-up. Lists real sender addresses under each
// Social Media/* label in info@casewhy.com's Gmail, so a per-platform
// filter can be built from a real observed sender domain (round 87's own
// rule: never guess a sender domain) rather than assumed. DELETE this
// route (and the getGmailClientForDebug export it depends on) once done.

import { isAuthorizedCronRequest } from "@/lib/auth/cron-auth";
import { getGmailClientForDebug } from "@/lib/email-aliases/gmail-client";

const LABELS = [
  "Social Media/X",
  "Social Media/Facebook",
  "Social Media/Instagram",
  "Social Media/Threads",
  "Social Media/YouTube",
  "Social Media/TikTok",
  "Social Media/Pinterest",
  "Social Media/Other",
];

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const gmail = getGmailClientForDebug();
  const labelsRes = await gmail.users.labels.list({ userId: "me" });
  const results: Record<string, { found: boolean; senders: { from: string; subject: string; date: string }[] }> = {};

  for (const labelName of LABELS) {
    const label = labelsRes.data.labels?.find((l) => l.name === labelName);
    if (!label?.id) {
      results[labelName] = { found: false, senders: [] };
      continue;
    }
    const listRes = await gmail.users.messages.list({ userId: "me", labelIds: [label.id], maxResults: 10 });
    const senders: { from: string; subject: string; date: string }[] = [];
    for (const ref of listRes.data.messages ?? []) {
      if (!ref.id) continue;
      const full = await gmail.users.messages.get({
        userId: "me",
        id: ref.id,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"],
      });
      const headers = full.data.payload?.headers ?? [];
      senders.push({
        from: headers.find((h) => h.name === "From")?.value ?? "",
        subject: headers.find((h) => h.name === "Subject")?.value ?? "",
        date: headers.find((h) => h.name === "Date")?.value ?? "",
      });
    }
    results[labelName] = { found: true, senders };
  }

  return Response.json(results);
}
