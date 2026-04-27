import Link from "next/link";
import { redirect } from "next/navigation";
import { readMemberSession } from "@/lib/member-session";
import { pool } from "@/lib/db";
import LogoutButton from "./LogoutButton";
import "./page.css";

type CountsRow = { pending_bridges: number; total_unread: number };

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await readMemberSession();
  if (!session) {
    redirect("/login");
  }

  const [rowsRaw] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM bridges WHERE to_member_id = ? AND status = 'pending') AS pending_bridges,
       0 AS total_unread`,
    [session.memberId]
  );
  const rows = rowsRaw as CountsRow[];
  const pendingBridges = rows[0]?.pending_bridges ?? 0;

  return (
    <div className="ss-dashboard">
      <div className="ambient-bg" aria-hidden="true">
        <div className="ambient-grid" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <header className="dash-topbar">
        <Link className="brand" href="/" aria-label="Samay Setu">
          <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M8 24 C8 14, 18 10, 18 18 C18 26, 28 22, 28 12" stroke="#C9A96E" strokeWidth="2" strokeLinecap="round" />
            <circle cx="8" cy="24" r="2.5" fill="#C9A96E" />
            <circle cx="28" cy="12" r="2.5" fill="#1a1a18" />
          </svg>
          <span className="logo-text">
            samay <span>setu</span>
          </span>
        </Link>

        <nav className="dash-nav" aria-label="Dashboard sections">
          <Link className="dash-link" href="/dashboard">Live Bridge</Link>
          <Link className="dash-link" href="/dashboard/bridges">
            Bridges
            {pendingBridges > 0 && <span className="dash-badge">{pendingBridges}</span>}
          </Link>
          <Link className="dash-link" href="/dashboard/chat">Chats</Link>
          <Link className="dash-link" href="/dashboard/me">Me</Link>
        </nav>

        <div className="dash-right">
          <span className="dash-hello">{session.name.split(" ")[0]}</span>
          <LogoutButton />
        </div>
      </header>

      <main className="dash-main">{children}</main>
    </div>
  );
}
