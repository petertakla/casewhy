#!/usr/bin/env node
// Round 111 — regenerates every casewhyhub.com page from scripts/pages.json
// (the registry) + scripts/content/<id>.html (per-page body) so the shared
// header/footer/nav/CSS live in exactly one place instead of being hand-
// copied across 7+ files. No runtime build step exists on this static
// site (Vercel serves the committed HTML directly), so this script is run
// manually — the same reason build-search-index.ts (round 110) exists as
// a script rather than a framework build hook, just without a framework
// here to hook into.
//
// Track H (Sep 27, 2026) — the hub gained a line dimension. `pages.json`
// now has `lines[]` (one home page per product line, e.g. /uscis, /appeals),
// `pages[]` (audience pages nested under a line, e.g. /appeals/counselors),
// and `companyPages[]` (line-spanning pages: /press, /resources, /brand).
// The nav is line-aware: a compact global header (line switch + the three
// shared pages) rather than every audience page appearing in the top nav —
// each line's own home page is where its audience pages are listed as
// cards, so the header doesn't have to carry 10+ links.
//
// Run: node scripts/generate.mjs from the repo root.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const { lines, pages, companyPages, redirects } = JSON.parse(
  readFileSync(join(__dirname, "pages.json"), "utf8")
);
const partnerKit = readFileSync(join(__dirname, "content", "_partner-kit.html"), "utf8");

function lineOf(id) {
  return lines.find((l) => l.id === id);
}

