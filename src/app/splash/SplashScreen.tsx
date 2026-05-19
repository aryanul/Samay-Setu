"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import "./splash.css";

/**
 * Sequence (in seconds):
 *  0.1  ambient orb + concentric rings fade in
 *  0.5  gold dot lands (bounce)
 *  0.7  bridge curve traces from gold end toward dark end (1.4s)
 *  1.7  dark dot lands (bounce)
 *  1.8  three gold particles begin flowing along the curve
 *  2.0  "samay" rises into place
 *  2.25 "setu" rises (gold)
 *  2.7  tagline fades in
 *  3.4  "Enter the circle" CTA reveals + becomes clickable
 */
export const SPLASH_READY_AT_MS = 3400;

export type SplashScreenProps = {
  /** Show the "Enter the circle" CTA after the sequence completes. Default true. */
  showCta?: boolean;
  /** Where the CTA links to when it's a Link. Default "/dashboard". */
  ctaHref?: string;
  /** When set, CTA renders as a button that calls this instead of navigating. */
  onCtaClick?: () => void;
  /** When true, the root fades out (used by FirstLoadSplash for dismissal). */
  dismissed?: boolean;
};

export default function SplashScreen({
  showCta = true,
  ctaHref = "/dashboard",
  onCtaClick,
  dismissed = false,
}: SplashScreenProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduce ? 0 : SPLASH_READY_AT_MS;
    const handle = window.setTimeout(() => setReady(true), delay);
    return () => window.clearTimeout(handle);
  }, []);

  return (
    <div
      className="splash-root"
      data-ready={ready ? "true" : "false"}
      data-dismissed={dismissed ? "true" : "false"}
    >
      <div className="splash-grain" aria-hidden="true" />
      <div className="splash-orb" aria-hidden="true" />
      <div className="splash-ring splash-ring-1" aria-hidden="true" />
      <div className="splash-ring splash-ring-2" aria-hidden="true" />

      <div className="splash-stage">
        <svg
          viewBox="0 0 36 36"
          width="100%"
          height="100%"
          className="splash-mark"
          role="img"
          aria-label="Samay Setu"
        >
          <defs>
            <linearGradient
              id="splash-bridge-grad"
              x1="8"
              y1="24"
              x2="28"
              y2="12"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#d4b478" />
              <stop offset="0.6" stopColor="#b08a4a" />
              <stop offset="1" stopColor="#3d3b35" />
            </linearGradient>
            <radialGradient id="splash-gold-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#f1d699" stopOpacity="0.9" />
              <stop offset="1" stopColor="#c9a96e" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Soft halo behind the gold dot — adds weight to the landing */}
          <circle
            cx={8}
            cy={24}
            r={6}
            fill="url(#splash-gold-glow)"
            className="splash-halo splash-halo-gold"
          />

          {/* The bridge curve — traced by stroke-dashoffset */}
          <path
            id="splash-bridge-path"
            className="splash-curve"
            pathLength={100}
            d="M8 24 C8 14, 18 10, 18 18 C18 26, 28 22, 28 12"
            stroke="url(#splash-bridge-grad)"
            strokeWidth={1.6}
            strokeLinecap="round"
            fill="none"
          />

          {/* Endpoints */}
          <circle
            cx={8}
            cy={24}
            r={2.5}
            fill="#c9a96e"
            className="splash-dot splash-dot-gold"
          />
          <circle
            cx={28}
            cy={12}
            r={2.5}
            fill="#1a1a18"
            className="splash-dot splash-dot-ink"
          />

          {/* Gold particles flowing along the bridge — continuous after curve lands */}
          <g className="splash-particles">
            <circle r={0.5} fill="#f1d699" className="splash-particle">
              <animateMotion dur="2.6s" begin="1.9s" repeatCount="indefinite" rotate="auto">
                <mpath href="#splash-bridge-path" />
              </animateMotion>
            </circle>
            <circle r={0.38} fill="#e8c280" className="splash-particle">
              <animateMotion dur="2.6s" begin="2.4s" repeatCount="indefinite" rotate="auto">
                <mpath href="#splash-bridge-path" />
              </animateMotion>
            </circle>
            <circle r={0.3} fill="#d4b478" className="splash-particle">
              <animateMotion dur="2.6s" begin="2.9s" repeatCount="indefinite" rotate="auto">
                <mpath href="#splash-bridge-path" />
              </animateMotion>
            </circle>
          </g>
        </svg>
      </div>

      <div className="splash-text">
        <h1 className="splash-word">
          <span className="splash-word-1">samay</span>
          <span className="splash-word-2">setu</span>
        </h1>
        <p className="splash-tag">A circle of trade, not transaction.</p>
      </div>

      {showCta ? (
        onCtaClick ? (
          <button
            type="button"
            className="splash-enter"
            onClick={onCtaClick}
            aria-hidden={!ready}
            tabIndex={ready ? 0 : -1}
          >
            Enter the circle <span aria-hidden="true">↗</span>
          </button>
        ) : (
          <Link
            href={ctaHref}
            className="splash-enter"
            aria-hidden={!ready}
            tabIndex={ready ? 0 : -1}
          >
            Enter the circle <span aria-hidden="true">↗</span>
          </Link>
        )
      ) : null}
    </div>
  );
}
