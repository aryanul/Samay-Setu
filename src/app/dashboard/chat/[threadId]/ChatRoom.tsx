"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

export type ChatMessage = {
  id: number;
  fromMemberId: number;
  body: string;
  createdAt: string;
};

const POLL_MS = 6000;
const MAX_BODY = 2000;

function formatStamp(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function initials(name: string): string {
  const c = name.trim()[0];
  return c ? c.toUpperCase() : "·";
}

export default function ChatRoom({
  threadId,
  meId,
  me,
  other,
  initialMessages,
}: {
  threadId: number;
  meId: number;
  me: { name: string; picture: string };
  other: { name: string; picture: string; headline: string };
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const sinceIdRef = useRef<number>(
    initialMessages.length > 0 ? initialMessages[initialMessages.length - 1].id : 0
  );

  const scrollToBottom = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | null = null;

    async function poll() {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const res = await fetch(
          `/api/chat/threads/${threadId}/messages?sinceId=${sinceIdRef.current}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = (await res.json()) as { ok: boolean; messages: ChatMessage[] };
        if (cancelled || !data.ok || data.messages.length === 0) return;
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const merged = [...prev];
          for (const m of data.messages) {
            if (!seen.has(m.id)) merged.push(m);
          }
          return merged;
        });
        const last = data.messages[data.messages.length - 1];
        sinceIdRef.current = last.id;
        requestAnimationFrame(scrollToBottom);
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
  }, [threadId, scrollToBottom]);

  async function send() {
    const text = draft.trim();
    if (!text) return;
    if (text.length > MAX_BODY) {
      setError(`Keep messages under ${MAX_BODY} characters.`);
      return;
    }
    setError("");
    setSending(true);
    try {
      const res = await fetch(`/api/chat/threads/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const result = await res.json();
      if (!res.ok || !result.ok) {
        setError(result?.message || "Could not send.");
        return;
      }
      setDraft("");
      // Optimistic refetch
      const after = await fetch(
        `/api/chat/threads/${threadId}/messages?sinceId=${sinceIdRef.current}`,
        { cache: "no-store" }
      );
      if (after.ok) {
        const data = (await after.json()) as { ok: boolean; messages: ChatMessage[] };
        if (data.ok && data.messages.length > 0) {
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m.id));
            const merged = [...prev];
            for (const m of data.messages) {
              if (!seen.has(m.id)) merged.push(m);
            }
            return merged;
          });
          sinceIdRef.current = data.messages[data.messages.length - 1].id;
          requestAnimationFrame(scrollToBottom);
        }
      }
    } catch {
      setError("Network issue. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <section className="thread-view">
      <div className="tv-head">
        <Link className="tv-back" href="/dashboard/chat" aria-label="Back to all chats">
          ← All
        </Link>
        <div className="tv-av">
          {other.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={other.picture} alt="" />
          ) : (
            initials(other.name)
          )}
        </div>
        <div>
          <div className="tv-name">{other.name}</div>
          {other.headline && <div className="tv-status">{other.headline}</div>}
        </div>
      </div>

      {other.headline && (
        <div className="tv-context">
          <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M8 24 C8 14, 18 10, 18 18 C18 26, 28 22, 28 12" strokeLinecap="round" />
          </svg>
          Active bridge with <strong>{other.headline}</strong>
        </div>
      )}

      <div className="messages" ref={bodyRef}>
        {messages.length === 0 ? (
          <p className="messages-empty">
            The Bridge is open. Say hello — names only, no contact details until you both agree.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.fromMemberId === meId;
            return (
              <div key={m.id} className={`msg${mine ? " me" : ""}`}>
                <div className="msg-av">
                  {mine ? (
                    me.picture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={me.picture} alt="" />
                    ) : (
                      initials(me.name)
                    )
                  ) : other.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={other.picture} alt="" />
                  ) : (
                    initials(other.name)
                  )}
                </div>
                <div className="msg-body">
                  <div className="msg-bubble">{m.body}</div>
                  <div className="msg-time">{formatStamp(m.createdAt)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          placeholder="Write a message…"
          rows={1}
          maxLength={MAX_BODY + 50}
        />
        <button type="submit" disabled={sending || draft.trim().length === 0}>
          {sending ? "…" : "Send"}
        </button>
        {error && <p className="composer-error">{error}</p>}
      </form>
    </section>
  );
}