const CSS = `
  :root{
    --background:#f7f5f0; --surface:#ffffff; --surface-2:#efece4; --foreground:#1c2024;
    --muted:#6b7280; --border:#e4e0d6; --border-strong:#d1cbba;
    --brand-400:#5b9eed; --brand-500:#2a78d6; --brand-600:#1d5fb0; --logo-green:#1baf7a;
    --glow:42,120,214; --glow-opacity:0.06;
  }
  @media (prefers-color-scheme: dark){
    :root{
      --background:#0a0e17; --surface:#12182a; --surface-2:#1a2238; --foreground:#edf0f5;
      --muted:#98a1b5; --border:#232c45; --border-strong:#303c5c;
      --glow:91,158,237; --glow-opacity:0.16;
    }
  }
  *{box-sizing:border-box;}
  body{
    margin:0; background:var(--background); color:var(--foreground);
    font-family:'Inter',-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    line-height:1.6;
    background-image:
      radial-gradient(ellipse 900px 560px at 15% -10%, rgba(var(--glow),var(--glow-opacity)), transparent 60%),
      radial-gradient(ellipse 700px 500px at 100% 10%, rgba(var(--glow), calc(var(--glow-opacity) * 0.7)), transparent 55%);
    background-repeat:no-repeat; background-attachment:fixed;
  }
  a{color:var(--brand-600);}
  @media (prefers-color-scheme: dark){ a{color:var(--brand-400);} }
  .wrap{max-width:820px;margin:0 auto;padding:0 24px;}
  header{position:sticky;top:0;z-index:10;padding:18px 0;border-bottom:1px solid var(--border);background:color-mix(in srgb, var(--surface) 80%, transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);}
  header .wrap{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
  .logo{display:inline-flex;align-items:center;gap:10px;text-decoration:none;}
  .logo img{height:32px;width:32px;border-radius:8px;flex-shrink:0;}
  .logo .lockup{display:flex;flex-direction:column;line-height:1.2;}
  .logo .name{font-weight:700;font-size:1.15rem;letter-spacing:-0.02em;color:var(--foreground);}
  .logo .name span{color:var(--logo-green);}
  .logo .tagline{font-size:0.72rem;color:var(--muted);font-weight:500;}
  nav.main{display:flex;align-items:center;gap:16px;font-size:0.88rem;font-weight:600;flex-wrap:wrap;}
  nav.main a{color:var(--muted);text-decoration:none;}
  nav.main a:hover{color:var(--foreground);}
  nav.main .line-switch{display:inline-flex;gap:2px;background:var(--surface-2);border-radius:9px;padding:3px;}
  nav.main .line-switch a{padding:5px 12px;border-radius:6px;color:#4b5563;}
  @media (prefers-color-scheme: dark){ nav.main .line-switch a{color:var(--muted);} }
  nav.main .line-switch a[aria-current="page"]{background:var(--surface);color:var(--foreground);box-shadow:0 1px 2px rgba(0,0,0,0.06);}
  nav.main a.shared-link{padding-left:2px;}
  nav.main a[aria-current="page"]:not(.line-switch a){color:var(--foreground);text-decoration:underline;text-underline-offset:3px;}
  nav.main a.site-link{color:var(--brand-600);border-left:1px solid var(--border);padding-left:16px;}
  @media (prefers-color-scheme: dark){ nav.main a.site-link{color:var(--brand-400);} }
  main{padding:56px 0 80px;}
  .eyebrow{font-family:'JetBrains Mono',monospace;font-size:0.78rem;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:var(--brand-600);}
  @media (prefers-color-scheme: dark){ .eyebrow{color:var(--brand-400);} }
  .eyebrow a{color:inherit;text-decoration:underline;text-underline-offset:2px;}
  h1{font-size:2.2rem;margin:10px 0 14px;letter-spacing:-0.02em;line-height:1.15;}
  h2{font-size:1.3rem;margin:36px 0 12px;letter-spacing:-0.01em;}
  .sub{color:var(--muted);font-size:1.05rem;max-width:680px;}
  .free-line{margin-top:18px;font-size:0.92rem;font-weight:600;color:var(--foreground);}
  .disclaimer{margin-top:20px;border-radius:12px;border:1px solid var(--border-strong);background:var(--surface-2);padding:16px 18px;font-size:0.88rem;color:var(--foreground);}
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;margin-top:48px;}
  .cards.lines{grid-template-columns:repeat(auto-fit,minmax(280px,1fr));}
  .card{border:1px solid var(--border);background:var(--surface);border-radius:16px;padding:24px;text-decoration:none;color:inherit;transition:border-color .15s;}
  .card:hover{border-color:var(--border-strong);}
  .card h2{margin:0 0 8px;font-size:1.1rem;}
  .card .tagline{margin:0 0 10px;font-size:0.85rem;font-weight:700;color:var(--brand-600);}
  @media (prefers-color-scheme: dark){ .card .tagline{color:var(--brand-400);} }
  .card p{margin:0;color:var(--muted);font-size:0.9rem;}
  .card .arrow{margin-top:14px;font-weight:700;color:var(--brand-600);font-size:0.88rem;}
  @media (prefers-color-scheme: dark){ .card .arrow{color:var(--brand-400);} }
  ul.checklist{list-style:none;padding:0;margin:0 0 14px;}
  ul.checklist li{padding-left:26px;position:relative;margin-bottom:10px;color:var(--muted);font-size:0.95rem;}
  ul.checklist li::before{content:"—";position:absolute;left:0;color:var(--brand-500);}
  ul.checklist li strong{color:var(--foreground);}
  .planned-note{font-size:0.82rem;color:var(--muted);font-style:italic;margin-top:-4px;margin-bottom:20px;}
  .types{margin-top:24px;display:grid;gap:16px;}
  .type-card{border:1px solid var(--border);background:var(--surface);border-radius:14px;padding:22px;}
  .type-card h2{margin:0 0 6px;font-size:1.1rem;}
  .type-card p{margin:0 0 12px;color:var(--muted);font-size:0.92rem;}
  .type-card .meta{font-family:'JetBrains Mono',monospace;font-size:0.78rem;color:var(--muted);margin-bottom:10px;}
  .type-card a.link{font-weight:700;font-size:0.9rem;text-decoration:none;}
  .type-card a.link:hover{text-decoration:underline;}
  form{margin-top:8px;display:grid;gap:14px;max-width:480px;}
  label{font-size:0.85rem;font-weight:600;display:block;margin-bottom:5px;}
  input,select,textarea{width:100%;padding:10px 12px;border-radius:8px;border:1px solid var(--border-strong);background:var(--surface);color:var(--foreground);font-family:inherit;font-size:0.95rem;}
  textarea{resize:vertical;min-height:80px;}
  .honeypot{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;}
  button.submit{padding:13px 26px;border-radius:10px;background:var(--brand-500);color:#fff;font-weight:700;border:none;font-size:0.98rem;cursor:pointer;justify-self:start;}
  button.submit:hover{background:var(--brand-600);}
  button.submit:disabled{opacity:0.6;cursor:not-allowed;}
  .status{margin-top:-6px;font-size:0.9rem;}
  .status.success{color:var(--logo-green);}
  .status.error{color:#e05252;}
  .form-note{font-size:0.8rem;color:var(--muted);margin:-4px 0 0;}
  .kit{margin-top:32px;border:1px solid var(--border);background:var(--surface);border-radius:16px;padding:24px;}
  .kit h2{margin-top:0;}
  .kit-intro{color:var(--muted);font-size:0.9rem;margin-top:-6px;}
  .kit-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:18px;margin-top:16px;}
  .kit-item h3{margin:0 0 6px;font-size:0.98rem;}
  .kit-item p{margin:0 0 8px;color:var(--muted);font-size:0.88rem;}
  .kit-note{font-size:0.78rem;color:var(--muted);font-style:italic;}
  .copy-btn{padding:7px 14px;border-radius:8px;border:1px solid var(--border-strong);background:var(--surface-2);color:var(--foreground);font-size:0.85rem;font-weight:600;cursor:pointer;}
  .copy-btn:hover{border-color:var(--brand-500);}
  .kit-snippet{position:absolute;left:-9999px;opacity:0;}
  .kit-disclaimer{margin-top:20px;font-size:0.8rem;color:var(--muted);}
  /* Sep 29's diagram styles, moved here Sep 30 — they had been hand-added
     to one generated page's <style>, so regenerating dropped them. */
  figure.diagram{margin:16px 0 20px;}
  figure.diagram img{display:block;width:100%;max-width:100%;height:auto;border:1px solid var(--border);border-radius:10px;}
  figure.diagram figcaption{font-size:0.82rem;color:var(--muted);margin-top:8px;}
  .tiers{margin-top:24px;display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));}
  .tier{border:1px solid var(--border);background:var(--surface);border-radius:14px;padding:22px;}
  .tier h3{margin:0 0 4px;font-size:1.02rem;}
  .tier .price{font-family:'JetBrains Mono',monospace;font-size:0.85rem;color:var(--brand-600);margin:0 0 10px;}
  @media (prefers-color-scheme: dark){ .tier .price{color:var(--brand-400);} }
  .tier p{margin:0;color:var(--muted);font-size:0.88rem;}
  .cta-alt{margin-top:10px;font-size:0.88rem;color:var(--muted);}
  a.cta{display:inline-block;margin-top:14px;padding:13px 26px;border-radius:10px;background:var(--brand-600);color:#fff !important;font-weight:700;text-decoration:none;font-size:0.98rem;}
  a.cta:hover{background:#164a8c;}
  .preview-card{margin:14px 0 20px;border:1px solid var(--border);background:var(--surface);border-radius:12px;padding:16px 18px;max-width:360px;}
  .preview-card .state{font-family:'JetBrains Mono',monospace;font-size:0.75rem;font-weight:700;color:var(--brand-600);}
  @media (prefers-color-scheme: dark){ .preview-card .state{color:var(--brand-400);} }
  .preview-card .name{font-weight:700;margin-top:4px;}
  .preview-card .firm{color:var(--muted);font-size:0.9rem;}
  .preview-card .focus{font-size:0.82rem;color:var(--muted);margin-top:4px;}
  .soon{display:inline-block;margin-left:8px;padding:2px 8px;border-radius:999px;background:var(--brand-50,#eef2ff);color:var(--brand-600,#4f46e5);font-size:0.7rem;font-weight:600;letter-spacing:0.02em;text-transform:uppercase;vertical-align:middle;}
  @media (prefers-color-scheme: dark){ .soon{background:rgba(99,102,241,0.15);color:var(--brand-400,#818cf8);} }
  /* THE FREE-TRIAL LINE IS AN OFFER, NOT A CAVEAT. Oct 3 2026, Peter: "this
     is not very visible". It was rendered as .planned-note — 0.82rem, muted,
     italic, with a negative top margin — which is the strongest thing on a
     pricing section styled like the weakest.

     It needed its own class rather than a restyle of .planned-note, because
     that class does double duty across the site: it also carries genuine
     caveats ("None of this exists yet", "on the way — not live yet", "doesn't
     fill it yet"). Promoting those would have been exactly backwards. */
  .trial-note{margin:16px 0 24px;padding:14px 18px;border:1px solid var(--border);border-left:4px solid var(--brand-600);border-radius:12px;background:var(--surface-2);color:var(--foreground);font-size:0.95rem;}
  .trial-note strong{font-weight:700;}
  @media (prefers-color-scheme: dark){ .trial-note{border-left-color:var(--brand-400);} }
  /* The demo strip (SYNC_0036). Sits under the intro on the chooser page and
     is the only call-to-action above the two cards, so it reads as an offer
     rather than a third option competing with them — a tinted band with one
     button, not a card. */
  .demo-strip{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;margin:28px 0 8px;padding:16px 20px;border:1px solid var(--border);border-left:4px solid var(--brand-600);border-radius:12px;background:var(--surface-2);}
  .demo-strip p{margin:0;font-size:0.95rem;}
  @media (prefers-color-scheme: dark){ .demo-strip{border-left-color:var(--brand-400);} }
  a.demo-btn{flex-shrink:0;display:inline-block;padding:10px 20px;border-radius:9px;background:var(--brand-600);color:#fff !important;font-weight:700;text-decoration:none;font-size:0.92rem;}
  a.demo-btn:hover{background:#164a8c;}
  .demo-inline{margin:10px 0 18px;font-size:0.92rem;font-weight:600;}
  /* The SNF two-card chooser (SYNC_0025). Reuses .cards/.card; these add the
     kicker, the stat box and the per-card source line. Cards are <a>, so the
     whole card is the target, not just the arrow. */
  .chooser-lead{margin-top:36px;font-size:1.05rem;}
  .cards.chooser{margin-top:18px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));}
  .cards.chooser .card{display:flex;flex-direction:column;}
  .card .kicker{font-family:'JetBrains Mono',monospace;font-size:0.72rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--brand-600);margin:0 0 10px;}
  @media (prefers-color-scheme: dark){ .card .kicker{color:var(--brand-400);} }
  .card .statbox{margin:14px 0 0;padding:12px 14px;border-radius:10px;background:var(--surface-2);border:1px solid var(--border);}
  .card .statbox p{margin:0;font-size:0.86rem;}
  .card .statbox strong{color:var(--foreground);}
  .cards.chooser .card .arrow{margin-top:auto;padding-top:14px;}
  .card .cardsource{margin-top:10px;font-size:0.74rem;font-style:italic;color:var(--muted);}
  .crosslink{margin-top:14px;font-size:0.9rem;}
  /* Tables. Added Oct 3 2026 for the SNF admission-denial section's
     two-step appeal clock — the first table on this site. Wrapped in
     .table-scroll so a five-column table scrolls inside its own box on a
     phone instead of making the whole page scroll sideways. */
  .table-scroll{overflow-x:auto;margin:16px 0 20px;-webkit-overflow-scrolling:touch;}
  table.clock-table{border-collapse:collapse;width:100%;min-width:620px;font-size:0.88rem;}
  table.clock-table th,table.clock-table td{border:1px solid var(--border);padding:10px 12px;text-align:left;vertical-align:top;}
  table.clock-table thead th{background:var(--surface-2);font-size:0.78rem;letter-spacing:0.03em;text-transform:uppercase;color:var(--muted);}
  table.clock-table tbody td:first-child{font-weight:600;white-space:nowrap;}
  main.wrap ul{margin:12px 0 16px;padding-left:22px;color:var(--muted);}
  main.wrap ul li{margin-bottom:7px;}
  main.wrap ul li strong{color:var(--foreground);}
  h3{margin:22px 0 6px;font-size:1.02rem;}
  p.sources{font-size:0.8rem;color:var(--muted);font-style:italic;margin-top:18px;}
  footer{border-top:1px solid var(--border);padding:32px 0;font-size:0.85rem;color:var(--muted);}
  footer .wrap{display:flex;flex-direction:column;gap:6px;}
  footer a{color:var(--muted);}
  footer a:hover{color:var(--brand-600);}
  @media (prefers-color-scheme: dark){ footer a:hover{color:var(--brand-400);} }
  footer .links{margin-top:6px;}
  footer .links a{margin-right:16px;}
  footer .app-line{font-weight:600;color:var(--foreground);}
  footer .coming{margin-top:10px;font-size:0.8rem;font-style:italic;}
`;

