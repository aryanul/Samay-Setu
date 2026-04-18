import Link from "next/link";
import { pool } from "@/lib/db";
import { readAdminSession } from "@/lib/session";
import LoginForm from "./LoginForm";
import LogoutButton from "./LogoutButton";
import "./page.css";

type ApplicationRow = {
  id: number;
  created_at: Date;
  locality: string;
  offer: string;
  need: string;
  name: string;
  whatsapp: string;
  source: string;
  ip: string | null;
  user_agent: string | null;
};

type EmailRow = {
  id: number;
  created_at: Date;
  email: string;
  source: string;
  ip: string | null;
  user_agent: string | null;
};

type AdminView = "dashboard" | "applications" | "emails";

function formatDateTime(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await readAdminSession();

  if (!session) {
    return (
      <div className="ss-admin">
        <div className="wrap">
          <header className="topbar">
            <Link className="brand" href="/" aria-label="Samay Setu">
              <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M8 24 C8 14, 18 10, 18 18 C18 26, 28 22, 28 12" stroke="#C9A96E" strokeWidth="2" strokeLinecap="round" />
                <circle cx="8" cy="24" r="2.5" fill="#C9A96E" />
                <circle cx="28" cy="12" r="2.5" fill="#1a1a18" />
              </svg>
              <span className="logo-text">
                samay <span>setu</span>
              </span>
            </Link>
            <div className="pilot-chip">Admin Console</div>
          </header>

          <div className="card">
            <LoginForm />
          </div>
        </div>
      </div>
    );
  }

  const sp = await searchParams;
  const requestedView = (sp.view ?? "dashboard").trim();
  const view: AdminView =
    requestedView === "applications" || requestedView === "emails" || requestedView === "dashboard"
      ? (requestedView as AdminView)
      : "dashboard";

  const [appsResult] = await pool.query(
    "SELECT id, created_at, locality, offer, need, name, whatsapp, source, ip, user_agent FROM applications ORDER BY created_at DESC"
  );
  const [emailsResult] = await pool.query(
    "SELECT id, created_at, email, source, ip, user_agent FROM waitlist_emails ORDER BY created_at DESC"
  );

  const applications = appsResult as ApplicationRow[];
  const waitlistEmails = emailsResult as EmailRow[];

  const today = new Date();
  const applicationsToday = applications.filter((a) => sameLocalDay(new Date(a.created_at), today)).length;
  const emailsToday = waitlistEmails.filter((e) => sameLocalDay(new Date(e.created_at), today)).length;

  const localityCounts = new Map<string, number>();
  for (const app of applications) {
    const loc = (app.locality || "").trim() || "Unknown";
    localityCounts.set(loc, (localityCounts.get(loc) ?? 0) + 1);
  }
  let topLocality = "No data yet";
  if (localityCounts.size > 0) {
    topLocality = [...localityCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  type ActivityEntry = {
    type: "Application" | "Email";
    label: string;
    meta: string;
    createdAt: Date;
  };
  const recentActivity: ActivityEntry[] = [
    ...applications.map<ActivityEntry>((a) => ({
      type: "Application",
      label: a.name || "Unknown applicant",
      meta: (a.locality || "").trim() || "Unknown",
      createdAt: new Date(a.created_at),
    })),
    ...waitlistEmails.map<ActivityEntry>((e) => ({
      type: "Email",
      label: e.email || "Unknown email",
      meta: e.source || "homepage-early-access",
      createdAt: new Date(e.created_at),
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8);

  const recentApplications = applications.slice(0, 5);
  const recentEmails = waitlistEmails.slice(0, 5);

  return (
    <div className="ss-admin">
      <div className="wrap">
        <header className="topbar">
          <Link className="brand" href="/" aria-label="Samay Setu">
            <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M8 24 C8 14, 18 10, 18 18 C18 26, 28 22, 28 12" stroke="#C9A96E" strokeWidth="2" strokeLinecap="round" />
              <circle cx="8" cy="24" r="2.5" fill="#C9A96E" />
              <circle cx="28" cy="12" r="2.5" fill="#1a1a18" />
            </svg>
            <span className="logo-text">
              samay <span>setu</span>
            </span>
          </Link>
          <div className="pilot-chip">Admin Console</div>
        </header>

        <div className="card">
          <div className="top-row">
            <div className="left">
              <h1>Admin Dashboard</h1>
              <div className="meta-row">
                <span className="count-chip">{applications.length} applications</span>
                <span className="count-chip">{waitlistEmails.length} emails</span>
              </div>
            </div>
            <LogoutButton />
          </div>

          <nav className="admin-nav" aria-label="Admin sections">
            <Link href="/admin?view=dashboard" className={`nav-link${view === "dashboard" ? " active" : ""}`}>
              Dashboard
            </Link>
            <Link href="/admin?view=applications" className={`nav-link${view === "applications" ? " active" : ""}`}>
              Join Circle
              <span className="badge">{applications.length}</span>
            </Link>
            <Link href="/admin?view=emails" className={`nav-link${view === "emails" ? " active" : ""}`}>
              Email Waitlist
              <span className="badge">{waitlistEmails.length}</span>
            </Link>
          </nav>

          {view === "dashboard" && (
            <>
              <section className="stats-grid">
                <article className="stat-card">
                  <p className="stat-title">Total Applications</p>
                  <p className="stat-value">{applications.length}</p>
                  <p className="stat-sub">Founding membership requests</p>
                </article>
                <article className="stat-card">
                  <p className="stat-title">Total Waitlist Emails</p>
                  <p className="stat-value">{waitlistEmails.length}</p>
                  <p className="stat-sub">Homepage early-access signups</p>
                </article>
                <article className="stat-card">
                  <p className="stat-title">Today&apos;s Entries</p>
                  <p className="stat-value">{applicationsToday + emailsToday}</p>
                  <p className="stat-sub">{applicationsToday} applications • {emailsToday} emails</p>
                </article>
                <article className="stat-card">
                  <p className="stat-title">Top Locality</p>
                  <p className="stat-value" style={{ fontSize: "1.35rem" }}>{topLocality}</p>
                  <p className="stat-sub">Most application activity</p>
                </article>
              </section>

              <section className="panels-grid">
                <article className="panel">
                  <h3>Recent Activity</h3>
                  {recentActivity.length === 0 ? (
                    <div className="empty">No activity found yet. New entries will appear here.</div>
                  ) : (
                    <ul className="activity-list">
                      {recentActivity.map((activity, i) => (
                        <li className="activity-item" key={i}>
                          <div className="activity-top">
                            <span className={`tag${activity.type === "Email" ? " email" : ""}`}>{activity.type}</span>
                            <span className="activity-meta">{formatDateTime(activity.createdAt)}</span>
                          </div>
                          <p className="activity-label">{activity.label}</p>
                          <p className="activity-meta">{activity.meta}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>

                <article className="panel">
                  <h3>Quick Snapshot</h3>
                  <p className="section-note">Use the navbar tabs to inspect complete records.</p>
                  <div className="split-note">
                    <span>Apps table: <code>applications</code></span>
                    <span>Emails table: <code>waitlist_emails</code></span>
                  </div>

                  <h3 style={{ marginTop: 16 }}>Latest Entries</h3>
                  <ul className="activity-list">
                    {recentApplications[0] && (
                      <li className="activity-item">
                        <div className="activity-top">
                          <span className="tag">Application</span>
                        </div>
                        <p className="activity-label">{recentApplications[0].name || "Unknown applicant"}</p>
                        <p className="activity-meta">{formatDateTime(recentApplications[0].created_at)}</p>
                      </li>
                    )}
                    {recentEmails[0] && (
                      <li className="activity-item">
                        <div className="activity-top">
                          <span className="tag email">Email</span>
                        </div>
                        <p className="activity-label">{recentEmails[0].email || "Unknown email"}</p>
                        <p className="activity-meta">{formatDateTime(recentEmails[0].created_at)}</p>
                      </li>
                    )}
                    {!recentApplications[0] && !recentEmails[0] && (
                      <li className="activity-item">
                        <p className="activity-label">No recent records yet.</p>
                      </li>
                    )}
                  </ul>
                </article>
              </section>
            </>
          )}

          {view === "applications" && (
            <section className="section-block">
              <h2 className="section-title">Join Circle Applications</h2>
              <p className="section-note">Data source: table <code>applications</code></p>
              {applications.length === 0 ? (
                <div className="empty">No application data found yet.</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Created At</th>
                        <th>Name</th>
                        <th>WhatsApp</th>
                        <th>Locality</th>
                        <th>Offer</th>
                        <th>Need</th>
                        <th>Source</th>
                        <th>IP</th>
                        <th>User Agent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((row) => (
                        <tr key={row.id}>
                          <td>{formatDateTime(row.created_at)}</td>
                          <td>{row.name}</td>
                          <td>{row.whatsapp}</td>
                          <td>{row.locality}</td>
                          <td>{row.offer}</td>
                          <td>{row.need}</td>
                          <td>{row.source}</td>
                          <td>{row.ip ?? ""}</td>
                          <td>{row.user_agent ?? ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {view === "emails" && (
            <section className="section-block">
              <h2 className="section-title">Homepage Early Access Emails</h2>
              <p className="section-note">Data source: table <code>waitlist_emails</code></p>
              {waitlistEmails.length === 0 ? (
                <div className="empty">No email signups yet.</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Created At</th>
                        <th>Email</th>
                        <th>Source</th>
                        <th>IP</th>
                        <th>User Agent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {waitlistEmails.map((row) => (
                        <tr key={row.id}>
                          <td>{formatDateTime(row.created_at)}</td>
                          <td>{row.email}</td>
                          <td>{row.source}</td>
                          <td>{row.ip ?? ""}</td>
                          <td>{row.user_agent ?? ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
