import Link from "next/link";
import { relativeWhen, snippet, initials, type ThreadListItem } from "./chat-utils";

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export default function ThreadList({
  threads,
  activeId,
}: {
  threads: ThreadListItem[];
  activeId?: number;
}) {
  return (
    <aside className="threads">
      <div className="threads-head">
        <h2>
          Your <em>conversations</em>
        </h2>
        <span className="ct">{pad2(threads.length)} OPEN</span>
      </div>

      {threads.length === 0 ? (
        <div className="threads-empty">
          No chats yet. Start by offering a Bridge from the Live Bridge feed.
        </div>
      ) : (
        <div className="threads-scroll">
          {threads.map((t) => (
            <Link
              key={t.id}
              href={`/dashboard/chat/${t.id}`}
              className={`thread-item${t.id === activeId ? " active" : ""}`}
            >
              <div className="thread-av">
                {t.otherPicture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.otherPicture} alt="" />
                ) : (
                  initials(t.otherName)
                )}
              </div>
              <div className="thread-body">
                <div className="thread-line1">
                  <span className="thread-nm">{t.otherName}</span>
                  <span className="thread-time">{relativeWhen(t.lastAt ?? t.createdAt)}</span>
                </div>
                <div className="thread-preview">{snippet(t.lastBody)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </aside>
  );
}
