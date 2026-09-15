// Thin wrapper around Postmark's HTTP API — no SDK, just fetch. No-ops with
// a warning if POSTMARK_API_TOKEN isn't configured yet, so the status-change
// polling/diff logic can be built and tested before the Postmark account
// exists.

const FROM_ADDRESS = "info@casewhy.com";
// No dedicated admin-alert address exists yet anywhere in the app — per
// round 28/29's spec, notifications about new directory applications go
// here until one does.
const ADMIN_NOTIFICATION_ADDRESS = "info@casewhy.com";

// Round 46 — notifies Peter that a Plus account crossed the 10-case
// auto-approved band and needs a one-click review. Fires once per
// threshold-crossing (see src/app/dashboard/actions.ts), not once per case.
export async function sendCaseReviewRequestNotification({
  userEmail,
  approveUrl,
}: {
  userEmail: string;
  approveUrl: string;
}): Promise<void> {
  const token = process.env.POSTMARK_API_TOKEN;
  if (!token) {
    console.warn(
      `[postmark] POSTMARK_API_TOKEN not set — skipping case-review-request notification for ${userEmail}`
    );
    return;
  }

  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: FROM_ADDRESS,
      To: ADMIN_NOTIFICATION_ADDRESS,
      Subject: `Case-tracking review needed: ${userEmail}`,
      TextBody: [
        `${userEmail} is tracking more than 10 cases on CaseWhy Plus and needs a quick review.`,
        "",
        `Approve (raises this account to 25 cases, activates everything pending): ${approveUrl}`,
      ].join("\n"),
      MessageStream: "outbound",
    }),
  });

  if (!res.ok) {
    throw new Error(`Postmark send failed: ${res.status} ${await res.text()}`);
  }
}

export async function sendStatusChangeEmail({
  to,
  receiptNumber,
  statusText,
  statusDescription,
}: {
  to: string;
  receiptNumber: string;
  statusText: string;
  statusDescription: string;
}): Promise<void> {
  const token = process.env.POSTMARK_API_TOKEN;
  if (!token) {
    console.warn(
      `[postmark] POSTMARK_API_TOKEN not set — skipping status-change email for ${receiptNumber}`
    );
    return;
  }

  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: FROM_ADDRESS,
      To: to,
      Subject: `Your case ${receiptNumber} has a new status`,
      TextBody: [
        `Your case ${receiptNumber} now shows:`,
        "",
        statusText,
        "",
        statusDescription,
        "",
        "Sign in to CaseWhy to see the full details.",
      ].join("\n"),
      MessageStream: "outbound",
    }),
  });

  if (!res.ok) {
    throw new Error(`Postmark send failed: ${res.status} ${await res.text()}`);
  }
}

// Round 28 — notifies Peter of a new attorney application
// (src/app/attorneys/join). No admin dashboard exists yet at this volume —
// email is enough, same call round 29's representative applications made.
export async function sendAttorneyApplicationNotification({
  name,
  firm,
  statesLicensed,
  barNumber,
  practiceAreas,
  contactEmail,
  contactPhone,
  websiteUrl,
  disciplineMatchNote,
}: {
  name: string;
  firm: string;
  statesLicensed: string;
  barNumber: string;
  practiceAreas: string;
  contactEmail: string;
  contactPhone?: string;
  websiteUrl?: string;
  // Round 59 — set when this applicant's name+state matched EOIR's
  // disciplined-practitioners list. Surfaced in the subject line so it
  // can't be missed, never used to auto-reject.
  disciplineMatchNote?: string | null;
}): Promise<void> {
  const token = process.env.POSTMARK_API_TOKEN;
  if (!token) {
    console.warn(
      `[postmark] POSTMARK_API_TOKEN not set — skipping attorney-application notification for ${name}`
    );
    return;
  }

  const subjectPrefix = disciplineMatchNote ? "⚠️ POSSIBLE DISCIPLINE MATCH — " : "";
  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: FROM_ADDRESS,
      To: ADMIN_NOTIFICATION_ADDRESS,
      Subject: `${subjectPrefix}New attorney application: ${name}`,
      TextBody: [
        ...(disciplineMatchNote
          ? [
              "*** This applicant's name/state matched EOIR's disciplined-practitioners list. Review before approving — this is a flag, not an automatic rejection. ***",
              disciplineMatchNote,
              "",
            ]
          : []),
        `Name: ${name}`,
        `Firm: ${firm}`,
        `States licensed: ${statesLicensed}`,
        `Bar number: ${barNumber}`,
        `Practice areas: ${practiceAreas}`,
        `Contact email: ${contactEmail}`,
        `Contact phone: ${contactPhone || "(not provided)"}`,
        `Website: ${websiteUrl || "(not provided)"}`,
      ].join("\n"),
      MessageStream: "outbound",
    }),
  });

  if (!res.ok) {
    throw new Error(`Postmark send failed: ${res.status} ${await res.text()}`);
  }
}

