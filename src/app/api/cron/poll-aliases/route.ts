// Round 70 — polls each enabled alias config whose own interval has
// elapsed (not a fixed global cadence — see emailAliasConfigs.pollIntervalMinutes),
// drafts a proposed reply/action for each new message, and queues it in
// pendingAliasActions. Never sends or executes anything itself — that's
// exclusively src/app/admin/inbox/actions.ts, on a real approval click.
//
// Same external-cron-triggers-a-bearer-secured-route pattern as
// src/app/api/cron/check-status/route.ts (cron-job.org, not Vercel's own
// cron scheduler — see CLOUD_CLAUDE.md for why). This route itself can
// run every few minutes; the per-alias interval check inside is what
// actually enforces "security@/legal@ near-real-time, feedback@ daily,"
// not the external trigger's own frequency.

import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { emailAliasConfigs, pendingAliasActions } from "@/lib/db/schema";
import {
  listUnreadMessagesByLabel,
  markMessageProcessed,
  isGmailApiConfigured,
} from "@/lib/email-aliases/gmail-client";
import { draftAliasResponse } from "@/lib/email-aliases/draft-response";
import { sendUrgentAliasAlert } from "@/lib/email/postmark";

export const maxDuration = 60;
const TIME_BUDGET_MS = 45_000;

function isDue(config: { lastPolledAt: Date | null; pollIntervalMinutes: number }): boolean {
  if (!config.lastPolledAt) return true;
  const elapsedMs = Date.now() - config.lastPolledAt.getTime();
  return elapsedMs >= config.pollIntervalMinutes * 60_000;
}

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGmailApiConfigured()) {
    // Real, expected state until Peter completes the Workspace service-
    // account setup in round70-domain-response-aliases-task.md — not an
    // error, so this doesn't page anyone or spam logs on a retry loop.
    return Response.json({
      skipped: true,
      reason: "GMAIL_SERVICE_ACCOUNT_KEY not configured yet — see round70-domain-response-aliases-task.md.",
    });
  }

  const startedAt = Date.now();
  const db = getDb();
  const configs = await db.select().from(emailAliasConfigs).where(eq(emailAliasConfigs.enabled, true));

  let aliasesPolled = 0;
  let messagesQueued = 0;
  let urgentAlertsSent = 0;
  const errors: Array<{ alias: string; message: string }> = [];
  let stoppedEarly = false;

  for (const config of configs) {
    if (Date.now() - startedAt >= TIME_BUDGET_MS) {
      stoppedEarly = true;
      break;
    }
    if (!isDue(config)) continue;

    try {
      const messages = await listUnreadMessagesByLabel(config.gmailLabel);
      aliasesPolled++;

      for (const message of messages) {
        const draft = await draftAliasResponse({
          alias: config.alias,
          purpose: config.purpose,
          fromAddress: message.from,
          subject: message.subject,
          bodyText: message.bodyText,
        });

        const urgent = config.actionLevel === "draft_and_flag_urgent";

        const inserted = await db
          .insert(pendingAliasActions)
          .values({
            aliasConfigId: config.id,
            gmailMessageId: message.id,
            fromAddress: message.from,
            subject: message.subject,
            receivedAt: message.receivedAt,
            summary: draft.summary,
            draftReply: draft.draftReply,
            proposedAction: draft.proposedAction,
            urgent,
          })
          .onConflictDoNothing({ target: pendingAliasActions.gmailMessageId })
          .returning({ id: pendingAliasActions.id });

        // A conflict (already-queued message) returns no row — don't
        // double-count or double-alert on a message a previous run
        // already processed but failed to mark as read.
        if (inserted.length > 0) {
          messagesQueued++;
          if (urgent) {
            await sendUrgentAliasAlert({
              alias: config.alias,
              fromAddress: message.from,
              subject: message.subject,
              summary: draft.summary,
            });
            urgentAlertsSent++;
          }
        }

        await markMessageProcessed(message.id);
      }

      await db
        .update(emailAliasConfigs)
        .set({ lastPolledAt: new Date() })
        .where(and(eq(emailAliasConfigs.id, config.id)));
    } catch (err) {
      errors.push({ alias: config.alias, message: err instanceof Error ? err.message : String(err) });
    }
  }

  return Response.json({
    aliasesPolled,
    messagesQueued,
    urgentAlertsSent,
    errors,
    stoppedEarly,
  });
}
