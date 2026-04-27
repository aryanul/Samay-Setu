import Link from "next/link";
import { notFound } from "next/navigation";
import { pool } from "@/lib/db";
import { readMemberSession } from "@/lib/member-session";
import ChatRoom, { type ChatMessage } from "./ChatRoom";

export const dynamic = "force-dynamic";

type ThreadRow = {
  id: number;
  member_a_id: number;
  member_b_id: number;
  other_name: string;
  other_picture: string | null;
  other_headline: string | null;
};

type MessageRow = {
  id: number;
  from_member_id: number;
  body: string;
  created_at: Date;
};

export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const session = (await readMemberSession())!;
  const { threadId: rawId } = await params;
  const threadId = Number(rawId);
  if (!Number.isInteger(threadId) || threadId <= 0) notFound();

  const [threadRowsRaw] = await pool.query(
    `SELECT t.id, t.member_a_id, t.member_b_id,
            m.full_name AS other_name,
            m.profile_picture_url AS other_picture,
            m.professional_title  AS other_headline
       FROM chat_threads t
       JOIN verified_architect_onboarding m
         ON m.id = IF(t.member_a_id = ?, t.member_b_id, t.member_a_id)
      WHERE t.id = ?
      LIMIT 1`,
    [session.memberId, threadId]
  );
  const threadRows = threadRowsRaw as ThreadRow[];
  const thread = threadRows[0];
  if (!thread) notFound();
  if (thread.member_a_id !== session.memberId && thread.member_b_id !== session.memberId) {
    notFound();
  }

  const [msgRowsRaw] = await pool.query(
    `SELECT id, from_member_id, body, created_at
       FROM chat_messages
      WHERE thread_id = ?
      ORDER BY created_at ASC
      LIMIT 200`,
    [threadId]
  );
  const initialMessages: ChatMessage[] = (msgRowsRaw as MessageRow[]).map((m) => ({
    id: m.id,
    fromMemberId: m.from_member_id,
    body: m.body,
    createdAt: new Date(m.created_at).toISOString(),
  }));

  return (
    <>
      <div className="dash-header">
        <Link className="dash-link" href="/dashboard/chat" style={{ paddingLeft: 0 }}>
          ← All chats
        </Link>
      </div>

      <ChatRoom
        threadId={threadId}
        meId={session.memberId}
        other={{
          name: thread.other_name,
          picture: thread.other_picture ?? "",
          headline: thread.other_headline ?? "",
        }}
        initialMessages={initialMessages}
      />
    </>
  );
}
