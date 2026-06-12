import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { readMemberSession } from "@/lib/member-session";
import ThreadList from "./ThreadList";
import type { ThreadListItem } from "./chat-utils";
import "./chat.css";

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

export default async function ChatListPage() {
  const session = await readMemberSession();
  if (!session) redirect("/login");

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
  const rows = rowsRaw as Row[];
  const threads: ThreadListItem[] = rows.map((t) => ({
    id: t.id,
    otherName: t.other_name,
    otherPicture: t.other_picture,
    lastBody: t.last_body,
    lastAt: t.last_at,
    createdAt: t.created_at,
  }));

  return (
    <div className="ss-chats">
      <ThreadList threads={threads} />

      <section className="thread-view">
        <div className="tv-empty">
          <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M8 24 C8 14, 18 10, 18 18 C18 26, 28 22, 28 12" strokeLinecap="round" />
          </svg>
          <h3>
            Select a <em>conversation</em>
          </h3>
          <p>
            One thread per accepted Bridge. Names and avatars only — no emails or numbers until you
            both agree.
          </p>
        </div>
      </section>
    </div>
  );
}