// currentLineId: which line-switch entry (if any) is active. currentSharedId:
// which of press/resources/brand (if any) is active. Both are null on the
// root and on a plain audience page (whose own eyebrow, not the header,
// says which line it belongs to).
// Sep 30, 2026 — the outbound product link is per LINE, not global.
// It was hardcoded to casewhy.com on every page, so an advocate reading
// /appeals/* was offered the USCIS tracker as "the product" — the wrong
// one for their line. Each line now names its own: USCIS keeps
// casewhy.com; Appeals points at the new /desk landing page, which is the
// professional front door this hub's appeals pages are selling. Pages
// that span both lines (the hub home, /press, /resources, /brand) keep
// casewhy.com as the neutral default.
const DEFAULT_SITE_LINK = { href: "https://www.casewhy.com", label: "casewhy.com" };

function header(currentLineId, currentSharedId) {
  const siteLink = lines.find((l) => l.id === currentLineId)?.siteLink ?? DEFAULT_SITE_LINK;
  const lineLinks = lines
    .map(
      (l) =>
        `        <a href="${l.path}"${l.id === currentLineId ? ' aria-current="page"' : ""}>${l.navLabel}</a>`
    )
    .join("\n");
  const sharedLinks = companyPages
    .map(
      (p) =>
        `      <a class="shared-link" href="${p.path}"${p.id === currentSharedId ? ' aria-current="page"' : ""}>${p.navLabel}</a>`
    )
    .join("\n");
  return `<header>
  <div class="wrap">
    <a class="logo" href="/">
      <img src="/brand/mark.svg" alt="">
      <span class="lockup">
        <span class="name">Case<span>Why</span> Hub</span>
        <span class="tagline">Partner with CaseWhy</span>
      </span>
    </a>
    <nav class="main">
      <span class="line-switch">
${lineLinks}
      </span>
${sharedLinks}
      <a class="site-link" href="${siteLink.href}?utm_source=hub&utm_medium=header">${siteLink.label} ↗</a>
    </nav>
  </div>
</header>`;
}

