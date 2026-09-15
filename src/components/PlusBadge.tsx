// Round 109 — a small outlined pill for "Plus" wherever the product name
// appears as a label (nav item, /plus hero, pricing table header, upgrade
// nudges, settings). Peter wanted "Plus" in green; the wordmark already
// makes green mean "Why" (Logo.tsx), so green text here would compete
// with it for the eye. Approved resolution: an outlined pill in the same
// green, not green text — a pill reads as a label, the wordmark reads as
// a name, they don't fight.
//
// The literal text is "Plus" (not "PLUS"), rendered with
// `text-transform: uppercase` -- round 109 shipped with `font-variant:
// small-caps` instead, but that rendered unevenly ("PLus") once the size
// changed in this follow-up, so it's plain uppercase now. A screen reader
// still announces the real word "Plus" (text-transform is visual only).
// Combined with the plain text "CaseWhy" this always sits next to at every
// call site, that reads as "CaseWhy Plus" with no extra aria-label needed
// -- an aria-label on the badge alone would either duplicate "CaseWhy" (if
// it said "CaseWhy Plus") or announce "Plus" in isolation (if it didn't),
// so leaving the real word in the DOM and letting the surrounding text
// carry "CaseWhy" is the more robust fix, not a narrower one.
//
// Colors: the wordmark's own green (#1baf7a, Logo.tsx) fails WCAG AA on
// the light theme against this app's off-white background (#f7f5f0) --
// measured contrast 2.58:1, needs 4.5:1 for text this small. Confirmed
// directly, not assumed ("the wordmark green passes today" in the round
// 109 task doc turned out to only be true for the dark theme -- 6.86:1
// there). Round 109 shipped an outlined pill in #137e58 (RGB scaled to
// 72% of the wordmark green, 4.64:1) on light theme; Peter found the thin
// outline weak against the light background, so this follow-up fills the
// pill with #137e58 and sets the text white (measured 5.06:1, still
// clears AA). Dark theme is unchanged -- outlined #1baf7a, just bigger.

export function PlusBadge({ size = "sm" }: { size?: "sm" | "lg" }) {
  const isLg = size === "lg";
  return (
    <span
      className="inline-block rounded-full border border-[#137e58] bg-[#137e58] text-white dark:border-[#1baf7a] dark:bg-transparent dark:text-[#1baf7a]"
      style={{
        fontSize: isLg ? 20 : 13,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: isLg ? "4px 14px" : "2px 9px",
        // Re-tuned for the larger sizes -- the round 109 shipped build's
        // alignment (3px lg / 1px sm) read a hair high once the pill grew.
        verticalAlign: isLg ? "4px" : "1px",
        lineHeight: 1,
      }}
    >
      Plus
    </span>
  );
}
