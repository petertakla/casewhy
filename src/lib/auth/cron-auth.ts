// Accepts either CRON_SECRET (the value the external scheduler,
// cron-job.org, is registered with) or ADMIN_DIAG_SECRET (a secret this
// Claude Code session generated and set itself, specifically so it can
// trigger and test real deployed routes directly -- via curl, with a
// value it actually knows -- without needing Peter to run commands or
// paste back secret values he has to look up. Both are valid; either one
// authenticates a request to a route using this helper.
export function isAuthorizedCronRequest(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const provided = authHeader.slice("Bearer ".length);

  const cronSecret = process.env.CRON_SECRET;
  const adminDiagSecret = process.env.ADMIN_DIAG_SECRET;

  return (Boolean(cronSecret) && provided === cronSecret) || (Boolean(adminDiagSecret) && provided === adminDiagSecret);
}