function footer() {
  return `<footer>
  <div class="wrap">
    <p class="app-line">CaseWhy — the USCIS tracker: <a href="https://www.casewhy.com?utm_source=hub&utm_medium=footer">casewhy.com</a> · CaseWhy Appeals: <a href="https://appeals.casewhy.com?utm_source=hub&utm_medium=footer">appeals.casewhy.com</a> · Appeals Desk: <a href="https://appeals.casewhy.com/desk?utm_source=hub&utm_medium=footer">appeals.casewhy.com/desk</a></p>
    <p class="app-line">USCIS help: <a href="https://app.casewhy.com/get-help?utm_source=hub&utm_medium=footer">app.casewhy.com/get-help</a> · Appeals help: <a href="mailto:appeals-help@casewhy.com">appeals-help@casewhy.com</a></p>
    <p>CaseWhy LLC, 7901 4th St N, Ste 300, St. Petersburg, FL 33702, US</p>
    <div class="links">
      <a href="/resources">Resources</a>
      <a href="/brand">Brand</a>
      <a href="mailto:privacy@casewhy.com">privacy@casewhy.com</a>
      <a href="mailto:terms@casewhy.com">terms@casewhy.com</a>
    </div>
    <p class="coming">Coming: creators, libraries, Español.</p>
  </div>
</footer>`;
}