// Round 29 — notifies Peter of a new accredited-representative application
// (src/app/accredited-representatives/join). No admin dashboard exists yet at this
// volume, per the same "email is enough" call made for round 28's attorney
// applications — this is just the one that got built first.
export async function sendRepresentativeApplicationNotification({
  name,
  organization,
  accreditationDetails,
  statesServed,
  practiceFocus,
  contactEmail,
  contactPhone,
  disciplineMatchNote,
}: {
  name: string;
  organization: string;
  accreditationDetails: string;
  statesServed: string;
  practiceFocus: string;
  contactEmail: string;
  contactPhone?: string;
  disciplineMatchNote?: string | null;
}): Promise<void> {
  const token = process.env.POSTMARK_API_TOKEN;
  if (!token) {
    console.warn(
      `[postmark] POSTMARK_API_TOKEN not set — skipping representative-application notification for ${name}`
    );
    return;
  }

  const subjectPrefix = disciplineMatchNote ? "⚠️ POSSIBLE DISCIPLINE MATCH — " : "";
  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: FROM_ADDRESS,
      To: ADMIN_NOTIFICATION_ADDRESS,
      Subject: `${subjectPrefix}New accredited representative application: ${name}`,
      TextBody: [
        ...(disciplineMatchNote
          ? [
              "*** This applicant's name/state matched EOIR's disciplined-practitioners list. Review before approving — this is a flag, not an automatic rejection. ***",
              disciplineMatchNote,
              "",
            ]
          : []),
        `Name: ${name}`,
        `Organization: ${organization}`,
        `Accreditation details: ${accreditationDetails}`,
        `States/regions served: ${statesServed}`,
        `Practice focus: ${practiceFocus}`,
        `Contact email: ${contactEmail}`,
        `Contact phone: ${contactPhone || "(not provided)"}`,
      ].join("\n"),
      MessageStream: "outbound",
    }),
  });

  if (!res.ok) {
    throw new Error(`Postmark send failed: ${res.status} ${await res.text()}`);
  }
}

// Round 41 — notifies Peter of a new "report incorrect information"
// submission on any live Get Help listing. Same "email is enough for now,
// no admin dashboard" call already made for join applications; the report
// itself always lands in `listing_reports` regardless of whether this send
// succeeds.
// Round 70 — fires immediately when a `security@`/`legal@`/`abuse@`
// (any alias config marked `draft_and_flag_urgent`) message comes in, on
// top of the routine pending-approval queue entry, never in place of it.
// Deliberately its own function rather than reusing sendListingReportNotification
// verbatim — this one's subject/urgency framing needs to read as
// unmistakably different from routine notifications.
export async function sendUrgentAliasAlert({
  alias,
  fromAddress,
  subject,
  summary,
}: {
  alias: string;
  fromAddress: string;
  subject: string;
  summary: string;
}): Promise<void> {
  const token = process.env.POSTMARK_API_TOKEN;
  if (!token) {
    console.warn(`[postmark] POSTMARK_API_TOKEN not set — skipping urgent alias alert for ${alias}@casewhy.com`);
    return;
  }

  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: FROM_ADDRESS,
      To: ADMIN_NOTIFICATION_ADDRESS,
      Subject: `⚠️ URGENT — new ${alias}@casewhy.com message: ${subject}`,
      TextBody: [
        `A new message came in to ${alias}@casewhy.com and needs your immediate attention.`,
        "",
        `From: ${fromAddress}`,
        `Subject: ${subject}`,
        `Summary: ${summary}`,
        "",
        "Review and respond in the pending-approval queue: /admin/inbox",
      ].join("\n"),
      MessageStream: "outbound",
    }),
  });

  if (!res.ok) {
    throw new Error(`Postmark send failed: ${res.status} ${await res.text()}`);
  }
}

