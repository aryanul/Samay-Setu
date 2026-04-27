import Link from "next/link";
import { pool } from "@/lib/db";
import { readMemberSession } from "@/lib/member-session";

export const dynamic = "force-dynamic";

type Row = {
  id: number;
  member_a_id: number;
  member_b_id: number;
  last_message_at: Date | null;
  created_at: Date;
  other_id: number;
  other_name: string;
  other_picture: string | null;
  other_headline: string | null;
  last_body: string | null;
  last_at: Date | null;
};

function formatWhen(value: Date | string | null): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function snippet(body: string | null): string {
  if (!body) return "No messages yet — say hello.";
  const trimmed = body.trim().replace(/\s+/g, " ");
  return trimmed.length > 90 ? trimmed.slice(0, 90) + "…" : trimmed;
}

export default async function ChatListPage() {
  const session = (await readMemberSession())!;

  const [rowsRaw] = await pool.query(
    `SELECT t.id, t.member_a_id, t.member_b_id, t.last_message_at, t.created_at,
            m.id   AS other_id,
            m.full_name AS other_name,
            m.profile_picture_url AS other_picture,
            m.professional_title  AS other_headline,
            (SELECT body       FROM chat_messages WHERE thread_id = t.id ORDER BY created_at DESC LIMIT 1) AS last_body,
            (SELECT created_at FROM chat_messages WHERE thread_id = t.id ORDER BY created_at DESC LIMIT 1) AS last_at
       FROM chat_threads t
       JOIN verified_architect_onboarding m
         ON m.id = IF(t.member_a_id = ?, t.member_b_id, t.member_a_id)
      WHERE t.member_a_id = ? OR t.member_b_id = ?
      ORDER BY COALESCE(t.last_message_at, t.created_at) DESC
      LIMIT 100`,
    [session.memberId, session.memberId, session.memberId]
  );
  const threads = rowsRaw as Row[];

  return (
    <>
      <div className="dash-header">
        <p className="dash-eyebrow">Chats</p>
        <h1 className="dash-title">Open conversations.</h1>
        <p className="dash-subtitle">
          One thread per accepted Bridge. Names and avatars only — no emails or numbers.
        </p>
      </div>

      {threads.length === 0 ? (
        <div className="empty-card">
          No chats yet. Start by offering a Bridge from the Live Bridge feed.
        </div>
      ) : (
        <div className="threads-list">
          {threads.map((t) => (
            <Link key={t.id} className="thread-item" href={`/dashboard/chat/${t.id}`}>
              {t.other_picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="avatar" src={t.other_picture} alt="" width={48} height={48} />
              ) : (
                <div className="avatar tc-avatar" aria-hidden="true" />
              )}
              <div>
                <div className="who">{t.other_name}</div>
                <div className="last">{snippet(t.last_body)}</div>
              </div>
              <div className="when">{formatWhen(t.last_at ?? t.created_at)}</div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