const COPY_SCRIPT = `<script>
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.copyTarget);
      navigator.clipboard.writeText(target.value).then(() => {
        const original = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = original; }, 1800);
      });
    });
  });
</script>`;

// FORWARD THE ARRIVING CAMPAIGN'S UTM TAGS — forward-utm
//
// Every onward link on this site hardcodes utm_source=hub. That is right for a
// visitor who found the hub on their own, and wrong for one who arrived from a
// tagged campaign: appeals.casewhy.com would record "hub" and the campaign
// would be indistinguishable from organic traffic. This site is static and
// records nothing itself, so the tags have to survive the hop or they are lost
// entirely.
//
// Arrived with no utm_source -> nothing changes, "hub" stands.
//
// LIVES HERE, IN THE GENERATOR, and that is the whole point. It was first
// added Oct 2 by hand-editing all 24 built pages, which is the same mistake
// the Sep 30 note above the diagram styles records: the next `node
// scripts/generate.mjs` would have silently deleted it from every page, and
// the campaign's attribution with it. Anything that belongs on every page
// belongs in this file.
const FORWARD_UTM_SCRIPT = `<script>
  (function () {
    var incoming = new URLSearchParams(location.search);
    if (!incoming.get('utm_source')) return;
    var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    document.querySelectorAll('a[href*="appeals.casewhy.com"]').forEach(function (a) {
      try {
        var u = new URL(a.href);
        keys.forEach(function (k) { var v = incoming.get(k); if (v) u.searchParams.set(k, v); });
        a.href = u.toString();
      } catch (e) { /* a malformed href stays exactly as authored */ }
    });
  })();
</script>`;

// ---- the facility privacy section, one source for three pages ---------
//
// Five sentences, approved by Peter on Oct 4 2026 (SYNC_0112). Four are word
// for word as Code drafted them in SYNC_0067 §6; sentence 2 is his own edit,
// and the reason for it is the reason this block is shared rather than written
// into each page: his words were "'Resident' and 'room' fit skilled nursing but
// not home health or hospice", so "a resident's name" became "a client's name"
// and "a room or file number" became "your own room, file or client number".
// Three copies of that sentence is three chances for one of them to keep saying
// "resident".
//
// EVERY SENTENCE IS VERIFIED AGAINST THE APPEALS REPO, not against the draft it
// came from (SYNC_0112 §3.1 asked for exactly this):
//   1. notices are read once then deleted — read-and-delete, Oct 1
//   2. desk_clients has NO name column at all: id, orgId, label, reference,
//      tags, deepLinkOverride, createdBySeatId. The Label field's own helper
//      says "Free text, never a real name", and the case board's footer says
//      "No client names are stored here — your reference and tags are how you
//      find a case."
//   3. loadAccessibleCase() grants the creator or a seat at the organization
//      owning the case's deskClientId, and nobody else
//   4. the wording matches the Terms addendum Peter approved Oct 1 and is NOT
//      to be edited here (SYNC_0112 §3.5)
//   5. closing an organization cascades
//
// NOT PUBLISHED ON appeals.casewhy.com. Its advocate How-To already carries an
// equivalent section ("Records, exports, and privacy") in advocate language, and
// the FAQ's business-associate answer points at it. Publishing these five there
// too would make two statements of one policy that can drift — which is exactly
// how that page came to claim "Access pauses" and a family "shared view" that
// never existed. One statement per audience.
const facilityPrivacySentences = [
  ["We don’t keep the notice you upload.", "The file is read once to pull out what the appeal needs (dates, notice type, the denial reason) and then deleted. We keep the extracted details, not the document."],
  ["We don’t ask for a client’s name.", "A case is found by your own room, file or client number and the tags you give it. There is no name field."],
  ["Your staff see your organization’s cases, and nothing else.", "Every seat is scoped to one organization."],
  ["We don’t hold protected health information,", "so no HIPAA business associate agreement is needed between us. If that ever changes, we will tell you first."],
  ["Closing your organization deletes everything under it, immediately.", "Export first if you want a copy."],
];

