/**
 * Hardcoded scene-skill catalog + short bodies.
 * Used when the file URL fails or the downloaded markdown is too short.
 */
import raw from "./skill-fallbacks.json";
import type { SkillHint } from "./page-layout.js";

export type SkillFallback = SkillHint & { body: string };

export const MIN_SKILL_BODY = 40;
export const MIN_SKILL_CATALOG = 8;

export const SKILL_FALLBACKS = raw as SkillFallback[];

export function fallbackSkill(name: string | null | undefined): SkillFallback | undefined {
  const n = String(name || "").trim().toLowerCase();
  if (!n) return undefined;
  return SKILL_FALLBACKS.find((s) => s.name === n);
}

export function stripSkillFrontmatter(markdown: string): string {
  const text = String(markdown || "").replace(/^\uFEFF/, "");
  const m = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/);
  return (m ? m[1] : text).trim();
}

export function skillBodyEnough(markdown: string | null | undefined): boolean {
  return stripSkillFrontmatter(markdown || "").length >= MIN_SKILL_BODY;
}

export function fallbackHints(): SkillHint[] {
  return SKILL_FALLBACKS.map((s) => ({
    name: s.name,
    title: s.title,
    titleEn: s.titleEn,
    tableName: s.tableName,
    family: s.family,
    tokens: s.tokens,
    description: s.description,
    url: s.url || `/skills/${s.name}.md`,
  }));
}

/** Prefer live rows; if the catalog is thin, fill from the hardcoded list. */
export function mergeSkillCatalog(rows: SkillHint[]): SkillHint[] {
  const live = rows.filter((s) => s?.name);
  if (live.length >= MIN_SKILL_CATALOG) {
    return live.map((s) => ({
      ...s,
      url: s.url || `/skills/${s.name}.md`,
    }));
  }
  const byName = new Map(live.map((s) => [s.name, s]));
  return fallbackHints().map((fb) => {
    const hit = byName.get(fb.name);
    return hit ? { ...fb, ...hit, url: hit.url || fb.url } : fb;
  });
}

export async function loadSkillMarkdown(
  skill: Pick<SkillHint, "name" | "url">,
): Promise<{ body: string; source: "url" | "fallback" }> {
  const url = (skill.url || `/skills/${skill.name}.md`).trim();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const text = await res.text();
      if (skillBodyEnough(text)) {
        return { body: stripSkillFrontmatter(text), source: "url" };
      }
    }
  } catch {
    /* use fallback */
  }
  const fb = fallbackSkill(skill.name);
  return { body: fb?.body || "", source: "fallback" };
}
