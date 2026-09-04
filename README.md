# CaseWhy

AI-explained USCIS case status tracking. See the "Path to launch" roadmap
artifact for the full project timeline.

## Status

`npm install` and `npm run dev` both run cleanly. USCIS Torch developer
account and sandbox credentials are issued (`.env.local`, gitignored).
`getCaseStatus()` is wired to the real sandbox endpoint and verified
end-to-end with a live 200 response. The FOIA Request and Status API client
is also implemented and type-checked, but live sandbox testing is currently
blocked by a USCIS-side product-binding error (`InvalidAPICallAsNoApiProductMatchFound`)
unresolved after retries — see `~/casewhy/CLOUD_CLAUDE.md` for the latest.
Dashboard UI is still a placeholder, not yet wired to `getCaseStatus()`.

## What's here

- `src/app/page.tsx` — landing page (email capture, no backend wired yet)
- `src/app/dashboard/page.tsx` — placeholder for the logged-in case view, not
  yet wired to `getCaseStatus()`
- `src/lib/uscis/client.ts` — OAuth 2.0 client-credentials flow against the
  USCIS Torch API sandbox, plus `getCaseStatus()` (live, tested)
- `src/lib/uscis/foia.ts` — FOIA Request and Status API client
  (`createFoiaCase()`, `getFoiaCaseStatus()`); implemented but live-testing
  is blocked, see Status above
- `src/lib/config.ts` — env var loading/validation
- `.env.local` — sandbox credentials (gitignored); `.env.example` shows the
  structure

## USCIS API — what the "start API access" step actually requires

Researched from developer.uscis.gov (Sep 2026); confirm against the portal
directly since exact terms can change:

1. **Register** a developer account and app at developer.uscis.gov/get-started
   — this is what grants sandbox access (select the Case Status API product
   during app registration).
2. **Sandbox integration**, not just an account: USCIS requires *minimum 5
   consecutive calendar days of API traffic* against the sandbox using
   dynamic (not static/mock) data, exercising both success and 4xx error
   paths, before they'll even send you the production affidavit.
3. **Affidavit**: email USCIS Torch API developer support once the 5-day
   traffic requirement is met; they validate your traffic and send an
   affidavit to sign.
4. **Demo**: a live demo session (Tue/Wed/Fri, first-come-first-served)
   covering six things — UI usability, file upload, JSON payload handling,
   OAuth 2.0 auth, API response/error handling, and case status tracking.
   This means the sandbox build needs to be a genuinely working, demoable
   product, not a bare API call.
5. **Production access** granted after a passing demo. No stated SLA for
   any of the above steps.

**Implication for the roadmap:** the "Sandbox build & test" step isn't just
throwaway integration testing — it has to produce something demo-ready
(working OAuth flow, a UI that shows case status, file upload if applicable)
*before* the affidavit can even be requested, and needs 5+ days of traffic
logged. That's consistent with the current plan's Sep 9–25 sandbox window,
but leaves little slack — the account registration (Sep 7) should happen as
early as possible so the 5-day clock and build work can start immediately.

Sources:
- https://developer.uscis.gov/get-started
- https://developer.uscis.gov/get-started/production-access/request
- https://developer.uscis.gov/get-started/sandbox

## Next steps

1. Log sandbox traffic Mon Sep 7 – Thu Sep 10 (days 2-5 of the 5-day
   requirement; day 1 logged Fri Sep 4).
2. Wire `getCaseStatus()` into the dashboard page — also a prerequisite for
   the USCIS live demo.
3. Resolve the FOIA sandbox product-binding error (email USCIS Torch API
   developer support if it doesn't clear on its own).
4. Once the 5-day log is complete, email developersupport@uscis.dhs.gov to
   request the affidavit.
