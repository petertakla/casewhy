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
