"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const POLL_MS = 5000;
const TOAST_MS = 6000;

type Event =
  | {
      kind: "bridge_received";
      bridgeId: number;
      from: { id: number; name: string; picture: string | null };
      note: string;
      at: string;
    }
  | {
      kind: "bridge_accepted";
      bridgeId: number;
      threadId: number | null;
      other: { id: number; name: string; picture: string | null };
      at: string;
    }
  | {
      kind: "bridge_declined";
      bridgeId: number;
      other: { id: number; name: string; picture: string | null };
      at: string;
    }
  | {
      kind: "message_received";
      threadId: number;
      messageId: number;
      from: { id: number; name: string; picture: string | null };
      preview: string;
      at: string;
    };

type Toast = {
  id: number;
  tone: "info" | "good" | "muted";
  picture: string | null;
  title: string;
  body: string;
  href?: string;
};

export default function NotificationsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const sinceRef = useRef<string | null>(null);
  const toastIdRef = useRef(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = ++toastIdRef.current;
      setToasts((prev) => [...prev, { id, ...t }]);
      window.setTimeout(() => dismiss(id), TOAST_MS);
    },
    [dismiss]
  );

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | null = null;

    async function poll() {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const url = sinceRef.current
          ? `/api/notifications?since=${encodeURIComponent(sinceRef.current)}`
          : "/api/notifications";
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { ok: boolean; now: string; events: Event[] };
        if (cancelled || !data.ok) return;

        sinceRef.current = data.now;

        let needsRefresh = false;

        for (const ev of data.events) {
          if (ev.kind === "bridge_received") {
            push({
              tone: "info",
              picture: ev.from.picture,
              title: `${ev.from.name} sent you a Bridge offer`,
              body: ev.note,
              href: "/dashboard/bridges",
            });
            needsRefresh = true;
          } else if (ev.kind === "bridge_accepted") {
            push({
              tone: "good",
              picture: ev.other.picture,
              title: `${ev.other.name} accepted your Bridge`,
              body: "The chat is open — say hello.",
              href: ev.threadId ? `/dashboard/chat/${ev.threadId}` : "/dashboard/chat",
            });
            needsRefresh = true;
          } else if (ev.kind === "bridge_declined") {
            push({
              tone: "muted",
              picture: ev.other.picture,
              title: "Bridge offer declined",
              body: `${ev.other.name} won't be opening this one.`,
            });
            needsRefresh = true;
          } else if (ev.kind === "message_received") {
            const onThisThread = pathnameRef.current === `/dashboard/chat/${ev.threadId}`;
            if (onThisThread) continue;
            push({
              tone: "info",
              picture: ev.from.picture,
              title: ev.from.name,
              body: ev.preview,
              href: `/dashboard/chat/${ev.threadId}`,
            });
          }
        }

        if (needsRefresh) {
          router.refresh();
        }
      } catch {
        /* swallow — next tick will retry */
      }
    }

    function start() {
      if (intervalId !== null) return;
      void poll();
      intervalId = window.setInterval(poll, POLL_MS);
    }
    function stop() {
      if (intervalId === null) return;
      window.clearInterval(intervalId);
      intervalId = null;
    }
    function onVisibility() {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    }

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [push, router]);

  if (toasts.length === 0) return null;

  return (
    <div className="ss-toaster" role="region" aria-live="polite" aria-label="Notifications">
      {toasts.map((t) => (
        <div key={t.id} className={`ss-toast ss-toast-${t.tone}`} role="status">
          {t.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="ss-toast-avatar" src={t.picture} alt="" width={36} height={36} />
          ) : (
            <div className="ss-toast-avatar ss-toast-avatar-fallback" aria-hidden="true" />
          )}
          <div className="ss-toast-body-wrap">
            <p className="ss-toast-title">{t.title}</p>
            <p className="ss-toast-body">{t.body}</p>
            {t.href && (
              <a
                className="ss-toast-link"
                href={t.href}
                onClick={(e) => {
                  e.preventDefault();
                  dismiss(t.id);
                  router.push(t.href!);
                }}
              >
                Open →
              </a>
            )}
          </div>
          <button
            type="button"
            className="ss-toast-close"
            aria-label="Dismiss"
            onClick={() => dismiss(t.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
