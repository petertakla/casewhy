// Thin wrapper around Postmark's HTTP API — no SDK, just fetch. No-ops with
// a warning if POSTMARK_API_TOKEN isn't configured yet, so the status-change
// polling/diff logic can be built and tested before the Postmark account
// exists.

const FROM_ADDRESS = "info@casewhy.com";
// No dedicated admin-alert address exists yet anywhere in the app — per
// round 28/29's spec, notifications about new directory applications go
// here until one does.
const ADMIN_NOTIFICATION_ADDRESS = "info@casewhy.com";

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
}: {
  name: string;
  firm: string;
  statesLicensed: string;
  barNumber: string;
  practiceAreas: string;
  contactEmail: string;
  contactPhone?: string;
  websiteUrl?: string;
}): Promise<void> {
  const token = process.env.POSTMARK_API_TOKEN;
  if (!token) {
    console.warn(
      `[postmark] POSTMARK_API_TOKEN not set — skipping attorney-application notification for ${name}`
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
      Subject: `New attorney application: ${name}`,
      TextBody: [
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
}: {
  name: string;
  organization: string;
  accreditationDetails: string;
  statesServed: string;
  practiceFocus: string;
  contactEmail: string;
  contactPhone?: string;
}): Promise<void> {
  const token = process.env.POSTMARK_API_TOKEN;
  if (!token) {
    console.warn(
      `[postmark] POSTMARK_API_TOKEN not set — skipping representative-application notification for ${name}`
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
      Subject: `New accredited representative application: ${name}`,
      TextBody: [
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
