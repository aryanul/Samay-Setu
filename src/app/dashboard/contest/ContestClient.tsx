"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ContestSnapshot, LeaderRow } from "@/lib/contest";
import TrophyIcon from "@/components/TrophyIcon";

const ArrowUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="m18 15-6-6-6 6" />
  </svg>
);

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function formatRemaining(deadlineIso: string, now: number): string {
  const end = new Date(deadlineIso).getTime();
  if (Number.isNaN(end)) return "";
  const ms = end - now;
  if (ms <= 0) return "Race closed";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${pad2(sec)}s`;
  return `${m}m ${pad2(sec)}s`;
}

function Avatar({ name, picture }: { name: string; picture: string | null }) {
  if (picture) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={picture} alt="" />;
  }
  return <span className="lb-av-fallback">{initials(name)}</span>;
}

function LeaderboardRow({ row }: { row: LeaderRow }) {
  const rankClass = row.rank <= 3 ? `top${row.rank}` : "";
  return (
    <article className={`lb-row ${rankClass}${row.isYou ? " you" : ""}`}>
      <div className="lb-rank">{pad2(row.rank)}</div>
      <div className="lb-av">
        <Avatar name={row.name} picture={row.picture} />
      </div>
      <div className="lb-body">
        <div className="nm">{row.isYou ? `${row.name} (you)` : row.name}</div>
        {row.title && <div className="ti">{row.title}</div>}
      </div>
      <div className={`lb-trend${row.today > 0 ? "" : " flat"}`}>
        {row.today > 0 ? (
          <>
            <ArrowUp /> +{row.today} today
          </>
        ) : (
          "— today"
        )}
      </div>
      <div className="lb-refs">
        <div className="n">{pad2(row.refs)}</div>
        <div className="d">verified</div>
      </div>
    </article>
  );
}

export default function ContestClient({ initial }: { initial: ContestSnapshot }) {
  const [data, setData] = useState<ContestSnapshot>(initial);
  const [now, setNow] = useState<number>(() => Date.now());
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tick the countdown every second.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Poll the live leaderboard every 60s.
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const res = await fetch("/api/contest", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && json?.ok && json.snapshot) {
          setData(json.snapshot as ContestSnapshot);
        }
      } catch {
        /* transient network error — keep last good data */
      }
    };
    const id = setInterval(refresh, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);

  const { config, you, leaderboard, totalRacers } = data;
  const countdown = useMemo(
    () => formatRemaining(config.deadlineIso, now),
    [config.deadlineIso, now]
  );

  const copyInvite = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(you.inviteUrl);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — no-op */
    }
  }, [you.inviteUrl]);

  const shareLinkedIn = useCallback(() => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      you.inviteUrl
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [you.inviteUrl]);

  const shareInstagram = useCallback(async () => {
    const text = `Join me on Samay Setu — trade your time, not money. ${you.inviteUrl}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Samay Setu", text, url: you.inviteUrl });
        return;
      } catch {
        /* user dismissed — fall through to copy */
      }
    }
    await copyInvite();
  }, [you.inviteUrl, copyInvite]);

  // If the viewer is racing but sits outside the rendered slice, append them.
  const youInList = leaderboard.some((r) => r.isYou);
  const appendYou = you.inRace && !youInList && you.rank !== null;

  const rankLabel = you.rank !== null ? you.rank : "—";
  const refsToTopLabel =
    you.refsToTop === null
      ? "—"
      : you.refsToTop === 0
        ? "In the top " + config.winners
        : `+${you.refsToTop}`;

  return (
    <div className="ss-contest">
      {/* ── Hero ── */}
      <section className="hero-wrap">
        <div className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              {config.title}
              <span className="timer">
                {countdown === "Race closed" ? "Race closed" : <>Closes in <strong>{countdown}</strong></>}
              </span>
            </p>
            <h1>
              {config.eyebrow}.
              <em>{config.tagline}</em>
            </h1>
            <p className="lede">
              {config.winners} <strong>Lifetime VIP Passes</strong> to the Samay Setu Elite Hub. Awarded to
              the {config.winners} practitioners whose unique invite links bring in the most verified
              registrations. No money, just network power.
            </p>
          </div>
          <div className="prize-emblem">
            <div className="prize-card">
              <div className="prize-trophy"><TrophyIcon /></div>
              <div className="prize-title">{config.prize.title}</div>
              <div className="prize-sub">{config.prize.sub}</div>
              <ul className="prize-list">
                {config.prize.perks.map((perk, i) => (
                  <li key={i}>{perk}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" aria-hidden="true" />

      <div className="body-wrap">
        {/* ── Your standing ── */}
        <aside className="stats-card">
          <div className="stats-label">Your standing</div>
          <div className="stats-rank">
            <span className="stats-rank-prefix">#</span>
            {rankLabel}
          </div>
          <div className="stats-rank-sub">
            {you.inRace
              ? `out of ${totalRacers} practitioner${totalRacers === 1 ? "" : "s"} racing`
              : "Share your link to enter the race"}
          </div>

          <div className="stats-divider" />

          <div className="stat-row">
            <span className="k">Verified referrals</span>
            <span className="v">{pad2(you.refs)}</span>
          </div>
          <div className="stat-row">
            <span className="k">Joined today</span>
            <span className="v">{pad2(you.today)}</span>
          </div>
          <div className="stat-row">
            <span className="k">Refs to break top {config.winners}</span>
            <span className="v">{refsToTopLabel}</span>
          </div>

          <div className="invite">
            <span className="invite-url" title={you.inviteUrl}>
              {you.inviteUrl.replace(/^https?:\/\//, "")}
            </span>
            <button className="invite-copy" type="button" onClick={copyInvite}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="invite-hint">
            Every verified architect who joins through this link counts toward your rank.
          </p>

          <div className="shares">
            <button className="share" type="button" onClick={shareInstagram}>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.405a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z" />
              </svg>
              Instagram Story
            </button>
            <button className="share" type="button" onClick={shareLinkedIn}>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
              </svg>
              Share on LinkedIn
            </button>
          </div>
        </aside>

        {/* ── Leaderboard ── */}
        <section className="lb-wrap">
          <div className="lb-head">
            <h2>
              The <em>live leaderboard</em>
            </h2>
            <span className="live-pill">LIVE · UPDATES EVERY 60s</span>
          </div>

          {leaderboard.length === 0 ? (
            <div className="lb-empty">
              No verified referrals yet — be the first to share your link and take rank #1.
            </div>
          ) : (
            <div className="lb-list">
              {leaderboard.map((row) => (
                <div key={row.memberId}>
                  <LeaderboardRow row={row} />
                  {row.rank === config.winners && leaderboard.length > config.winners && (
                    <div className="lb-divider">
                      <span>The cut-line for the VIP pass</span>
                    </div>
                  )}
                </div>
              ))}

              {appendYou && you.rank !== null && (
                <>
                  <div className="lb-divider">
                    <span>your position</span>
                  </div>
                  <LeaderboardRow
                    row={{
                      memberId: you.memberId,
                      rank: you.rank,
                      name: "You",
                      title: null,
                      picture: null,
                      refs: you.refs,
                      today: you.today,
                      isYou: true,
                    }}
                  />
                </>
              )}
            </div>
          )}

          {/* ── How it works ── */}
          <section className="how">
            <h3>
              How the race <em>actually works</em>
            </h3>
            <p className="how-sub">
              Three steps. No likes, no follow-for-follow. We only count verified, onboarded architects.
            </p>
            <div className="how-steps">
              <div className="how-step">
                <div className="n">01</div>
                <div className="h">Share your unique link</div>
                <div className="b">
                  Copy your invite link and post it to your Instagram Story or LinkedIn feed.
                </div>
              </div>
              <div className="how-step">
                <div className="n">02</div>
                <div className="h">They join with LinkedIn</div>
                <div className="b">
                  When someone uses your link and completes Verified Architect onboarding, the referral
                  counts.
                </div>
              </div>
              <div className="how-step">
                <div className="n">03</div>
                <div className="h">Top {config.winners} win</div>
                <div className="b">
                  When the race closes, the top {config.winners} receive the VIP pass &amp; Legendary
                  Architect badge.
                </div>
              </div>
            </div>
          </section>
        </section>
      </div>
    </div>
  );
}