const facilityPrivacyHtml = `  <h2>What we store, and what we don’t</h2>
  <ul class="checklist">
${facilityPrivacySentences.map(([lead, rest]) => `    <li><strong>${lead}</strong> ${rest}</li>`).join("\n")}
  </ul>`;

// ---- pricing, rendered from scripts/pricing.json ----------------------
//
// Sep 30, 2026. The hub was advertising a WITHDRAWN offer — "twenty free
// seats through February 28, 2027… then $99 a month, unlimited cases" —
// across five appeals pages, weeks after Peter removed the founding pilot
// and the seat cap outright. The appeals repo has a guard test that
// refuses to let that copy come back; it cannot see this repo, so the
// promise stayed live on the public web here.
//
// Hand-typed prices in five files is how that happens. So pricing.json is
// EXPORTED from the appeals repo's own src/lib/desk/pricing.ts — the same
// module that meters and bills — and pages carry a {{PRICING:<lane>}}
// placeholder instead of numbers. Re-export and re-run this script after
// any pricing change; verify.mjs fails if a page states a number that
// isn't in the JSON.
const pricing = JSON.parse(readFileSync(join(__dirname, "pricing.json"), "utf8"));

const LANE_LABELS = {
  advocate: { unit: "per seat", noun: "advocate, care-manager and attorney seats" },
  "facility:snf": { unit: "per site", noun: "skilled nursing facilities" },
  "facility:home_health": { unit: "per site", noun: "home health agencies" },
  "facility:hospice": { unit: "per site", noun: "hospices" },
};

/** "$19 a case for the first 8 each month, $15 for 9-25, then $12." */
function ladderProse(tiers) {
  const parts = [];
  let from = 1;
  tiers.forEach((t, i) => {
    const last = i === tiers.length - 1;
    if (last || t.upTo === null) parts.push(`then $${t.perCaseUsd}`);
    else if (i === 0) parts.push(`$${t.perCaseUsd} a case for the first ${t.upTo} each month`);
    else parts.push(`$${t.perCaseUsd} for ${from}-${t.upTo}`);
    from = (t.upTo ?? from) + 1;
  });
  return parts.join(", ") + ".";
}

function planCard(plan, unit) {
  const price = plan.monthlyUsd === 0 ? `$0 / month ${unit}` : `$${plan.monthlyUsd} / month ${unit}`;
  const detail =
    plan.monthlyUsd === 0
      ? `No monthly fee, no commitment. ${ladderProse(plan.tiers)}`
      : `${plan.includedCases} cases included each month, then $${plan.tiers[plan.tiers.length - 1].perCaseUsd} a case.`;
  return `    <div class="tier">
      <h3>${plan.label}</h3>
      <p class="price">${price}</p>
      <p>${detail}</p>
    </div>`;
}

