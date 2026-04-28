"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function ChatRoom({
  threadId,
  meId,
  other,
  initialMessages,
}: {
  threadId: number;
  meId: number;
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
    async function poll() {
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
    const id = window.setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
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
    <div className="chat-window">
      <div className="chat-head">
        {other.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="avatar" src={other.picture} alt="" width={48} height={48} />
        ) : (
          <div className="avatar tc-avatar" aria-hidden="true" />
        )}
        <div>
          <div className="who">{other.name}</div>
          {other.headline && <div className="meta">{other.headline}</div>}
        </div>
        <div />
      </div>

      <div className="chat-body" ref={bodyRef}>
        {messages.length === 0 && (
          <p className="meta" style={{ textAlign: "center", marginTop: 24 }}>
            The Bridge is open. Say hello — names only, no contact details until you both agree.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.fromMemberId === meId;
          return (
            <div key={m.id} style={{ display: "flex", flexDirection: "column", maxWidth: "100%" }}>
              <div className={`chat-bubble ${mine ? "mine" : "theirs"}`}>{m.body}</div>
              <span className={`chat-meta ${mine ? "" : "theirs"}`}>{formatStamp(m.createdAt)}</span>
            </div>
          );
        })}
      </div>

      <form
        className="chat-form"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          placeholder="Write a message — Enter to send, Shift+Enter for a new line"
          maxLength={MAX_BODY + 50}
        />
        <button type="submit" disabled={sending || draft.trim().length === 0}>
          {sending ? "…" : "Send"}
        </button>
        {error && (
          <p className="form-error" style={{ gridColumn: "1 / -1", margin: 0 }}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
