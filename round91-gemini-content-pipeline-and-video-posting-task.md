# New task for Claude Code — round 91: Gemini content pipeline (graphics + video) with scheduled posting

**Status: authorized Sep 14, 2026, depends on round 89 (queue) and on Peter's Google AI Studio API key (his checklist). Revised Sep 15: language-sequencing rule added (Section 5).**

(Full spec — the content brief store, generation, review→post, cadence, and language sequencing — see the Drive doc `claude_round91-gemini-content-pipeline-and-video-posting-task` / CLOUD_CLAUDE.md's Round 91 entry for the complete original text.)

## Out of scope

The long-form YouTube video. Any paid promotion. Spanish accounts and Spanish briefs (Phase 2).

## Verify live

- One brief → one rendered pin with legible headline and the correct size, queued with sources.
- One brief → one ≤60s captioned vertical video, queued.
- Approving a pin posts it to the CaseWhy Pinterest board and stores the pin URL.
- Monthly video cap stops the cron at the limit and logs why.
- A test brief with locale = es renders Spanish text and shows the ES chip in the queue.

---

## Claude Code build notes (Sep 15/16, 2026)

Shipped in full: real Gemini image generation, real Veo video generation with TTS narration and burned-in captions, a weekly render cron, real Pinterest/YouTube posters, TikTok/Instagram as manual_post per the task doc's own fallback.

**The task doc's own stated dependency turned out to be false**: no separate Google AI Studio API key is needed. Confirmed live before writing any pipeline code — Gemini image generation, Veo video generation, and TTS narration are all reachable through the same Vercel AI Gateway credentials this codebase already uses for every other AI call. Peter's checklist item for a Gemini key is gone.

**Three real bugs found via live local testing**: `ffmpeg-static`'s binary doesn't actually register the `drawtext` filter despite claiming freetype support — fixed with a `sharp`-rendered PNG caption overlay instead; `-shortest` was silently truncating each video clip to match a short TTS line instead of padding the audio — fixed with `apad` + an explicit `-t`; a client-bundle build failure from `youtube.ts`'s `googleapis` import being reachable through a client component — fixed by splitting the client-safe channel list into its own file.

**Verified live in production**: real triggered cron run, three real rendered images (correct dimensions, legible, real logo composited) and one real 32s captioned video with real audio, screenshotted in the live admin queue including the Spanish test brief's "ES" chip.

**Peter's real remaining steps** (not a Gemini key): Pinterest business account + app, a Google Cloud OAuth client for YouTube (one-time consent flow at `/api/admin/youtube-oauth/start`), cron-job.org registration for the weekly render cron, and TikTok/Instagram app registrations whenever convenient (not blocking).
