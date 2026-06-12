import { notFound } from "next/navigation";
import { pool } from "@/lib/db";
import { readMemberSession } from "@/lib/member-session";
import ThreadList from "../ThreadList";
import type { ThreadListItem } from "../chat-utils";
import ChatRoom, { type ChatMessage } from "./ChatRoom";
import "../chat.css";

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

type ListRow = {
  id: number;
  created_at: Date;
  other_name: string;
  other_picture: string | null;
  last_body: string | null;
  last_at: Date | null;
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

  // Mirror the list query so the left pane renders with this thread active.
  const [listRowsRaw] = await pool.query(
    `SELECT t.id, t.created_at,
            m.full_name AS other_name,
            m.profile_picture_url AS other_picture,
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
  const threads: ThreadListItem[] = (listRowsRaw as ListRow[]).map((t) => ({
    id: t.id,
    otherName: t.other_name,
    otherPicture: t.other_picture,
    lastBody: t.last_body,
    lastAt: t.last_at,
    createdAt: t.created_at,
  }));

  return (
    <div className="ss-chats ss-chats-room">
      <ThreadList threads={threads} activeId={threadId} />

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
    </div>
  );
}