function pricingHtml(lane) {
  const plans = pricing.lanes[lane];
  if (!plans) throw new Error(`[generate] unknown pricing lane "${lane}" — check scripts/pricing.json`);
  const { unit } = LANE_LABELS[lane];
  const cards = plans.map((p) => planCard(p, unit)).join("\n");
  // THE TRAILING SENTENCE DEPENDS ON WHETHER A MONTHLY PLAN EXISTS TO MOVE TO.
  //
  // Found by the Oct 2 site audit: the hospice page spent a whole section
  // explaining, deliberately, that there is NO monthly plan for hospice — and
  // then this shared sentence promised "you can move to a monthly plan whenever
  // your volume makes it cheaper" directly underneath it. Copy-pasted from the
  // lanes that do have Standard/Growth tiers.
  //
  // Keyed off the DATA (does this lane have a plan with a monthly fee?) rather
  // than special-cased to hospice, so any future single-plan lane is correct the
  // day it is added instead of inheriting the same contradiction.
  const hasMonthlyPlan = plans.some((p) => p.monthlyUsd > 0);
  const trial = hasMonthlyPlan
    ? `  <p class="trial-note"><strong>Your first ${pricing.freeTrialCases} cases are free, whichever plan you're on.</strong> New ${LANE_LABELS[lane].noun} start on ${plans[0].label} — no plan to pick up front, and you can move to a monthly plan whenever your volume makes it cheaper.</p>`
    : `  <p class="trial-note"><strong>Your first ${pricing.freeTrialCases} cases are free.</strong> Every ${LANE_LABELS[lane].noun.replace(/s$/, "")} runs on the same ${plans[0].label} pricing above — there is no monthly plan to switch to (see why, above).</p>`;
  return `  <div class="tiers">\n${cards}\n  </div>\n${trial}`;
}

// OPEN GRAPH AND TWITTER CARD TAGS — on every page, from the generator.
//
// Without these, a hub link pasted into Slack, LinkedIn, iMessage or an email
// client previews as a bare URL. That matters most for exactly the pages the
// October campaign points at.
//
// LIVES HERE FOR THE SAME REASON AS FORWARD_UTM_SCRIPT. These tags were lost
// in the /uscis + /appeals restructure and restored Oct 2 by hand-editing all
// 24 built pages. The source was never touched, so the next regeneration
// would have deleted them again and nobody would have noticed until a link
// previewed bare somewhere public. Third instance of the same mistake on this
// site; the diagram-styles note from Sep 30 was the first.
//
// og:image defaults to the site card and is overridden per page by an
// `ogImage` entry in pages.json — a page with its own screenshot should
// preview with it.
const DEFAULT_OG = { url: "https://casewhyhub.com/og-default.png", width: 1200, height: 630 };

/** Attribute-safe. The titles in pages.json contain "&" ("Patient Advocates &
 *  Aging Life Care Managers"), and a bare ampersand inside an attribute is
 *  invalid HTML even where parsers forgive it. The Oct 2 hand-written tags
 *  wrote "&amp;", so escaping here also keeps the regenerated output
 *  byte-identical to what was verified live rather than quietly changing 8
 *  pages. (`<title>` has always emitted a raw "&"; left alone — not a
 *  regression either way, and not this change's business.) */
