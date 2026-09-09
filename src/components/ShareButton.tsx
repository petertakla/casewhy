"use client";

// Round 44 — one shared share component, reused at every placement across
// the app rather than one-off implementations per page. Uses the native
// Web Share API (navigator.share()) where supported — the best UX on
// mobile, since it hands off to the OS's own share sheet — and falls back
// to direct share-intent links (X, Facebook, LinkedIn, WhatsApp, email)
// plus a "copy link" button on desktop browsers that don't support it.
//
// The one hard rule (Peter's own framing): a share button must never leak
// anything account-specific. `text` is always a generic, page-appropriate
// pitch passed in by the caller — this component has no way to see a
// receipt number, case status, or any other account data, and never
// should. `?ref=share` is appended to the shared URL for basic reach
// measurement only — it doesn't identify the sharer or the recipient.

import { useState } from "react";

function withRefParam(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("ref", "share");
    return u.toString();
  } catch {
    // Relative URL (e.g. "/get-help") — build against window.location so
    // the ref param still gets appended without needing an absolute URL
    // from every caller.
    const u = new URL(url, typeof window !== "undefined" ? window.location.origin : "https://casewhy.com");
    u.searchParams.set("ref", "share");
    return u.toString();
  }
}

const iconClass = "h-4 w-4";

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} fill="currentColor" aria-hidden="true">
      <path d="M18.9 2H22l-7.6 8.7L23.3 22h-7.1l-5.5-7.2L4.3 22H1.2l8.1-9.3L1 2h7.3l5 6.6L18.9 2zm-1.2 18h1.9L7.4 4h-2l12.3 16z" />
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} fill="currentColor" aria-hidden="true">
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z" />
    </svg>
  );
}
function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} fill="currentColor" aria-hidden="true">
      <path d="M20.4 20.4h-3.5v-5.5c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.6H9.5V9h3.4v1.6h.1c.5-.9 1.6-1.8 3.3-1.8 3.5 0 4.1 2.3 4.1 5.3v6.3zM5.7 7.4a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM7.5 20.4H4V9h3.5v11.4z" />
    </svg>
  );
}
function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.7.8-.8 1-.2.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5.1-.1.2-.3.4-.4.1-.2.2-.3.2-.5.1-.2 0-.4 0-.5 0-.1-.6-1.5-.8-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2s1 2.6 1.1 2.7c.1.2 2 3 4.7 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z" />
    </svg>
  );
}
function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.5.4l2-2a5 5 0 0 0-7-7l-1.2 1.1" />
      <path d="M14 11a5 5 0 0 0-7.5-.4l-2 2a5 5 0 0 0 7 7l1.1-1.1" />
    </svg>
  );
}

export function ShareButton({
  url,
  title,
  text,
  label = "Share",
  className = "",
}: {
  url: string;
  title: string;
  text: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = withRefParam(url);

  async function handleClick() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, text, url: shareUrl });
      } catch {
        // AbortError on user cancel, or an unsupported call — either way,
        // no fallback needed here since navigator.share exists.
      }
      return;
    }
    setOpen((o) => !o);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable/denied — the direct share links below
      // still work, so this isn't a hard failure.
    }
  }

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(text);

  const links = [
    {
      key: "x",
      label: "Share on X",
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      Icon: XIcon,
    },
    {
      key: "facebook",
      label: "Share on Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      Icon: FacebookIcon,
    },
    {
      key: "linkedin",
      label: "Share on LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      Icon: LinkedInIcon,
    },
    {
      key: "whatsapp",
      label: "Share on WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${text} ${shareUrl}`)}`,
      Icon: WhatsAppIcon,
    },
    {
      key: "email",
      label: "Share by email",
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${shareUrl}`)}`,
      Icon: EmailIcon,
    },
  ];

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-surface-2"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="m8.6 10.5 6.8-3.9M8.6 13.5l6.8 3.9" />
        </svg>
        {label}
      </button>

      {open && (
        <div className="absolute left-0 z-10 mt-2 flex items-center gap-1 rounded-xl border border-border bg-surface p-2 shadow-lg">
          {links.map(({ key, label: linkLabel, href, Icon }) => (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={linkLabel}
              title={linkLabel}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <Icon />
            </a>
          ))}
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy link"
            title="Copy link"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <LinkIcon />
          </button>
          {copied && <span className="pl-1 text-xs text-muted">Copied!</span>}
        </div>
      )}
    </div>
  );
}
