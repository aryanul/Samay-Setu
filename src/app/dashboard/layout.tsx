import Link from "next/link";
import { redirect } from "next/navigation";
import { readMemberSession } from "@/lib/member-session";
import { pool } from "@/lib/db";
import LogoutButton from "./LogoutButton";
import DashboardNav from "./DashboardNav";
import NotificationsClient from "./NotificationsClient";
import "./chrome.css";

type CountsRow = { pending_bridges: number; picture: string | null };

export const dynamic = "force-dynamic";

function initial(name: string): string {
  const c = name.trim()[0];
  return c ? c.toUpperCase() : "·";
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await readMemberSession();
  if (!session) {
    redirect("/login");
  }

  const [rowsRaw] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM bridges WHERE to_member_id = ? AND status = 'pending') AS pending_bridges,
       (SELECT profile_picture_url FROM verified_architect_onboarding WHERE id = ?) AS picture`,
    [session.memberId, session.memberId]
  );
  const rows = rowsRaw as CountsRow[];
  const pendingBridges = rows[0]?.pending_bridges ?? 0;
  const picture = rows[0]?.picture ?? null;

  return (
    <div className="cb-app">
      <div className="cb-top-wrap">
        <header className="cb-top">
          <Link className="cb-brand" href="/" aria-label="Samay Setu">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M8 24 C8 14, 18 10, 18 18 C18 26, 28 22, 28 12" stroke="#a07f3f" strokeWidth="2" strokeLinecap="round" />
              <circle cx="8" cy="24" r="2.5" fill="#a07f3f" />
              <circle cx="28" cy="12" r="2.5" fill="#14120e" />
            </svg>
            <span className="word">samay <em>setu</em></span>
          </Link>

          <DashboardNav pendingBridges={pendingBridges} />

          <div className="cb-me">
            <div className="cb-pip" title={session.name}>
              {picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={picture} alt="" />
              ) : (
                initial(session.name)
              )}
            </div>
            <LogoutButton />
          </div>
        </header>
      </div>

      <main className="cb-main">{children}</main>

      <NotificationsClient />
    </div>
  );
}
