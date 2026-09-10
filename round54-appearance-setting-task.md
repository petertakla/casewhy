# New task for Claude Code — round 54: add a System / Light / Dark appearance setting

**Status: authorized now, Sep 10.** Checked directly: dark-mode styling already exists throughout the app (`dark:` Tailwind classes are used widely — e.g. `VerificationLinks.tsx`, `/plus`), but there's no user-controllable toggle anywhere — `src/app/layout.tsx` has no theme provider or class-based dark-mode wiring, so today it can only follow the OS/browser's `prefers-color-scheme`, with no way for a user to override it. Peter wants a real three-way setting: System / Light / Dark.

## Build

- Add a theme provider (e.g. `next-themes`, or a small hand-rolled equivalent if a dependency isn't wanted — your call, but `next-themes` is the standard, well-tested choice for this exact App Router pattern) to `src/app/layout.tsx`, defaulting to `system`.
- Confirm Tailwind's dark-mode strategy is set to `class` (check `tailwind.config` / `globals.css`'s Tailwind v4 config, whichever this project uses) rather than relying on the `media` strategy it may currently be using implicitly — the toggle needs to set a class, not just hope the OS setting matches.
- New "Appearance" section in `src/app/settings/SettingsForm.tsx`, matching the existing section pattern (see "Notifications," "News sources") — a 3-way control (System / Light / Dark), not a single on/off toggle, styled consistently with the rest of the page.
- Persist the choice (theme providers like `next-themes` handle this via `localStorage` by default, which is fine here — no need for a DB column unless Peter wants the preference to follow him across devices, which isn't part of this ask).
- No flash-of-wrong-theme on load — `next-themes` (or whatever's used) handles this correctly out of the box; if hand-rolling, make sure the initial theme class is set before first paint (inline script in `<head>`), not after React hydrates.

## Verify live

Confirm all three states actually change the app's appearance in a real browser (not just toggle a value), confirm the choice persists across a reload, confirm no flash of the wrong theme on a hard reload, confirm existing pages that already use `dark:` classes (Plus page, Get Help detail pages, etc.) render correctly in both light and dark once the toggle is wired up — this is a good moment to catch any page that was only ever visually checked in one mode. `tsc`/lint clean, production build succeeds. Report back and fold into `CLOUD_CLAUDE.md`'s standing status.
