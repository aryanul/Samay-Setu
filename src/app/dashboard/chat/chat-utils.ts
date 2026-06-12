/* Shared helpers for the Chats pages (thread list + room). */

export type ThreadListItem = {
  id: number;
  otherName: string;
  otherPicture: string | null;
  lastBody: string | null;
  lastAt: Date | null;
  createdAt: Date;
};

/** Relative time like the mockup ("2m", "1h", "Yesterday", "3 days"). */
export function relativeWhen(value: Date | string | null): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "Yesterday";
  if (day < 7) return `${day} days`;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function snippet(body: string | null): string {
  if (!body) return "No messages yet — say hello.";
  const trimmed = body.trim().replace(/\s+/g, " ");
  return trimmed.length > 90 ? trimmed.slice(0, 90) + "…" : trimmed;
}

export function initials(name: string): string {
  const c = name.trim()[0];
  return c ? c.toUpperCase() : "·";
}
