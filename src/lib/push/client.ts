// Round 26 — client-side helpers for the push-notification toggle.
// Standard, well-known conversion: pushManager.subscribe() needs the VAPID
// public key as a Uint8Array, not the base64url string it's normally shared as.
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/** iOS Safari only supports web push once the PWA has been added to the home screen (iOS 16.4+) — never in a plain browser tab. */
export function isIosNotInstalled(): boolean {
  if (typeof navigator === "undefined") return false;
  const isIos = /iP(hone|ad|od)/.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return isIos && !isStandalone;
}

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

/**
 * Round 37 — once a user has denied/blocked notification permission, there's
 * no JS API to reopen that browser prompt; the only fix is guiding them to
 * the right settings screen by hand. `chrome://settings/...`-style internal
 * URLs can't be linked to or navigated to from a web page (browsers block
 * it), so this gives written icon/menu instructions plus a verified external
 * help-article link, rather than a dead internal link.
 */
export type BrowserKind = "chrome" | "edge" | "firefox" | "safari" | "other";

export function detectBrowser(): BrowserKind {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return "edge";
  if (/OPR\//.test(ua)) return "other";
  if (/Chrome\//.test(ua)) return "chrome";
  if (/Firefox\//.test(ua)) return "firefox";
  if (/Safari\//.test(ua)) return "safari";
  return "other";
}

export const NOTIFICATION_BLOCKED_HELP: Record<
  BrowserKind,
  { instructions: string; helpUrl: string | null }
> = {
  chrome: {
    instructions:
      'Click the lock or tune icon just left of the address bar, then "Site settings" → Notifications → Allow.',
    helpUrl: "https://support.google.com/chrome/answer/3220216",
  },
  edge: {
    instructions:
      'Click the lock icon just left of the address bar, then "Permissions for this site" → Notifications → Allow.',
    helpUrl: "https://support.microsoft.com/en-us/edge/manage-website-notifications-in-microsoft-edge",
  },
  firefox: {
    instructions:
      'Click the lock icon just left of the address bar → "Connection secure" → "More information" → Permissions, and allow Notifications.',
    helpUrl: "https://support.mozilla.org/en-US/kb/push-notifications-firefox",
  },
  safari: {
    instructions:
      "Open Safari → Settings → Websites → Notifications, find casewhy.com in the list, and set it to Allow.",
    helpUrl: "https://support.apple.com/guide/safari/customize-settings-per-website-ibrw7f78f7fe/mac",
  },
  other: {
    instructions:
      "Look for a lock or site-info icon in your browser's address bar, click it, and allow notifications for casewhy.com.",
    helpUrl: null,
  },
};
