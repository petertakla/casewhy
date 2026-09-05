// Centralized, validated access to environment config. Import this instead
// of reading process.env directly so a missing var fails fast and loudly
// in one place rather than as a mystery 401 deep in the USCIS client.

type UscisEnv = "sandbox" | "production";

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Copy .env.example to .env.local and fill it in.`
    );
  }
  return value;
}

export function getUscisConfig() {
  const env = (process.env.USCIS_ENV as UscisEnv) || "sandbox";

  const tokenUrl =
    env === "production"
      ? required("USCIS_PRODUCTION_TOKEN_URL", process.env.USCIS_PRODUCTION_TOKEN_URL)
      : required("USCIS_SANDBOX_TOKEN_URL", process.env.USCIS_SANDBOX_TOKEN_URL);

  const apiBase =
    env === "production"
      ? required("USCIS_PRODUCTION_API_BASE", process.env.USCIS_PRODUCTION_API_BASE)
      : required("USCIS_SANDBOX_API_BASE", process.env.USCIS_SANDBOX_API_BASE);

  return {
    env,
    tokenUrl,
    apiBase,
    clientId: required("USCIS_CLIENT_ID", process.env.USCIS_CLIENT_ID),
    clientSecret: required("USCIS_CLIENT_SECRET", process.env.USCIS_CLIENT_SECRET),
  };
}

/**
 * FOIA has its own Torch credential pair, distinct from the Case Status
 * one above — USCIS confirmed Sep 5, 2026 that the "duplicate, unused"
 * pair previously sitting in the dev portal (client ID starting `Umv`) is
 * actually the real, active FOIA credential, not a Case Status duplicate.
 * Same token/API base URLs (both APIs share the Torch platform), different
 * client id/secret.
 */
export function getUscisFoiaConfig() {
  const env = (process.env.USCIS_ENV as UscisEnv) || "sandbox";

  const tokenUrl =
    env === "production"
      ? required("USCIS_PRODUCTION_TOKEN_URL", process.env.USCIS_PRODUCTION_TOKEN_URL)
      : required("USCIS_SANDBOX_TOKEN_URL", process.env.USCIS_SANDBOX_TOKEN_URL);

  const apiBase =
    env === "production"
      ? required("USCIS_PRODUCTION_API_BASE", process.env.USCIS_PRODUCTION_API_BASE)
      : required("USCIS_SANDBOX_API_BASE", process.env.USCIS_SANDBOX_API_BASE);

  return {
    env,
    tokenUrl,
    apiBase,
    clientId: required("USCIS_FOIA_CLIENT_ID", process.env.USCIS_FOIA_CLIENT_ID),
    clientSecret: required("USCIS_FOIA_CLIENT_SECRET", process.env.USCIS_FOIA_CLIENT_SECRET),
  };
}
