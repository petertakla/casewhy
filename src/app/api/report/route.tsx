import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { auth } from "@/lib/auth/server";
import { getTrackedCases } from "@/app/dashboard/actions";
import { getSubscriptionTier } from "@/lib/billing/tier";
import { getCaseStatus, UscisApiError } from "@/lib/uscis/client";
import { explainCaseStatus } from "@/lib/ai/explain";
import { CaseReportDocument } from "@/lib/pdf/CaseReportDocument";

// CW-40 — attorney-handoff PDF report. Gated to CaseWhy Plus (per the
// resolved packaging question: it bundles into the same paid tier as
// CW-35/36/37/38 rather than being free, even though the underlying data
// is data the user could already see on the dashboard for free).
export async function GET(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const tier = await getSubscriptionTier(session.user.id);
  if (tier !== "plus") {
    return NextResponse.json(
      { error: "The PDF report is a CaseWhy Plus feature." },
      { status: 402 }
    );
  }

  const receiptNumber = request.nextUrl.searchParams.get("receiptNumber");
  if (!receiptNumber) {
    return NextResponse.json({ error: "receiptNumber is required." }, { status: 400 });
  }

  // Re-derived server-side, same pattern as /api/chat — the client only
  // names which of the user's own tracked cases this report is for.
  const trackedCasesList = await getTrackedCases(session.user.id);
  if (!trackedCasesList.some((c) => c.receiptNumber === receiptNumber)) {
    return NextResponse.json({ error: "That case isn't one of your tracked cases." }, { status: 403 });
  }

  let status;
  try {
    status = await getCaseStatus(receiptNumber);
  } catch (err) {
    const message =
      err instanceof UscisApiError
        ? "Couldn't reach USCIS's case status service right now. Please try again shortly."
        : "Something went wrong looking up this case.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  let explanation = null;
  try {
    explanation = await explainCaseStatus(status);
  } catch {
    // Explanation is a nice-to-have — the report still has real value with
    // just the raw status, same as the dashboard's own fallback behavior.
  }

  const stream = await renderToStream(
    <CaseReportDocument status={status} explanation={explanation} generatedAt={new Date()} />
  );

  return new NextResponse(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="casewhy-report-${receiptNumber}.pdf"`,
    },
  });
}
