/**
 * Scene skills from APIJSON `Skill`: list, search, use, upload.
 */
import { t } from "./i18n/index.js";
import {
  getSkillHints,
  layoutAppFromSkill,
  setSkillHints,
  type LayoutApp,
  type SkillHint,
} from "./page-layout.js";
import {
  loadSkillMarkdown,
  mergeSkillCatalog,
} from "./skill-fallbacks.js";

export type SkillCatalog = {
  ok: boolean;
  created?: boolean;
  error?: string;
  skills: SkillHint[];
  hints: SkillHint[];
};

const SAMPLE = `---
name: pets
title: 宠物社区
titleEn: Pets
tableName: Local
family: local
tokens: [pet, 宠物, 宠物社区]
description: 宠物内容与社区目录。
---
# 宠物社区
- 未知 name 用 family 皮肤（local → 本地生活）
- 主表需已有 Access；上传技能不会建表
`;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function asHints(data: Partial<SkillCatalog> | null | undefined): SkillHint[] {
  const rows = data?.hints?.length ? data.hints : data?.skills || [];
  return rows.filter((s) => s && s.name);
}

function unwrapHint(row: unknown): SkillHint | null {
  if (!row || typeof row !== "object") return null;
  const rec = row as Record<string, unknown>;
  const raw = (rec.Skill || rec.skill || rec) as Record<string, unknown>;
  const name = String(raw.name || "").trim();
  if (!name) return null;
  const tokens = Array.isArray(raw.tokens)
    ? raw.tokens.map((x) => String(x).trim()).filter(Boolean)
    : [];
  return {
    name,
    title: raw.title != null ? String(raw.title) : name,
    titleEn: raw.titleEn != null ? String(raw.titleEn) : "",
    tableName: raw.tableName != null ? String(raw.tableName) : "",
    family: raw.family != null ? String(raw.family) : "local",
    tokens,
    description: raw.description != null ? String(raw.description) : "",
    url: raw.url != null ? String(raw.url) : `/skills/${name}.md`,
  };
}

async function fetchSkillsViaApijson(): Promise<SkillHint[]> {
  const res = await fetch("/apijson/get", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      "[]": {
        count: 100,
        page: 0,
        Skill: { status: "online", "@order": "id+" },
        query: 2,
      },
    }),
  });
  const data = (await res.json()) as { "[]"?: unknown };
  const arr = Array.isArray(data["[]"]) ? data["[]"] : [];
  return arr.map(unwrapHint).filter((x): x is SkillHint => Boolean(x));
}

export async function loadSkillCatalog(force = false): Promise<SkillCatalog> {
  if (!force && getSkillHints().length) {
    const hints = getSkillHints();
    return { ok: true, skills: hints, hints };
  }
  try {
    const res = await fetch("/api/skills");
    if (res.ok) {
      const data = (await res.json()) as SkillCatalog & { error?: string };
      const hints = mergeSkillCatalog(asHints(data));
      if (hints.length) {
        setSkillHints(hints);
        return {
          ok: true,
          created: data.created,
          error: data.error,
          skills: hints,
          hints,
        };
      }
    }
  } catch {
    /* fall through to APIJSON */
  }
  const hints = mergeSkillCatalog(await fetchSkillsViaApijson());
  setSkillHints(hints);
  return { ok: hints.length > 0, skills: hints, hints };
}

export async function matchSkillCatalog(prompt: string): Promise<SkillHint[]> {
  try {
    const res = await fetch("/api/skills/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { skills?: SkillHint[] };
    return Array.isArray(data.skills) ? data.skills : [];
  } catch {
    return [];
  }
}

export async function uploadSkillText(
  markdown: string,
): Promise<{ ok: boolean; skill?: SkillHint; error?: string }> {
  const res = await fetch("/api/skills/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ markdown }),
  });
  const data = (await res.json()) as {
    ok?: boolean;
    skill?: SkillHint;
    error?: string;
  };
  if (data.ok) await loadSkillCatalog(true);
  return { ok: Boolean(data.ok), skill: data.skill, error: data.error };
}

