/**
 * Canonical pillar taxonomy for the Live Bridge feed.
 *
 * `slug` is the URL/DB value (stable, lowercase, kebab-case).
 * `label` is what users see on filter pills and card headers.
 * `short` is the abbreviated label used inside the pill row when space is tight.
 *
 * Add new pillars by appending an entry — old `trades.pillar` values that
 * don't match a known slug fall back to "general".
 */

export type PillarSlug =
  | "growth-seo"
  | "finance-tax"
  | "hr-leadership"
  | "prem-lifestyle"
  | "tech-product"
  | "creative-content"
  | "general";

export type Pillar = {
  slug: PillarSlug;
  label: string;
  short: string;
};

export const PILLARS: Pillar[] = [
  { slug: "growth-seo",       label: "Growth & SEO",       short: "Growth & SEO" },
  { slug: "finance-tax",      label: "Finance & Tax",      short: "Finance & Tax" },
  { slug: "hr-leadership",    label: "HR & Leadership",    short: "HR & Leadership" },
  { slug: "prem-lifestyle",   label: "Prem Lifestyle",     short: "Prem Lifestyle" },
  { slug: "tech-product",     label: "Tech & Product",     short: "Tech & Product" },
  { slug: "creative-content", label: "Creative & Content", short: "Creative & Content" },
  { slug: "general",          label: "General",            short: "General" },
];

const SLUGS: Set<string> = new Set(PILLARS.map((p) => p.slug));
const BY_SLUG: Map<string, Pillar> = new Map(PILLARS.map((p) => [p.slug, p]));

export const DEFAULT_PILLAR: PillarSlug = "general";

export function isPillarSlug(value: unknown): value is PillarSlug {
  return typeof value === "string" && SLUGS.has(value);
}

export function normalizePillar(value: unknown): PillarSlug {
  if (typeof value === "string" && SLUGS.has(value)) return value as PillarSlug;
  return DEFAULT_PILLAR;
}

export function pillarLabel(slug: string | null | undefined): string {
  if (!slug) return BY_SLUG.get(DEFAULT_PILLAR)!.label;
  return BY_SLUG.get(slug)?.label ?? BY_SLUG.get(DEFAULT_PILLAR)!.label;
}

export function formatTradeRef(tradeId: number): string {
  return `#${String(tradeId).padStart(3, "0")}`;
}
