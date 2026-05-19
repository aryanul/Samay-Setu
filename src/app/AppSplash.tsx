"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import SplashScreen, { SPLASH_READY_AT_MS } from "./splash/SplashScreen";

const SESSION_KEY = "ss-splash-seen";
/**
 * How long the navigation splash stays at full opacity before fading.
 * Long enough for both endpoints to bounce in and the bridge curve to
 * finish drawing — "the dots connect" moment the user asked for.
 * (Gold dot lands 0.5s, curve completes ~2.0s, dark dot lands 1.7s.)
 */
const NAV_HOLD_MS = 2400;
const FADE_MS = 700;

type Phase = "active" | "fading" | "done";

/**
 * Single component for all splash behaviour:
 *
 * - **First load** (no sessionStorage marker): full splash with "Enter the
 *   circle" CTA. User clicks to dismiss; sessionStorage marker set.
 * - **Returning visit** (marker present, first mount): splash dismisses on
 *   the next tick.
 * - **Navigation** (any subsequent route change): short splash without CTA,
 *   triggered SYNCHRONOUSLY on the link click so the destination page never
 *   paints unmasked. Holds for NAV_HOLD_MS, then fades.
 * - **The /splash preview route**: this overlay is suppressed (that page
 *   renders its own splash).
 *
 * Why we intercept clicks instead of just watching `usePathname()`:
 * `usePathname()` only updates AFTER the navigation has committed and the
 * new page has begun rendering, which is exactly the flash you'd see. The
 * click interceptor flips state in the same event tick so the splash is
 * mounted before Next.js even starts fetching the new route.
 */
export default function AppSplash({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("active");
  const [withCta, setWithCta] = useState(true);
  const [navTick, setNavTick] = useState(0);
  const [trackedPathname, setTrackedPathname] = useState<string | null>(null);
  const isFirstRunRef = useRef(true);

  // Pathname-change fallback: handles navigations that don't go through a
  // clickable <a> (router.push, back/forward, etc.). Runs during render so
  // we never commit a frame with the new page visible behind no splash.
  if (trackedPathname !== pathname) {
    setTrackedPathname(pathname);
    if (pathname === "/splash") {
      if (phase !== "done") setPhase("done");
    } else if (!isFirstRunRef.current && phase === "done") {
      // Only fire here if the click interceptor didn't already activate it.
      setPhase("active");
      setWithCta(false);
      setNavTick((t) => t + 1);
    }
  }

  // First-mount only: dismiss instantly for returning visitors.
  useEffect(() => {
    if (!isFirstRunRef.current) return;
    isFirstRunRef.current = false;
    if (pathname === "/splash") return;
    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      // Private mode / disabled storage — leave the splash up.
    }
    if (!seen) return;
    const handle = window.setTimeout(() => setPhase("done"), 0);
    return () => window.clearTimeout(handle);
  }, [pathname]);

  // Click interceptor — the load-bearing piece. Captures internal link
  // clicks BEFORE Next.js starts navigating and flips splash state in the
  // same tick. Result: the splash is on the screen before the destination
  // page can paint.
  useEffect(() => {
    function isInternalNav(link: HTMLAnchorElement): boolean {
      const href = link.getAttribute("href");
      if (!href) return false;
      if (/^(https?:)?\/\//i.test(href)) return false;
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
      if (link.getAttribute("target") === "_blank") return false;
      if (link.hasAttribute("download")) return false;
      const path = href.split("?")[0].split("#")[0];
      if (!path || path === pathname) return false;
      if (path === "/splash") return false;
      return true;
    }

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target as Element | null;
      const link = target?.closest?.("a") as HTMLAnchorElement | null;
      if (!link || !isInternalNav(link)) return;
      if (isFirstRunRef.current || withCta) return; // first-load CTA owns the screen
      setPhase("active");
      setWithCta(false);
      setNavTick((t) => t + 1);
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [pathname, withCta]);

  // Auto-dismiss for navigation splash. Resets on each new nav via navTick.
  useEffect(() => {
    if (phase !== "active" || withCta) return;
    const fadeT = window.setTimeout(() => setPhase("fading"), NAV_HOLD_MS);
    const doneT = window.setTimeout(() => setPhase("done"), NAV_HOLD_MS + FADE_MS);
    return () => {
      window.clearTimeout(fadeT);
      window.clearTimeout(doneT);
    };
  }, [phase, withCta, navTick]);

  // Safety net for the first-load CTA: if the user never clicks, eventually
  // dismiss so a forgotten tab doesn't stay blocked forever.
  useEffect(() => {
    if (phase !== "active" || !withCta) return;
    const t = window.setTimeout(handleCtaClick, SPLASH_READY_AT_MS + 6000);
    return () => window.clearTimeout(t);
  }, [phase, withCta]);

  function handleCtaClick() {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // ignore
    }
    setPhase("fading");
    window.setTimeout(() => setPhase("done"), FADE_MS);
  }

  const splashVisible = phase !== "done";

  return (
    <>
      {children}
      {splashVisible && (
        <SplashScreen
          key={navTick}
          showCta={withCta}
          onCtaClick={withCta ? handleCtaClick : undefined}
          dismissed={phase === "fading"}
        />
      )}
    </>
  );
}