// Round 93 Part C — weekly attribution digest, reusing this file's
// established alias/Postmark send path (info@casewhy.com, same as every
// other admin notification here) rather than standing up a separate send
// mechanism for one new email.
export async function sendWeeklyAttributionDigest({ rows }: { rows: string }): Promise<void> {
  const token = process.env.POSTMARK_API_TOKEN;
  if (!token) {
    console.warn("[postmark] POSTMARK_API_TOKEN not set — skipping weekly attribution digest");
    return;
  }

  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: FROM_ADDRESS,
      To: ADMIN_NOTIFICATION_ADDRESS,
      Subject: "CaseWhy — weekly marketing attribution digest",
      TextBody: [
        "Per source/campaign, all-time totals (landings / sign-ups / tracked a case / went Plus):",
        "",
        rows,
        "",
        "Full breakdown: https://app.casewhy.com/admin/marketing/attribution",
      ].join("\n"),
      MessageStream: "outbound",
    }),
  });

  if (!res.ok) {
    throw new Error(`Postmark send failed: ${res.status} ${await res.text()}`);
  }
}

export async function sendListingReportNotification({
  entityType,
  entityName,
  reportText,
  reporterEmail,
}: {
  entityType: string;
  entityName: string;
  reportText: string;
  reporterEmail?: string;
}): Promise<void> {
  const token = process.env.POSTMARK_API_TOKEN;
  if (!token) {
    console.warn(
      `[postmark] POSTMARK_API_TOKEN not set — skipping listing-report notification for ${entityName}`
    );
    return;
  }

  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: FROM_ADDRESS,
      To: ADMIN_NOTIFICATION_ADDRESS,
      Subject: `Listing report: ${entityName}`,
      TextBody: [
        `Entity type: ${entityType}`,
        `Listing: ${entityName}`,
        `Report: ${reportText}`,
        `Reporter email: ${reporterEmail || "(not provided)"}`,
      ].join("\n"),
      MessageStream: "outbound",
    }),
  });

  if (!res.ok) {
    throw new Error(`Postmark send failed: ${res.status} ${await res.text()}`);
  }
}

// Round 43 — notifies Peter of a new DSO application (src/app/dso/join).
// Same "email is enough for now, no admin dashboard" call as every other
// application-notification function.
export async function sendDsoApplicationNotification({
  schoolName,
  campusName,
  contactName,
  contactEmail,
  contactPhone,
  websiteUrl,
  notes,
}: {
  schoolName: string;
  campusName?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  websiteUrl?: string;
  notes?: string;
}): Promise<void> {
  const token = process.env.POSTMARK_API_TOKEN;
  if (!token) {
    console.warn(
      `[postmark] POSTMARK_API_TOKEN not set — skipping DSO-application notification for ${schoolName}`
    );
    return;
  }

  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: FROM_ADDRESS,
      To: ADMIN_NOTIFICATION_ADDRESS,
      Subject: `New DSO application: ${schoolName}`,
      TextBody: [
        `School: ${schoolName}`,
        `Campus: ${campusName || "(not provided)"}`,
        `Contact name: ${contactName}`,
        `Contact email: ${contactEmail}`,
        `Contact phone: ${contactPhone || "(not provided)"}`,
        `Website: ${websiteUrl || "(not provided)"}`,
        `Notes: ${notes || "(none)"}`,
      ].join("\n"),
      MessageStream: "outbound",
    }),
  });

  if (!res.ok) {
    throw new Error(`Postmark send failed: ${res.status} ${await res.text()}`);
  }
}

// Round 43 — notifies Peter of a new community/cultural org application
// (src/app/community-orgs/join). Mirrors sendLegalAidApplicationNotification.
export async function sendCommunityOrgApplicationNotification({
  organizationName,
  orgType,
  contactPerson,
  statesServed,
  populationServed,
  servicesOffered,
  contactEmail,
  contactPhone,
  websiteUrl,
}: {
  organizationName: string;
  orgType: string;
  contactPerson: string;
  statesServed: string;
  populationServed: string;
  servicesOffered: string;
  contactEmail: string;
  contactPhone?: string;
  websiteUrl?: string;
}): Promise<void> {
  const token = process.env.POSTMARK_API_TOKEN;
  if (!token) {
    console.warn(
      `[postmark] POSTMARK_API_TOKEN not set — skipping community-org-application notification for ${organizationName}`
    );
    return;
  }

  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: FROM_ADDRESS,
      To: ADMIN_NOTIFICATION_ADDRESS,
      Subject: `New community/cultural org application: ${organizationName}`,
      TextBody: [
        `Organization: ${organizationName}`,
        `Org type: ${orgType}`,
        `Contact person: ${contactPerson}`,
        `States/regions served: ${statesServed}`,
        `Population served: ${populationServed}`,
        `Services offered: ${servicesOffered}`,
        `Contact email: ${contactEmail}`,
        `Contact phone: ${contactPhone || "(not provided)"}`,
        `Website: ${websiteUrl || "(not provided)"}`,
      ].join("\n"),
      MessageStream: "outbound",
    }),
  });

  if (!res.ok) {
    throw new Error(`Postmark send failed: ${res.status} ${await res.text()}`);
  }
}

