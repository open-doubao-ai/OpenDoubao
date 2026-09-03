/**
 * APIJSON outermost `tag` (Request.method + tag + version).
 * Default is the table name. Mint a new tag only when that slot is taken
 * and the existing Request.structure does not fit this body.
 */

export function slugRequestTag(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s\-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 64);
}

/** `Moment:mine` / `Moment[]` / `Moment[]:child` → `Moment`. */
export function tableNameFromRequestTag(tag: string): string {
  const t = tag.trim();
  if (!t) return "";
  const noArr = t.replace(/\[\]/g, "");
  const i = noArr.indexOf(":");
  return (i >= 0 ? noArr.slice(0, i) : noArr).trim();
}

/**
 * True when tag is the table itself or an APIJSON table-qualified variant
 * (`Moment[]`, `Moment:mine`, `Comment[]:child`) — not a page slug.
 */
export function isNamedRequestTag(tag: string, table: string): boolean {
  const t = tag.trim();
  const tbl = table.trim();
  if (!t || !tbl) return false;
  if (t === tbl) return true;
  if (t === `${tbl}[]`) return true;
  if (t.startsWith(`${tbl}:`)) return true;
  if (t.startsWith(`${tbl}[]:`)) return true;
  return false;
}

function tableToSnake(table: string): string {
  return table
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();
}

/**
 * Preference order when the table-name Request is occupied and unfit.
 * `Table:alias` first (`Moment:detail`, `Comment:circle`), then a slug (`moment_list`).
 */
export function variantRequestTagCandidates(
  table: string,
  hint: { title?: string; pageId?: string } = {},
): string[] {
  const tbl = table.trim();
  const out: string[] = [];
  const add = (s: string) => {
    const t = s.trim();
    if (t && t !== tbl && !out.includes(t)) out.push(t);
  };
  const pageId = (hint.pageId || "").trim();
  const title = (hint.title || "").trim();
  const kindMatch =
    pageId.match(/_(list|detail|create)$/i) ||
    title.match(/\b(List|Detail|Create)\b/i);
  const kind = kindMatch?.[1]?.toLowerCase();
  if (kind) add(`${tbl}:${kind}`);

  const slug = slugRequestTag(title) || slugRequestTag(pageId);
  if (slug) {
    const snake = tableToSnake(tbl);
    let alias = slug;
    for (const p of [`${snake}_`, `${tbl.toLowerCase()}_`]) {
      if (alias.startsWith(p)) {
        alias = alias.slice(p.length);
        break;
      }
    }
    if (alias.endsWith(`_${snake}`)) {
      alias = alias.slice(0, -(snake.length + 1));
    } else if (alias.endsWith(`_${tbl.toLowerCase()}`)) {
      alias = alias.slice(0, -(tbl.length + 1));
    }
    if (alias && alias !== snake && alias !== tbl.toLowerCase()) {
      add(`${tbl}:${alias}`);
    }
    add(slug);
  }
  return out;
}

export type ResolveRequestTagOpts = {
  table: string;
  currentTag?: string | null;
  /** Request row exists for method + table-name tag. */
  tableTagOccupied: boolean;
  /** That row's structure does not fit this body (MUST/REFUSE/UPDATE/extra tables). */
  tableTagUnfit: boolean;
  /** Error is "no Request row" — create the default table tag, do not mint. */
  missingRequest?: boolean;
  variants?: string[];
  variantOccupied?: (tag: string) => boolean;
};

/**
 * Pick outermost `tag`: table name, or a variant when the default Request is
 * taken and does not meet this call.
 */
export function resolveRequestTag(opts: ResolveRequestTagOpts): string {
  const table = opts.table.trim();
  const current = (opts.currentTag || "").trim();
  if (!table) return current;

  if (isNamedRequestTag(current, table) && current !== table) {
    return current;
  }

  const mint =
    !opts.missingRequest && opts.tableTagOccupied && opts.tableTagUnfit;
  if (!mint) return table;

  const variants = (opts.variants || []).filter((v) => v && v !== table);
  const occupied = opts.variantOccupied ?? (() => false);
  for (const v of variants) {
    if (!occupied(v)) return v;
  }
  if (current && current !== table) return current;
  return variants[0] || `${table}:custom`;
}

/** GET/HEAD without a real Request tag stay open (no outermost tag). */
export function shouldOmitOpenGetTag(
  method: string,
  tag: string,
  table: string,
): boolean {
  const m = method.toLowerCase();
  if (m !== "get" && m !== "head") return false;
  const t = tag.trim();
  if (!t) return false;
  return !isNamedRequestTag(t, table);
}
