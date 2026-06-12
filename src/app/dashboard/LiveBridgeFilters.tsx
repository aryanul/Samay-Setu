"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PILLARS, type PillarSlug } from "@/lib/pillars";

const SEARCH_DEBOUNCE_MS = 280;

type Props = {
  activePillar: PillarSlug | null;
  initialQuery: string;
};

export default function LiveBridgeFilters({ activePillar, initialQuery }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialQuery);
  const lastPushedQuery = useRef(initialQuery);

  // Push debounced search updates into the URL (so the server re-queries).
  useEffect(() => {
    if (query === lastPushedQuery.current) return;
    const handle = setTimeout(() => {
      lastPushedQuery.current = query;
      const next = new URLSearchParams(searchParams.toString());
      if (query.trim()) next.set("q", query.trim());
      else next.delete("q");
      const qs = next.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query, pathname, router, searchParams]);

  function selectPillar(slug: PillarSlug | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (slug) next.set("pillar", slug);
    else next.delete("pillar");
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  return (
    <div className={`cb-filters${pending ? " is-pending" : ""}`}>
      <div className="cb-pills" role="tablist" aria-label="Filter by pillar">
        <button
          type="button"
          role="tab"
          aria-selected={activePillar === null}
          className={`cb-pill${activePillar === null ? " active" : ""}`}
          onClick={() => selectPillar(null)}
        >
          All pillars
        </button>
        {PILLARS.filter((p) => p.slug !== "general").map((p) => (
          <button
            key={p.slug}
            type="button"
            role="tab"
            aria-selected={activePillar === p.slug}
            className={`cb-pill${activePillar === p.slug ? " active" : ""}`}
            onClick={() => selectPillar(p.slug)}
          >
            {p.short}
          </button>
        ))}
      </div>

      <div className="cb-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3-3" />
        </svg>
        <input
          type="search"
          placeholder="Search a skill or neighbourhood"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search the Live Bridge"
        />
      </div>
    </div>
  );
}
