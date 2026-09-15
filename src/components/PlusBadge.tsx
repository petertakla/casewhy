// Round 109 — a small outlined pill for "Plus" wherever the product name
// appears as a label (nav item, /plus hero, pricing table header, upgrade
// nudges, settings). Peter wanted "Plus" in green; the wordmark already
// makes green mean "Why" (Logo.tsx), so green text here would compete
// with it for the eye. Approved resolution: an outlined pill in the same
// green, not green text — a pill reads as a label, the wordmark reads as
// a name, they don't fight.
//
// The literal text is "Plus" (not "PLUS"), rendered with CSS
// `font-variant: small-caps` — the P stays full height, "lus" renders as
// small capitals, giving the PLUS look purely visually while a screen
// reader announces the real word "Plus". Combined with the plain text
// "CaseWhy" this always sits next to at every call site, that reads as
// "CaseWhy Plus" with no extra aria-label needed -- an aria-label on the
// badge alone would either duplicate "CaseWhy" (if it said "CaseWhy
// Plus") or announce "Plus" in isolation (if it didn't), so leaving the
// real word in the DOM and letting the surrounding text carry "CaseWhy"
// is the more robust fix, not a narrower one.
//
// Colors: the wordmark's own green (#1baf7a, Logo.tsx) fails WCAG AA on
// the light theme against this app's off-white background (#f7f5f0) --
// measured contrast 2.58:1, needs 4.5:1 for text this small. Confirmed
// directly, not assumed ("the wordmark green passes today" in the task
// doc turned out to only be true for the dark theme -- 6.86:1 there).
// #137e58 is the same hue proportionally darkened (RGB scaled to 72%)
// until it clears 4.5:1 (4.64:1) -- the "next-darker step of the same
// token" the task doc asks for on failure, not an arbitrary new color.
// Dark theme keeps the original #1baf7a.

export function PlusBadge({ size = "sm" }: { size?: "sm" | "lg" }) {
  const isLg = size === "lg";
  return (
    <span
      className="inline-block rounded-full text-[#137e58] dark:text-[#1baf7a]"
      style={{
        fontSize: isLg ? 14 : 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        fontVariant: "small-caps",
        border: `${isLg ? 1.5 : 1}px solid currentColor`,
        padding: isLg ? "2px 10px" : "1px 6px",
        // The task doc's own mockup used vertical-align 2px (sm) / 6px
        // (lg) and reported that as "a hair high" on the /plus heading --
        // tuned down from there rather than reused as-is.
        verticalAlign: isLg ? "3px" : "1px",
        lineHeight: 1,
      }}
    >
      Plus
    </span>
  );
}
