// CW-40 — attorney-handoff PDF report. Pure presentation: takes data the
// dashboard already fetches (case status + explainCaseStatus() output) and
// lays it out as a print/export view. No new data-fetching logic here —
// that lives in the route that renders this (src/app/api/report/route.ts).

import { Document, Page, Text, View, StyleSheet, Link } from "@react-pdf/renderer";
import type { CaseStatus } from "@/lib/uscis/client";
import type { CaseExplanation } from "@/lib/ai/explain";
import { parseNoticeText } from "@/lib/uscis/notice-text";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 9, color: "#666666", marginBottom: 20 },
  sectionLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#666666",
    marginBottom: 6,
    marginTop: 16,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { color: "#666666" },
  value: { fontWeight: 700 },
  statusPill: { fontSize: 11, fontWeight: 700, marginBottom: 4 },
  paragraph: { lineHeight: 1.5, marginBottom: 8 },
  bullet: { flexDirection: "row", marginBottom: 4 },
  bulletDot: { width: 10 },
  bulletText: { flex: 1, lineHeight: 1.4 },
  historyEntry: { marginBottom: 8, paddingLeft: 10, borderLeft: "2pt solid #dddddd" },
  historyDate: { fontSize: 8, color: "#666666", fontFamily: "Courier" },
  historyText: { marginTop: 2 },
  policyItem: { marginBottom: 6 },
  policyLink: { color: "#4f46e5", textDecoration: "none" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#999999",
    borderTop: "1pt solid #eeeeee",
    paddingTop: 8,
  },
});

/**
 * Round 130 — some notice types embed a literal HTML anchor tag in USCIS's
 * own raw text (statusDescription / a history entry's completed_text_en —
 * see notice-text.tsx's own header comment for how this was found and
 * confirmed). Renders it as a real clickable link via react-pdf's own
 * <Link>, same shared parse the web app's renderNoticeText uses, kept local
 * to this file (rather than in the shared module) so its `style` args stay
 * whatever type react-pdf's own StyleSheet.create() already inferred for
 * `styles` above, instead of fighting react-pdf's own Style/SVGTextProps
 * overload typing from outside this file.
 */
function NoticeText({
  text,
  textStyle,
  linkStyle,
}: {
  text: string;
  textStyle: (typeof styles)["paragraph"] | (typeof styles)["historyText"];
  linkStyle: (typeof styles)["policyLink"];
}) {
  const segments = parseNoticeText(text);
  if (segments.length === 1 && segments[0].type === "text") {
    return <Text style={textStyle}>{text}</Text>;
  }
  return (
    <Text style={textStyle}>
      {segments.map((s, i) =>
        s.type === "link" ? (
          <Link key={i} src={s.href} style={linkStyle}>
            {s.value}
          </Link>
        ) : (
          s.value
        )
      )}
    </Text>
  );
}

export function CaseReportDocument({
  status,
  explanation,
  generatedAt,
}: {
  status: CaseStatus;
  explanation: CaseExplanation | null;
  generatedAt: Date;
}) {
  return (
    <Document title={`CaseWhy report — ${status.receiptNumber}`}>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>CaseWhy Case Report</Text>
        <Text style={styles.subtitle}>
          Generated {generatedAt.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}
        </Text>

        <View style={styles.row}>
          <Text style={styles.label}>Form type</Text>
          <Text style={styles.value}>{status.formType}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Receipt number</Text>
          <Text style={styles.value}>{status.receiptNumber}</Text>
        </View>
        {status.submittedDate && (
          <View style={styles.row}>
            <Text style={styles.label}>Filed / receipt date</Text>
            <Text style={styles.value}>{status.submittedDate}</Text>
          </View>
        )}
        {status.modifiedDate && (
          <View style={styles.row}>
            <Text style={styles.label}>Last updated by USCIS</Text>
            <Text style={styles.value}>{status.modifiedDate}</Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>Current status</Text>
        <Text style={styles.statusPill}>{status.statusText}</Text>
        <NoticeText text={status.statusDescription} textStyle={styles.paragraph} linkStyle={styles.policyLink} />

        {explanation && (
          <>
            <Text style={styles.sectionLabel}>What this means</Text>
            <Text style={styles.paragraph}>{explanation.explanation}</Text>

            {explanation.nextSteps.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Suggested next steps</Text>
                {explanation.nextSteps.map((step, i) => (
                  <View key={i} style={styles.bullet}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{step}</Text>
                  </View>
                ))}
              </>
            )}

            {explanation.relatedPolicies.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Policy background referenced above</Text>
                {explanation.relatedPolicies.map((p) => (
                  <View key={p.id} style={styles.policyItem}>
                    <Link src={p.sourceUrl} style={styles.policyLink}>
                      {p.title}
                    </Link>
                    <Text style={styles.label}> — {p.sourceTitle}</Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {status.history.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Case history</Text>
            {status.history.map((entry, i) => (
              <View key={i} style={styles.historyEntry}>
                <Text style={styles.historyDate}>{entry.date}</Text>
                <NoticeText text={entry.completed_text_en} textStyle={styles.historyText} linkStyle={styles.policyLink} />
              </View>
            ))}
          </>
        )}

        <Text style={styles.footer}>
          General information based on USCIS-published case status and CaseWhy&apos;s own curated
          policy knowledge base — not legal advice, and not a conclusion about this specific case.
          For guidance specific to this case, consult a licensed immigration attorney.
        </Text>
      </Page>
    </Document>
  );
}
