"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Live Bridge", exact: true },
  { href: "/dashboard/bridges", label: "Bridges", badge: true },
  { href: "/dashboard/chat", label: "Chats" },
  { href: "/dashboard/me", label: "Me" },
  { href: "/dashboard/contest", label: "Founding Race", live: true },
];

export default function DashboardNav({ pendingBridges }: { pendingBridges: number }) {
  const pathname = usePathname();

  return (
    <nav className="cb-nav" aria-label="Dashboard sections">
      {TABS.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            className={`cb-tab${active ? " active" : ""}${t.live ? " live" : ""}`}
            href={t.href}
            aria-current={active ? "page" : undefined}
          >
            {t.label}
            {t.badge && pendingBridges > 0 && <span className="badge">{pendingBridges}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
