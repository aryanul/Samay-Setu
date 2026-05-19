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
    <div className={`lb-toolbar${pending ? " is-pending" : ""}`}>
      <label className="lb-search">
        <span className="lb-search-icon" aria-hidden="true">⌕</span>
        <input
          type="search"
          placeholder="Search skills, locations, or keywords…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search the Live Bridge"
        />
      </label>

      <div className="lb-pills" role="tablist" aria-label="Filter by pillar">
        <button
          type="button"
          role="tab"
          aria-selected={activePillar === null}
          className={`lb-pill${activePillar === null ? " is-active" : ""}`}
          onClick={() => selectPillar(null)}
        >
          All Trades
        </button>
        {PILLARS.filter((p) => p.slug !== "general").map((p) => (
          <button
            key={p.slug}
            type="button"
            role="tab"
            aria-selected={activePillar === p.slug}
            className={`lb-pill${activePillar === p.slug ? " is-active" : ""}`}
            onClick={() => selectPillar(p.slug)}
          >
            {p.short}
          </button>
        ))}
      </div>
    </div>
  );
}
