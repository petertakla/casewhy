import { redirect, permanentRedirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

// Round 74 — app.casewhy.com's signed-out landing page had drifted out of
// sync with casewhy.com's real marketing site three times (round 68, round
// 71, and again here) despite a "remember to update both" rule. Structural
// fix per Peter's direct instruction: casewhy.com is now the single,
// permanent source of truth for the landing page — see CLOUD_CLAUDE.md's
// standing rule. This route no longer renders its own copy.
//
// A real 308 permanent redirect (not a client-side one), per the task
// doc's own instruction, so search engines and tooling treat this as a
// genuine permanent move rather than something to keep indexing on its
// own — ties into round 73's indexing work.
//
// The task doc assumed a pre-existing signed-in root experience to
// preserve ("keep signed-in behavior as-is") — that didn't actually exist
// in this file. There was no session check here at all; every visitor,
// signed in or not, saw the same static marketing page. Since that
// content is being deleted regardless, signed-in visitors are sent to
// /dashboard (their real home, which already handles its own session
// state) rather than left on a redirect meant for signed-out visitors.
export default async function RootPage() {
  const { data: session } = await auth.getSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  permanentRedirect("https://casewhy.com");
}