export async function sendProBonoRepresentationApplicationNotification({
  organizationName,
  contactPerson,
  immigrationCourtsServed,
  languages,
  caseTypeLimits,
  intakePolicy,
  contactEmail,
  contactPhone,
  websiteUrl,
  disciplineMatchNote,
}: {
  organizationName: string;
  contactPerson: string;
  immigrationCourtsServed: string;
  languages?: string;
  caseTypeLimits?: string;
  intakePolicy?: string;
  contactEmail: string;
  contactPhone?: string;
  websiteUrl?: string;
  disciplineMatchNote?: string | null;
}): Promise<void> {
  const token = process.env.POSTMARK_API_TOKEN;
  if (!token) {
    console.warn(
      `[postmark] POSTMARK_API_TOKEN not set — skipping pro-bono-representation-application notification for ${organizationName}`
    );
    return;
  }

  const subjectPrefix = disciplineMatchNote ? "⚠️ POSSIBLE DISCIPLINE MATCH — " : "";
  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: FROM_ADDRESS,
      To: ADMIN_NOTIFICATION_ADDRESS,
      Subject: `${subjectPrefix}New pro bono representation application: ${organizationName}`,
      TextBody: [
        ...(disciplineMatchNote
          ? [
              "*** This application's contact person name matched EOIR's disciplined-practitioners list (name-only — no state field on this form to narrow it). Review before approving — this is a flag, not an automatic rejection. ***",
              disciplineMatchNote,
              "",
            ]
          : []),
        `Organization: ${organizationName}`,
        `Contact person: ${contactPerson}`,
        `Immigration court(s) served: ${immigrationCourtsServed}`,
        `Languages: ${languages || "(not provided)"}`,
        `Case-type limits: ${caseTypeLimits || "(not provided)"}`,
        `Intake policy: ${intakePolicy || "(not provided)"}`,
        `Contact email: ${contactEmail}`,
        `Contact phone: ${contactPhone || "(not provided)"}`,
        `Website: ${websiteUrl || "(not provided)"}`,
      ].join("\n"),
      MessageStream: "outbound",
    }),
  });

  if (!res.ok) {
    throw new Error(`Postmark send failed: ${res.status} ${await res.text()}`);
  }
}

export async function sendLegalAidApplicationNotification({
  organizationName,
  orgType,
  contactPerson,
  statesServed,
  populationServed,
  servicesOffered,
  contactEmail,
  contactPhone,
}: {
  organizationName: string;
  orgType: string;
  contactPerson: string;
  statesServed: string;
  populationServed: string;
  servicesOffered: string;
  contactEmail: string;
  contactPhone?: string;
}): Promise<void> {
  const token = process.env.POSTMARK_API_TOKEN;
  if (!token) {
    console.warn(
      `[postmark] POSTMARK_API_TOKEN not set — skipping legal-aid-application notification for ${organizationName}`
    );
    return;
  }

  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: FROM_ADDRESS,
      To: ADMIN_NOTIFICATION_ADDRESS,
      Subject: `New legal aid organization application: ${organizationName}`,
      TextBody: [
        `Organization: ${organizationName}`,
        `Org type: ${orgType}`,
        `Contact person: ${contactPerson}`,
        `States/regions served: ${statesServed}`,
        `Population served: ${populationServed}`,
        `Services offered: ${servicesOffered}`,
        `Contact email: ${contactEmail}`,
        `Contact phone: ${contactPhone || "(not provided)"}`,
      ].join("\n"),
      MessageStream: "outbound",
    }),
  });

  if (!res.ok) {
    throw new Error(`Postmark send failed: ${res.status} ${await res.text()}`);
  }
}

