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
 *
 * Round 75 — round 37 detected browser but not platform, so Chrome/Firefox/
 * Edge on Android and Safari on desktop macOS all got the same instructions
 * as their desktop-Windows/Mac counterparts, even though the actual settings
 * path differs (a mobile browser's menu isn't an address-bar icon). Safari
 * is the sharpest case: `isIosNotInstalled()` above already gates out any
 * non-installed iOS visitor before this ever renders, so a "denied" Safari
 * visitor on iOS is *always* inside an installed home-screen PWA — meaning
 * the setting genuinely lives in the iOS Settings app, not in Safari's own
 * per-website permissions screen (which is what the old single macOS-shaped
 * instruction described, and iOS doesn't have at all). Also restructured
 * every browser's instructions from one dense sentence into numbered steps,
 * per Peter's own feedback that the original wording was harder to follow
 * than it should be even for a non-novice user.
 */
export type BrowserKind = "chrome" | "edge" | "firefox" | "safari" | "other";
export type Platform = "desktop" | "mobile";

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

export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  return /iP(hone|ad|od)|Android/.test(navigator.userAgent) ? "mobile" : "desktop";
}

/** Shown once, above the per-browser steps — context, not an apology, and
 * deliberately framed as "can happen when," never "this happened because,"
 * since the real cause for any individual visitor isn't actually known. */
export const NOTIFICATION_BLOCKED_WHY =
  "Your browser has notifications turned off for casewhy.com — this can happen automatically if a permission prompt was dismissed earlier, or if it was previously declined.";

export const NOTIFICATION_BLOCKED_WHY_ES =
  "Tu navegador tiene las notificaciones desactivadas para casewhy.com — esto puede pasar automáticamente si se cerró un aviso de permiso anteriormente, o si se rechazó previamente.";

export interface BlockedHelp {
  steps: string[];
  stepsEs: string[];
  helpUrl: string | null;
}