export function mountSkillLibrary(opts: {
  app: LayoutApp;
  onUse: (app: LayoutApp, skill: SkillHint) => void;
}): HTMLElement {
  const root = el("div", "me-skills");
  root.appendChild(el("div", "layout-meta", t("layout.me.skillsHint")));

  const search = document.createElement("input");
  search.type = "search";
  search.className = "me-skill-search";
  search.placeholder = t("layout.me.skillsSearch");
  root.appendChild(search);

  const list = el("div", "me-skill-list");
  root.appendChild(list);

  const render = (rows: SkillHint[]) => {
    list.replaceChildren();
    if (!rows.length) {
      list.appendChild(el("div", "result-empty", t("layout.me.skillsEmpty")));
      return;
    }
    for (const skill of rows) {
      const app = layoutAppFromSkill(skill);
      const card = el("button", "me-skill-card");
      card.type = "button";
      if (app === opts.app) card.classList.add("is-on");
      const title = el("div", "layout-title", skill.title || skill.name);
      const meta = [
        skill.name,
        skill.tableName ? `${t("layout.me.skillsTable")} ${skill.tableName}` : "",
        skill.family ? `${t("layout.me.skillsFamily")} ${skill.family}` : "",
        skill.url ? `${t("layout.me.skillsFile")} ${skill.url}` : "",
      ]
        .filter(Boolean)
        .join(" · ");
      card.append(title, el("div", "me-skill-meta", meta));
      if (skill.description) {
        card.appendChild(el("div", "me-skill-desc", skill.description));
      }
      const note = el("div", "me-skill-desc");
      card.appendChild(note);
      card.onclick = () => {
        void loadSkillMarkdown(skill).then((got) => {
          if (got.source === "fallback") {
            note.textContent = t("layout.me.skillsFallback");
          }
          opts.onUse(app, skill);
        });
      };
      list.appendChild(card);
    }
  };

  let all = getSkillHints();
  render(all);

  const applyFilter = (q: string) => {
    const needle = q.trim().toLowerCase();
    if (!needle) {
      render(all);
      return;
    }
    render(
      all.filter((s) =>
        [s.name, s.title, s.titleEn, s.tableName, s.family, ...(s.tokens ?? [])]
          .filter(Boolean)
          .some((x) => String(x).toLowerCase().includes(needle)),
      ),
    );
  };

  search.oninput = () => applyFilter(search.value);

  void loadSkillCatalog(true)
    .then((cat) => {
      if (!root.isConnected) return;
      all = cat.hints;
      applyFilter(search.value);
    })
    .catch(() => {
      if (!root.isConnected || all.length) return;
      list.replaceChildren(el("div", "result-empty", t("layout.me.skillsEmpty")));
    });

  search.onkeydown = (ev) => {
    if (ev.key !== "Enter") return;
    const q = search.value.trim();
    if (!q) return;
    void matchSkillCatalog(q).then((rows) => {
      if (!root.isConnected) return;
      if (rows.length) render(rows);
      else applyFilter(q);
    });
  };

  const upload = el("div", "me-skill-upload");
  upload.appendChild(el("div", "me-lab", t("layout.me.skillsUpload")));
  upload.appendChild(el("div", "layout-meta", t("layout.me.skillsTableHint")));

  const box = document.createElement("textarea");
  box.className = "me-help";
  box.rows = 8;
  box.placeholder = SAMPLE;
  upload.appendChild(box);

  const actions = el("div", "me-skill-actions");
  const file = document.createElement("input");
  file.type = "file";
  file.accept = ".md,.markdown,.json,.txt";
  file.className = "me-skill-file";
  const pick = el("button", "layout-btn", t("layout.me.skillsUploadFile"));
  pick.type = "button";
  pick.onclick = () => file.click();
  file.onchange = () => {
    const picked = file.files?.[0];
    if (!picked) return;
    void picked.text().then((text) => {
      box.value = text;
    });
  };

  const send = el("button", "layout-btn layout-btn-primary", t("layout.me.skillsUpload"));
  send.type = "button";
  const status = el("div", "layout-meta");
  send.onclick = () => {
    const markdown = box.value.trim();
    if (!markdown) return;
    send.disabled = true;
    status.textContent = t("layout.me.skillsUploading");
    void uploadSkillText(markdown)
      .then((res) => {
        if (res.ok) {
          status.textContent = t("layout.me.skillsUploaded");
          box.value = "";
          all = getSkillHints();
          applyFilter(search.value);
        } else {
          status.textContent = t("layout.me.skillsUploadFail", {
            msg: res.error || "",
          });
        }
      })
      .catch((e) => {
        status.textContent = t("layout.me.skillsUploadFail", {
          msg: e instanceof Error ? e.message : String(e),
        });
      })
      .finally(() => {
        send.disabled = false;
      });
  };

  actions.append(pick, send, file);
  upload.append(actions, status);
  root.appendChild(upload);
  return root;
}
