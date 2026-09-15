import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";

// Round 98 — AuthHeader.tsx (a client component, rendered on every page)
// needs to know whether to show the "Admin" nav entry, but ADMIN_EMAIL
// can never be shipped to the client bundle to check that directly --
// this route is the one place that check actually happens, using the
// same real session cookie every other admin page already trusts, not a
// bearer secret (there's no diagnostic use case here, just "should this
// signed-in browser see a nav link").
export async function GET() {
  const { data: session } = await auth.getSession();
  return Response.json({ isAdmin: isAdminEmail(session?.user?.email) });
}