export const NOTIFICATION_BLOCKED_HELP: Record<BrowserKind, Record<Platform, BlockedHelp>> = {
  chrome: {
    desktop: {
      steps: [
        'Look at your browser\'s address bar — find the small icon just to the left of the web address (a lock, or a small "tune"/settings icon).',
        "Click it.",
        'Choose "Site settings."',
        'Find "Notifications" and change it to "Allow."',
        "Come back here and turn the toggle back on.",
      ],
      stepsEs: [
        'Mira la barra de direcciones de tu navegador — busca el pequeño ícono justo a la izquierda de la dirección web (un candado, o un pequeño ícono de "ajustes").',
        "Haz clic en él.",
        'Elige "Configuración del sitio."',
        'Busca "Notificaciones" y cámbialo a "Permitir."',
        "Regresa aquí y vuelve a activar el interruptor.",
      ],
      helpUrl: "https://support.google.com/chrome/answer/3220216",
    },
    mobile: {
      steps: [
        "Tap the three-dot menu in the top-right corner of Chrome.",
        'Tap "Settings," then "Site settings."',
        'Find or search for "casewhy.com," then tap "Notifications."',
        'Set it to "Allow."',
        "Come back here and turn the toggle back on.",
      ],
      stepsEs: [
        "Toca el menú de tres puntos en la esquina superior derecha de Chrome.",
        'Toca "Configuración," luego "Configuración del sitio."',
        'Busca o encuentra "casewhy.com," luego toca "Notificaciones."',
        'Cámbialo a "Permitir."',
        "Regresa aquí y vuelve a activar el interruptor.",
      ],
      helpUrl: "https://support.google.com/chrome/answer/3220216",
    },
  },
  edge: {
    desktop: {
      steps: [
        "Look at your browser's address bar — find the small lock icon just to the left of the web address.",
        "Click it.",
        'Choose "Permissions for this site."',
        'Find "Notifications" and change it to "Allow."',
        "Come back here and turn the toggle back on.",
      ],
      stepsEs: [
        "Mira la barra de direcciones de tu navegador — busca el pequeño ícono de candado justo a la izquierda de la dirección web.",
        "Haz clic en él.",
        'Elige "Permisos para este sitio."',
        'Busca "Notificaciones" y cámbialo a "Permitir."',
        "Regresa aquí y vuelve a activar el interruptor.",
      ],
      helpUrl: "https://support.microsoft.com/en-us/edge/manage-website-notifications-in-microsoft-edge",
    },
    mobile: {
      steps: [
        "Tap the three-dot menu at the bottom of Edge.",
        'Tap "Settings," then "Site permissions" → "Notifications."',
        'Find "casewhy.com" in the list and set it to "Allow."',
        "Come back here and turn the toggle back on.",
      ],
      stepsEs: [
        "Toca el menú de tres puntos en la parte inferior de Edge.",
        'Toca "Configuración," luego "Permisos del sitio" → "Notificaciones."',
        'Busca "casewhy.com" en la lista y cámbialo a "Permitir."',
        "Regresa aquí y vuelve a activar el interruptor.",
      ],
      helpUrl: "https://support.microsoft.com/en-us/edge/manage-website-notifications-in-microsoft-edge",
    },
  },
  firefox: {
    desktop: {
      steps: [
        "Look at your browser's address bar — find the small lock icon just to the left of the web address.",
        'Click it, then click "Connection secure."',
        'Click "More information," then open the Permissions tab.',
        'Find "Receive Notifications" and set it to "Allow."',
        "Come back here and turn the toggle back on.",
      ],
      stepsEs: [
        "Mira la barra de direcciones de tu navegador — busca el pequeño ícono de candado justo a la izquierda de la dirección web.",
        'Haz clic en él, luego haz clic en "Conexión segura."',
        'Haz clic en "Más información," luego abre la pestaña de Permisos.',
        'Busca "Recibir notificaciones" y cámbialo a "Permitir."',
        "Regresa aquí y vuelve a activar el interruptor.",
      ],
      helpUrl: "https://support.mozilla.org/en-US/kb/push-notifications-firefox",
    },
    mobile: {
      steps: [
        "Tap the three-dot menu in Firefox.",
        'Tap "Settings," then "Site permissions" → "Notifications."',
        'Find "casewhy.com" in the list and set it to "Allow."',
        "Come back here and turn the toggle back on.",
      ],
      stepsEs: [
        "Toca el menú de tres puntos en Firefox.",
        'Toca "Configuración," luego "Permisos del sitio" → "Notificaciones."',
        'Busca "casewhy.com" en la lista y cámbialo a "Permitir."',
        "Regresa aquí y vuelve a activar el interruptor.",
      ],
      helpUrl: "https://support.mozilla.org/en-US/kb/push-notifications-firefox",
    },
  },
  safari: {
    desktop: {
      steps: [
        "Open Safari's menu bar and go to Safari → Settings (or Preferences).",
        'Click the "Websites" tab, then "Notifications" in the sidebar.',
        'Find "casewhy.com" in the list and set it to "Allow."',
        "Come back here and turn the toggle back on.",
      ],
      stepsEs: [
        "Abre la barra de menú de Safari y ve a Safari → Configuración (o Preferencias).",
        'Haz clic en la pestaña "Sitios web," luego "Notificaciones" en la barra lateral.',
        'Busca "casewhy.com" en la lista y cámbialo a "Permitir."',
        "Regresa aquí y vuelve a activar el interruptor.",
      ],
      helpUrl: "https://support.apple.com/guide/safari/customize-settings-per-website-ibrw7f78f7fe/mac",
    },
    // Reaching "denied" as Safari on mobile always means an installed
    // home-screen PWA (see isIosNotInstalled() above) — the setting lives
    // in iOS's own Settings app, not in a Safari website-permissions screen.
    mobile: {
      steps: [
        "Open your iPhone/iPad's Settings app — not Safari.",
        'Scroll down to find "CaseWhy" in the list of installed apps.',
        'Tap it, then tap "Notifications."',
        'Turn "Allow Notifications" on.',
        "Come back here and turn the toggle back on.",
      ],
      stepsEs: [
        "Abre la app de Configuración de tu iPhone/iPad — no Safari.",
        'Desplázate hacia abajo para encontrar "CaseWhy" en la lista de apps instaladas.',
        'Tócala, luego toca "Notificaciones."',
        'Activa "Permitir notificaciones."',
        "Regresa aquí y vuelve a activar el interruptor.",
      ],
      helpUrl: "https://support.apple.com/guide/iphone/change-notification-settings-iph7c3c67fa/ios",
    },
  },
  other: {
    desktop: {
      steps: [
        "Look for a lock or site-info icon in your browser's address bar.",
        "Click it.",
        "Find the notification permission setting and allow it for casewhy.com.",
        "Come back here and turn the toggle back on.",
      ],
      stepsEs: [
        "Busca un ícono de candado o información del sitio en la barra de direcciones de tu navegador.",
        "Haz clic en él.",
        "Busca la configuración de permiso de notificaciones y actívala para casewhy.com.",
        "Regresa aquí y vuelve a activar el interruptor.",
      ],
      helpUrl: null,
    },
    mobile: {
      steps: [
        "Open your browser's menu (often three dots or three lines).",
        'Look for "Settings" → "Site settings" or "Site permissions."',
        "Find casewhy.com and allow notifications for it.",
        "Come back here and turn the toggle back on.",
      ],
      stepsEs: [
        "Abre el menú de tu navegador (a menudo tres puntos o tres líneas).",
        'Busca "Configuración" → "Configuración del sitio" o "Permisos del sitio."',
        "Busca casewhy.com y activa las notificaciones para él.",
        "Regresa aquí y vuelve a activar el interruptor.",
      ],
      helpUrl: null,
    },
  },
};
