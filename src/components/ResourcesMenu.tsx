"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { PUBLIC_PAGES } from "@/lib/site/pages";

// Round 101 — the header's reference-links dropdown, built from the
// registry (showInHeaderMenu), never a second hand list.
//
// Rendered via a portal into document.body rather than as a plain
// absolutely-positioned child. The trigger normally lives inside
// AuthHeader's `overflow-x-auto` scrollable nav row (round 71's fade-mask
// affordance) — an ancestor with overflow-x set to anything but `visible`
// forces the browser to compute overflow-y as `auto` too, which would
// clip a same-ancestor dropdown to that scroll container's own ~single-
// line height. A portal sidesteps the clipping entirely; the menu closes
// itself if that ancestor scrolls (see the scroll listener below) so a
// portal-positioned menu can never end up visually detached from its
// trigger.
const RESOURCES_ITEMS = PUBLIC_PAGES.filter((p) => p.showInHeaderMenu);

export function ResourcesMenu({ isSpanish, pathname }: { isSpanish: boolean; pathname: string }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Close on route change — the task's own "closes on ... route change".
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    // A scroll of the nav's own horizontal scroll container (or the page)
    // would leave a portal-positioned menu visually detached from its
    // trigger — simplest safe fix is to close it, same as any other
    // dropdown that doesn't track scroll continuously.
    function handleScroll() {
      setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, [open]);

  function toggleOpen() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 6, left: rect.left });
    }
    setOpen((o) => !o);
  }

  function handleItemKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      itemRefs.current[(index + 1) % RESOURCES_ITEMS.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      itemRefs.current[(index - 1 + RESOURCES_ITEMS.length) % RESOURCES_ITEMS.length]?.focus();
    }
  }

  const active = RESOURCES_ITEMS.some((item) => {
    const href = isSpanish && item.hrefEs ? item.hrefEs.split("?")[0] : item.href;
    return pathname.startsWith(href);
  });

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggleOpen}
        className={`whitespace-nowrap pb-0.5 ${
          active ? "border-b-2 border-brand-500 font-semibold text-foreground" : "text-muted hover:text-foreground"
        }`}
      >
        {isSpanish ? "Recursos" : "Resources"} <span aria-hidden="true">▾</span>
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={isSpanish ? "Recursos" : "Resources"}
            style={{ position: "fixed", top: coords.top, left: coords.left }}
            className="z-30 w-56 rounded-lg border border-border bg-surface p-1 shadow-lg"
          >
            {RESOURCES_ITEMS.map((item, i) => {
              const href = isSpanish && item.hrefEs ? item.hrefEs : item.href;
              const label = isSpanish ? item.menuLabelEs ?? item.labelEs ?? item.label : item.menuLabel ?? item.label;
              return (
                <Link
                  key={item.href}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  href={href}
                  role="menuitem"
                  onKeyDown={(e) => handleItemKeyDown(e, i)}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-foreground"
                >
                  {label}
                </Link>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