// Round 100 — the material-change notice Section 11 (was 10) of
// privacy.html promises: sent once per recipient (never a multi-recipient
// To/Cc, which would leak every account holder's email to every other
// recipient) by scripts/send-policy-update-notice.ts, which is the only
// caller. One email at a time, not the To-address of a bulk send, since
// this reuses the existing single-recipient Postmark call shape everywhere
// else in this file rather than standing up a batch-send path for one
// occasional notice.
export async function sendPolicyUpdateSummaryEmail({
  to,
  policyLabel,
  summaryLines,
  policyUrl,
}: {
  to: string;
  policyLabel: string;
  summaryLines: string[];
  policyUrl: string;
}): Promise<void> {
  const token = process.env.POSTMARK_API_TOKEN;
  if (!token) {
    console.warn(`[postmark] POSTMARK_API_TOKEN not set — skipping policy update notice to ${to}`);
    return;
  }

  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: FROM_ADDRESS,
      To: to,
      Subject: `CaseWhy — we've updated our ${policyLabel}`,
      TextBody: [
        `We've made a change to our ${policyLabel} that we want you to know about:`,
        "",
        ...summaryLines.map((line) => `- ${line}`),
        "",
        `Read the full ${policyLabel}: ${policyUrl}`,
        "",
        "You'll be asked to acknowledge this the next time you sign in — no action is needed before then.",
        "",
        "Questions? Reply to this email or write to privacy@casewhy.com.",
      ].join("\n"),
      MessageStream: "outbound",
    }),
  });

  if (!res.ok) {
    throw new Error(`Postmark send failed: ${res.status} ${await res.text()}`);
  }
}

// Round 94 — notifies Peter of a new casewhyhub.com/employers lead. Same
// "email is enough, no admin dashboard needed at this volume" call as
// round 28's attorney applications; this is a private sales/product-
// research lead (round 64's richer in-app team feature remains ON HOLD),
// never a public listing, so there's no approve/publish step to build a
// dashboard around either.
export async function sendEmployerLeadNotification({
  company,
  teamSize,
  contactName,
  email,
  needs,
}: {
  company: string;
  teamSize: string;
  contactName: string;
  email: string;
  needs?: string;
}): Promise<void> {
  const token = process.env.POSTMARK_API_TOKEN;
  if (!token) {
    console.warn(`[postmark] POSTMARK_API_TOKEN not set — skipping employer-lead notification for ${company}`);
    return;
  }

  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: FROM_ADDRESS,
      To: ADMIN_NOTIFICATION_ADDRESS,
      Subject: `New employer lead: ${company}`,
      TextBody: [
        `Company: ${company}`,
        `Sponsored employees: ${teamSize}`,
        `Contact: ${contactName}`,
        `Email: ${email}`,
        `What they need: ${needs || "(not provided)"}`,
      ].join("\n"),
      MessageStream: "outbound",
    }),
  });

  if (!res.ok) {
    throw new Error(`Postmark send failed: ${res.status} ${await res.text()}`);
  }
}

// Round 111 — casewhyhub.com/caseworkers' "Tell us what would help your
// office" form. Same notification shape as sendEmployerLeadNotification
// above; kept as its own function (not a branch inside that one) since the
// field set genuinely differs (no company/teamSize, an office name instead,
// a required message rather than an optional one).
export async function sendCaseworkerLeadNotification({
  contactName,
  office,
  email,
  message,
}: {
  contactName?: string;
  office?: string;
  email: string;
  message: string;
}): Promise<void> {
  const token = process.env.POSTMARK_API_TOKEN;
  if (!token) {
    console.warn(`[postmark] POSTMARK_API_TOKEN not set — skipping caseworker-lead notification for ${email}`);
    return;
  }

  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: FROM_ADDRESS,
      To: ADMIN_NOTIFICATION_ADDRESS,
      Subject: `New caseworker message${office ? `: ${office}` : ""}`,
      TextBody: [
        `Name: ${contactName || "(not provided)"}`,
        `Office: ${office || "(not provided)"}`,
        `Email: ${email}`,
        `Message: ${message}`,
      ].join("\n"),
      MessageStream: "outbound",
    }),
  });

  if (!res.ok) {
    throw new Error(`Postmark send failed: ${res.status} ${await res.text()}`);
  }
}