function escAttr(v) {
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function socialMeta({ path, titleTag, description, ogImage }) {
  const img = ogImage ?? DEFAULT_OG;
  titleTag = escAttr(titleTag);
  description = escAttr(description);
  return [
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${titleTag}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:url" content="https://casewhyhub.com${path}">`,
    `<meta property="og:site_name" content="CaseWhy Hub">`,
    `<meta property="og:locale" content="en_US">`,
    `<meta property="og:image" content="${img.url}">`,
    `<meta property="og:image:width" content="${img.width}">`,
    `<meta property="og:image:height" content="${img.height}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${titleTag}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${img.url}">`,
  ].join("\n");
}

function pageHtml({ path, titleTag, description, contentId, body: bodyOverride, currentLineId, currentSharedId, extraJsonLd, ogImage }) {
  let body = bodyOverride !== undefined ? bodyOverride : readFileSync(join(__dirname, "content", `${contentId}.html`), "utf8");
  for (const m of [...body.matchAll(/\{\{PRICING:([a-z_:]+)\}\}/g)]) {
    body = body.replace(m[0], pricingHtml(m[1]));
  }
  if (body.includes("{{FACILITY_PRIVACY}}")) {
    body = body.replace("{{FACILITY_PRIVACY}}", facilityPrivacyHtml);
  }
  if (body.includes("{{PARTNER_KIT}}")) {
    body = body.replace("{{PARTNER_KIT}}", partnerKit.replaceAll("{{PAGE_ID}}", contentId));
  }
  const needsCopyScript = body.includes("copy-btn") || partnerKit.includes("copy-btn");
  const jsonLd =
    extraJsonLd === false
      ? ""
      : `  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"WebPage","name":${JSON.stringify(titleTag)},"url":"https://casewhyhub.com${path}","isPartOf":{"@type":"WebSite","name":"CaseWhy Hub","url":"https://casewhyhub.com"}}
  </script>\n`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${titleTag}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="https://casewhyhub.com${path}">
${socialMeta({ path, titleTag, description, ogImage })}
<link rel="icon" href="/brand/icon-192.png">
<link rel="icon" href="/brand/icon-512.png" sizes="512x512">
<link rel="apple-touch-icon" href="/brand/apple-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<style>${CSS}</style>
${jsonLd}</head>
<body>

${header(currentLineId, currentSharedId)}

<main class="wrap">
${body}
</main>

${footer()}
${needsCopyScript ? "\n" + COPY_SCRIPT : ""}
${FORWARD_UTM_SCRIPT}
</body>
</html>
`;
}

function homePage() {
  const lineCards = lines
    .map(
      (l) => `    <a class="card" href="${l.path}">
      <h2>${l.rootCardTitle}</h2>
      <p class="tagline">${l.rootCardTagline}</p>
      <p>${l.rootCardDesc}</p>
      <p class="arrow">Learn more →</p>
    </a>`
    )
    .join("\n");
  const sharedCards = companyPages
    .map(
      (p) => `    <a class="card" href="${p.path}">
      <h2>${p.navLabel}</h2>
      <p>${p.description}</p>
      <p class="arrow">Learn more →</p>
    </a>`
    )
    .join("\n");
  const body = `  <p class="eyebrow">CaseWhy Hub</p>
  <h1>Partner with CaseWhy</h1>
  <p class="sub">CaseWhy LLC is a Florida company building free-first tools that explain government and insurance letters. <strong>CaseWhy</strong> is the free USCIS case-status tracker; <strong>CaseWhy Appeals</strong> explains, writes, and tracks every Medicare appeal. Pick your line below.</p>
  <p class="free-line">This directory is free to be listed in — no fees, no ads, ever. CaseWhy is free to use; CaseWhy Appeals is free for SHIP and SHINE counselors, ombudsman programs, legal aid and nonprofit staff, and otherwise starts with 3 free cases.</p>

  <div class="cards lines">
${lineCards}
  </div>

  <h2>Shared, across every line</h2>
  <div class="cards">
${sharedCards}
  </div>`;
  return pageHtml({
    path: "/",
    titleTag: "CaseWhy Hub — Partner with CaseWhy",
    description:
      "Partner with CaseWhy: the free USCIS case-status tracker, and CaseWhy Appeals, the Medicare appeals engine. Free listings and professional seats, line by line.",
    body,
    currentLineId: null,
    currentSharedId: null,
  });
}

function linePage(line) {
  const audiencePages = pages.filter((p) => p.line === line.id && p.inLineNav);
  const cards = audiencePages
    .map(
      (p) => `    <a class="card" href="${p.path}">
      <h2>${p.cardTitle}</h2>
      <p>${p.cardDesc}</p>
      <p class="arrow">Learn more →</p>
    </a>`
    )
    .join("\n");
  let body = readFileSync(join(__dirname, "content", `${line.content}.html`), "utf8");
  body = body.replace("{{AUDIENCE_CARDS}}", `<div class="cards">\n${cards}\n  </div>`);
  return pageHtml({
    path: line.path,
    titleTag: line.titleTag,
    description: line.description,
    body,
    currentLineId: line.id,
    currentSharedId: null,
  });
}

// --- write everything ---

function writePage(relPath, html) {
  const dir = join(ROOT, relPath.replace(/^\//, ""));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
  console.log("wrote", relPath);
}

writePage("/", homePage());

for (const line of lines) {
  writePage(line.path, linePage(line));
}

for (const p of pages) {
  const line = lineOf(p.line);
  writePage(
    p.path,
    pageHtml({
      path: p.path,
      titleTag: p.titleTag,
      description: p.description,
      contentId: p.content,
      currentLineId: line.id,
      currentSharedId: null,
      ogImage: p.ogImage,
      extraJsonLd: p.content !== "press" && p.content !== "appeals-press", // Organization JSON-LD is inline in those content files themselves
    })
  );
}

for (const p of companyPages) {
  writePage(
    p.path,
    pageHtml({
      path: p.path,
      titleTag: p.titleTag,
      description: p.description,
      contentId: p.content,
      currentLineId: null,
      currentSharedId: p.id,
      ogImage: p.ogImage,
    })
  );
}

const allUrls = [
  "/",
  ...lines.map((l) => l.path),
  ...pages.map((p) => p.path),
  ...companyPages.map((p) => p.path),
];
const sitemapUrls = allUrls
  .map((u) => `  <url><loc>https://casewhyhub.com${u}</loc></url>`)
  .join("\n");
writeFileSync(
  join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>\n`
);
console.log("wrote sitemap.xml");

// vercel.json's redirects, generated from the same registry so the table
// tested in scripts/verify.mjs and the table actually serving 301s can't
// drift apart.
const vercelJson = {
  redirects: redirects.map((r) => ({ source: r.from, destination: r.to, permanent: true })),
};
writeFileSync(join(ROOT, "vercel.json"), JSON.stringify(vercelJson, null, 2) + "\n");
console.log("wrote vercel.json");
