/**
 * Consumer create / edit / upload / submit pages.
 * Field names come from schema comments (+ skill table), not Demo literals.
 */

import Quill from "quill";
import "quill/dist/quill.snow.css";
import { t } from "./i18n/index.js";
import {
  inferItemTableForApp,
  inferNamedField,
} from "./layout-category.js";
import { visitorId } from "./layout-social.js";
import {
  getSkillHints,
  isNewsLikeApp,
  mediaSrc,
  type LayoutApp,
  type LayoutPage,
} from "./page-layout.js";
import type { WritePayload } from "./result-view.js";
import type { SchemaComments } from "./schema-types.js";
import { uploadFile } from "./upload.js";

type FlatRow = { key: string; cells: Record<string, unknown> };

export type ComposeHandlers = {
  onWrite?: (payload: WritePayload) => void | Promise<boolean | void>;
  onSelectPage?: (page: LayoutPage) => void;
};

export type ComposeOpts = {
  app: LayoutApp;
  rows: FlatRow[];
  columns: string[];
  primaryTable: string | null;
  comments?: SchemaComments | null;
  apijsonBase: string;
  handlers: ComposeHandlers;
};

export type ComposeDraft = {
  table: string;
  recordId?: string | number;
  localId?: string;
  cells: Record<string, unknown>;
};

export type LocalComposeDraft = {
  id: string;
  app: LayoutApp;
  table: string;
  rec: Record<string, unknown>;
  title: string;
  updatedAt: number;
  recordId?: string | number;
};

const DRAFT_STORE = "a2api.compose.drafts";

let pendingEdit: ComposeDraft | null = null;
let keepPendingEdit = false;

export function beginComposeEdit(draft: ComposeDraft) {
  pendingEdit = draft;
  keepPendingEdit = true;
}

export function composeEditDraft(): ComposeDraft | null {
  return pendingEdit;
}

export function clearComposeEdit() {
  pendingEdit = null;
  keepPendingEdit = false;
}

/** Call when opening the create page. Keeps an in-flight Edit draft. */
export function onEnterComposePage() {
  if (keepPendingEdit) {
    keepPendingEdit = false;
    return;
  }
  pendingEdit = null;
}

function readDraftStore(): LocalComposeDraft[] {
  try {
    const raw = localStorage.getItem(DRAFT_STORE);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as LocalComposeDraft[]) : [];
  } catch {
    return [];
  }
}

function writeDraftStore(rows: LocalComposeDraft[]) {
  localStorage.setItem(DRAFT_STORE, JSON.stringify(rows));
}

export function listLocalDrafts(app: LayoutApp): LocalComposeDraft[] {
  return readDraftStore()
    .filter((d) => d.app === app)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function saveLocalDraft(
  draft: Omit<LocalComposeDraft, "id" | "updatedAt"> & { id?: string },
): LocalComposeDraft {
  const rows = readDraftStore();
  const id = draft.id || `local-${Date.now()}`;
  const next: LocalComposeDraft = {
    id,
    app: draft.app,
    table: draft.table,
    rec: draft.rec,
    title: draft.title,
    updatedAt: Date.now(),
    ...(draft.recordId != null ? { recordId: draft.recordId } : {}),
  };
  const idx = rows.findIndex((d) => d.id === id);
  if (idx >= 0) rows[idx] = next;
  else rows.unshift(next);
  writeDraftStore(rows);
  return next;
}

export function removeLocalDraft(id: string) {
  writeDraftStore(readDraftStore().filter((d) => d.id !== id));
}

export function recToCells(
  table: string,
  rec: Record<string, unknown>,
): Record<string, unknown> {
  const cells: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rec)) {
    cells[`${table}.${k}`] = v;
  }
  return cells;
}

export function beginComposeFromLocal(draft: LocalComposeDraft) {
  beginComposeEdit({
    table: draft.table,
    recordId: draft.recordId,
    localId: draft.id,
    cells: recToCells(draft.table, draft.rec),
  });
}

const STATUS_TOKENS = ["status", "state", "stage", "状态"];

function statusField(
  table: string,
  comments: SchemaComments | null | undefined,
  extra?: string[],
): string | null {
  return inferNamedField(table, comments, STATUS_TOKENS, extra);
}

function statusComment(
  table: string,
  field: string,
  comments: SchemaComments | null | undefined,
): string {
  return comments?.columns?.[`${table}.${field}`] || "";
}

function draftStatusValue(comment: string): string {
  const n = comment.toLowerCase();
  if (/\bon\b/.test(n) && /\boff\b/.test(n)) return "off";
  return "draft";
}

function publishStatusValue(comment: string): string {
  const n = comment.toLowerCase();
  if (/published/.test(n)) return "published";
  if (/online/.test(n)) return "online";
  if (/\bon\b/.test(n) && /\boff\b/.test(n)) return "on";
  if (/active/.test(n)) return "active";
  return "published";
}

export function isDraftStatusValue(val: unknown): boolean {
  const n = String(val ?? "").trim().toLowerCase();
  if (!n) return false;
  if (n === "off" || n === "0") return true;
  return /draft|unpublished|offline|草稿/.test(n);
}

function applyStatus(
  rec: Record<string, unknown>,
  table: string,
  comments: SchemaComments | null | undefined,
  extra: string[] | undefined,
  asDraft: boolean,
) {
  const f = statusField(table, comments, extra);
  if (!f) return;
  const note = statusComment(table, f, comments);
  rec[f] = asDraft ? draftStatusValue(note) : publishStatusValue(note);
}

function draftTitleOf(rec: Record<string, unknown>): string {
  for (const v of Object.values(rec)) {
    if (typeof v !== "string") continue;
    const text = v.replace(/<[^>]+>/g, "").trim();
    if (text) return text.slice(0, 48);
  }
  return "";
}

type ComposeKind =
  | "richtext"
  | "moment"
  | "upload"
  | "listing"
  | "education"
  | "chat"
  | "product";

const TITLE_TOKENS = [
  "title",
  "name",
  "subject",
  "headline",
  "caption",
  "标题",
  "名称",
  "商品名",
  "歌名",
];
const BODY_TOKENS = [
  "content",
  "body",
  "text",
  "description",
  "summary",
  "intro",
  "html",
  "正文",
  "简介",
  "介绍",
];
const COVER_TOKENS = [
  "cover",
  "coverurl",
  "thumb",
  "thumbnail",
  "poster",
  "封面",
];
const PIC_LIST_TOKENS = [
  "picturelist",
  "pictures",
  "images",
  "photos",
  "pagelist",
  "pages",
  "图集",
  "分页",
];
const VIDEO_TOKENS = ["videourl", "video", "playurl", "mp4", "vod"];
const AUDIO_TOKENS = ["audiourl", "audio", "musicurl", "mp3", "songurl"];
const PRICE_TOKENS = ["price", "salary", "fee", "amount", "价格", "薪资"];
const STOCK_TOKENS = ["stock", "inventory", "qty", "库存"];
const AUTHOR_TOKENS = ["author", "artist", "writer", "singer", "讲师", "作者"];
const LESSON_TOKENS = ["lessons", "lessoncount", "课时"];
const NAME_TOKENS = ["name", "nickname", "nick", "姓名"];
const HEAD_TOKENS = ["head", "avatar", "portrait", "头像"];
const GRADE_TOKENS = ["grade", "title", "tag", "role", "职称", "年级"];
const TO_TOKENS = ["touserid", "toid", "receiverid", "targetid"];
const DURATION_TOKENS = ["duration", "length", "seconds", "时长"];

const QUILL_TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  [{ size: ["small", false, "large", "huge"] }],
  ["bold", "italic", "underline", "strike"],
  [{ color: [] }, { background: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ indent: "-1" }, { indent: "+1" }],
  [{ align: [] }],
  ["blockquote", "code-block", "link", "image"],
  ["clean"],
];

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

function flash(text: string) {
  document.getElementById("layout-toast")?.remove();
  const toast = el("div", "layout-toast", text);
  toast.id = "layout-toast";
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 1800);
}

function composeKind(app: LayoutApp): ComposeKind {
  if (app === "social") return "moment";
  if (app === "education") return "education";
  if (app === "chat") return "chat";
  if (app === "commerce") return "product";
  if (app === "video" || app === "music" || app === "comics" || app === "photo") {
    return "upload";
  }
  if (isNewsLikeApp(app) || app === "blog" || app === "article" || app === "books" || app === "office") {
    return "richtext";
  }
  return "listing";
}

function skillTable(app: LayoutApp): string | null {
  return getSkillHints().find((s) => s.name === app)?.tableName?.trim() || null;
}

function resolveTable(
  app: LayoutApp,
  comments: SchemaComments | null | undefined,
  primary: string | null,
  draftTable?: string,
): string | null {
  if (draftTable) return draftTable;
  return (
    inferItemTableForApp(app, comments) ||
    skillTable(app) ||
    primary
  );
}

function field(
  table: string,
  comments: SchemaComments | null | undefined,
  extra: string[] | undefined,
  tokens: string[],
  fallback: string | null = null,
): string | null {
  return inferNamedField(table, comments, tokens, extra) || fallback;
}

function cellValue(
  cells: Record<string, unknown> | undefined,
  table: string,
  name: string | null,
): unknown {
  if (!cells || !name) return undefined;
  return cells[`${table}.${name}`] ?? cells[name];
}

function asText(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "number" || typeof raw === "boolean") return String(raw);
  return "";
}

function asStringList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === "string" && !!x.trim());
  }
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return [];
    if (s.startsWith("[")) {
      try {
        return asStringList(JSON.parse(s) as unknown);
      } catch {
        return [];
      }
    }
    return s.split(/[\s,]+/).filter(Boolean);
  }
  return [];
}

function pickFiles(accept: string, multiple: boolean): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = multiple;
    input.onchange = () => resolve([...input.files ?? []]);
    input.click();
  });
}

async function uploadOne(
  base: string,
  file: File,
): Promise<string | null> {
  try {
    const up = await uploadFile(base, file);
    return up.url || null;
  } catch {
    flash(t("layout.compose.uploadFailed"));
    return null;
  }
}

async function mediaDuration(file: File): Promise<number | null> {
  const kind = file.type.startsWith("audio") ? "audio" : "video";
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const node = document.createElement(kind);
    node.preload = "metadata";
    node.onloadedmetadata = () => {
      const d = node.duration;
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(d) ? Math.round(d) : null);
    };
    node.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    node.src = url;
  });
}

type ToolbarMod = { addHandler: (name: string, fn: () => void) => void };

function setQuillHtml(quill: Quill, html: string) {
  quill.clipboard.dangerouslyPasteHTML(html || "", "silent");
}

function mountQuill(
  host: HTMLElement,
  opts: {
    placeholder: string;
    html?: string;
    apijsonBase: string;
  },
): Quill {
  const quill = new Quill(host, {
    theme: "snow",
    placeholder: opts.placeholder,
    modules: { toolbar: { container: QUILL_TOOLBAR } },
  });
  if (opts.html) setQuillHtml(quill, opts.html);
  const toolbar = quill.getModule("toolbar") as ToolbarMod | undefined;
  toolbar?.addHandler("image", () => {
    void (async () => {
      const [file] = await pickFiles("image/*", false);
      if (!file) return;
      const url = await uploadOne(opts.apijsonBase, file);
      if (!url) return;
      const range = quill.getSelection(true);
      const index = range?.index ?? quill.getLength();
      quill.insertEmbed(index, "image", url, "user");
      quill.setSelection(index + 1, 0, "user");
    })();
  });
  return quill;
}

function thumbPreview(
  url: string | null,
  base: string,
  className: string,
): HTMLElement {
  const box = el("div", className);
  if (url) {
    const img = document.createElement("img");
    img.src = mediaSrc(url, base);
    img.alt = "";
    img.loading = "lazy";
    box.appendChild(img);
  } else {
    box.classList.add("is-empty");
  }
  return box;
}

type EntityTab = { id: string; table: string; label: string; kind: ComposeKind | "person" };

function scoreTable(
  table: string,
  note: string,
  tokens: string[],
): number {
  const h = `${table} ${note}`.toLowerCase();
  let n = 0;
  for (const tok of tokens) {
    const t0 = tok.toLowerCase();
    if (!t0) continue;
    if (h === t0) n += 8;
    else if (h.includes(t0)) n += 4;
  }
  return n;
}

function tableForTokens(
  comments: SchemaComments | null | undefined,
  tokens: string[],
  fallback: string,
): string {
  if (comments?.tables) {
    let best: { table: string; score: number } | null = null;
    for (const [table, note] of Object.entries(comments.tables)) {
      const score = scoreTable(table, note, tokens);
      if (score <= 0) continue;
      if (!best || score > best.score) best = { table, score };
    }
    if (best) return best.table;
  }
  return fallback;
}

function educationEntities(
  comments: SchemaComments | null | undefined,
  primary: string | null,
): EntityTab[] {
  const course =
    inferItemTableForApp("education", comments) ||
    tableForTokens(comments, ["course", "lesson", "课程", "网课"], "Course") ||
    primary ||
    "Course";
  const teacher = tableForTokens(
    comments,
    ["teacher", "lecturer", "instructor", "老师", "讲师"],
    "Teacher",
  );
  const student = tableForTokens(
    comments,
    ["student", "pupil", "学员", "学生"],
    "Student",
  );
  return [
    { id: "course", table: course, label: t("layout.compose.entityCourse"), kind: "listing" },
    { id: "teacher", table: teacher, label: t("layout.compose.entityTeacher"), kind: "person" },
    { id: "student", table: student, label: t("layout.compose.entityStudent"), kind: "person" },
  ];
}

function labeledInput(
  label: string,
  input: HTMLElement,
): HTMLLabelElement {
  const wrap = el("label", "compose-field");
  wrap.append(el("span", "compose-lab", label), input);
  return wrap;
}

function textInput(
  placeholder: string,
  value = "",
  multiline = false,
): HTMLInputElement | HTMLTextAreaElement {
  if (multiline) {
    const ta = document.createElement("textarea");
    ta.className = "compose-input compose-textarea";
    ta.placeholder = placeholder;
    ta.rows = 5;
    ta.value = value;
    return ta;
  }
  const input = document.createElement("input");
  input.type = "text";
  input.className = "compose-input";
  input.placeholder = placeholder;
  input.value = value;
  return input;
}

function numberInput(placeholder: string, value = ""): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "number";
  input.className = "compose-input";
  input.placeholder = placeholder;
  input.value = value;
  return input;
}

function mountCoverPicker(opts: {
  url: string | null;
  base: string;
  label: string;
  onChange: (url: string | null) => void;
}): HTMLElement {
  const wrap = el("div", "compose-cover");
  wrap.appendChild(el("div", "compose-lab", opts.label));
  const preview = thumbPreview(opts.url, opts.base, "compose-cover-preview");
  const btn = el("button", "layout-btn", t("layout.compose.pickCover"));
  btn.type = "button";
  btn.onclick = () => {
    void (async () => {
      const [file] = await pickFiles("image/*", false);
      if (!file) return;
      btn.disabled = true;
      btn.textContent = t("layout.compose.uploading");
      const url = await uploadOne(opts.base, file);
      btn.disabled = false;
      btn.textContent = t("layout.compose.pickCover");
      if (!url) return;
      opts.onChange(url);
      preview.classList.remove("is-empty");
      preview.innerHTML = "";
      const img = document.createElement("img");
      img.src = mediaSrc(url, opts.base);
      img.alt = "";
      preview.appendChild(img);
    })();
  };
  wrap.append(preview, btn);
  return wrap;
}

function mountUrlList(opts: {
  urls: string[];
  base: string;
  addLabel: string;
  accept: string;
  onChange: (urls: string[]) => void;
}): HTMLElement {
  let urls = [...opts.urls];
  const wrap = el("div", "compose-gallery");
  const strip = el("div", "compose-gallery-strip");
  const paint = () => {
    strip.innerHTML = "";
    for (let i = 0; i < urls.length; i++) {
      const item = el("div", "compose-gallery-item");
      item.appendChild(thumbPreview(urls[i]!, opts.base, "compose-gallery-thumb"));
      const rm = el("button", "compose-gallery-rm", "×");
      rm.type = "button";
      rm.onclick = () => {
        urls = urls.filter((_, j) => j !== i);
        opts.onChange(urls);
        paint();
      };
      item.appendChild(rm);
      strip.appendChild(item);
    }
  };
  const add = el("button", "layout-btn", opts.addLabel);
  add.type = "button";
  add.onclick = () => {
    void (async () => {
      const files = await pickFiles(opts.accept, true);
      if (!files.length) return;
      add.disabled = true;
      add.textContent = t("layout.compose.uploading");
      for (const file of files) {
        const url = await uploadOne(opts.base, file);
        if (url) urls.push(url);
      }
      add.disabled = false;
      add.textContent = opts.addLabel;
      opts.onChange(urls);
      paint();
    })();
  };
  paint();
  wrap.append(strip, add);
  return wrap;
}

type SubmitOpts = {
  asDraft?: boolean;
  localId?: string;
  app: LayoutApp;
  comments?: SchemaComments | null;
  extra?: string[];
};

async function submitWrite(
  handlers: ComposeHandlers,
  table: string,
  rec: Record<string, unknown>,
  recordId: string | number | null,
  writeOpts: SubmitOpts,
): Promise<boolean> {
  const me = visitorId();
  if (me == null) {
    flash(t("layout.needLogin"));
    return false;
  }
  const bodyRec = { ...rec };
  for (const [k, v] of Object.entries(bodyRec)) {
    if (v == null || v === "") delete bodyRec[k];
  }
  applyStatus(
    bodyRec,
    table,
    writeOpts.comments,
    writeOpts.extra,
    !!writeOpts.asDraft,
  );
  const hasStatus = !!statusField(table, writeOpts.comments, writeOpts.extra);
  const localOnly = !!writeOpts.asDraft && !hasStatus && recordId == null;
  const saved = saveLocalDraft({
    id: writeOpts.localId,
    app: writeOpts.app,
    table,
    rec: bodyRec,
    title: draftTitleOf(bodyRec) || t("layout.page.drafts"),
    recordId: recordId ?? undefined,
  });
  if (localOnly) {
    flash(t("layout.compose.draftSaved"));
    handlers.onSelectPage?.("drafts");
    return true;
  }
  if (!handlers.onWrite) {
    flash(t("layout.actionUnbound"));
    return false;
  }
  const method = recordId != null ? "put" : "post";
  if (recordId != null) bodyRec.id = recordId;
  const ok = await handlers.onWrite({
    method,
    table,
    body: { [table]: bodyRec, tag: table },
    keepTag: true,
    skipTemplate: true,
    stayOnPage: true,
  });
  if (ok === false) return false;
  if (writeOpts.asDraft) {
    flash(t("layout.compose.draftSaved"));
    handlers.onSelectPage?.("drafts");
    return true;
  }
  removeLocalDraft(saved.id);
  flash(recordId != null ? t("layout.compose.saved") : t("layout.compose.published"));
  if (recordId == null) clearComposeEdit();
  handlers.onSelectPage?.("published");
  return true;
}

export function renderComposePage(opts: ComposeOpts): HTMLElement {
  const app = opts.app;
  const kind = composeKind(app);
  const draft = composeEditDraft();
  const columns = opts.columns;
  const comments = opts.comments;
  const page = el(
    "div",
    "compose-page" +
      (kind === "richtext" ||
      kind === "listing" ||
      kind === "product" ||
      kind === "education"
        ? " compose-page-write"
        : ""),
  );
  page.setAttribute("data-base", opts.apijsonBase);

  const defaultTable = resolveTable(app, comments, opts.primaryTable, draft?.table);
  const entities = kind === "education" ? educationEntities(comments, opts.primaryTable) : null;
  let table = defaultTable;
  let entityKind: ComposeKind | "person" = kind;

  if (entities) {
    const match = draft?.table
      ? entities.find((e) => e.table === draft.table)
      : entities[0];
    table = match?.table ?? entities[0]!.table;
    entityKind = match?.kind ?? "listing";
  }

  const title = el(
    "h2",
    "compose-title",
    draft
      ? t("layout.compose.titleEdit")
      : t("layout.compose.title"),
  );
  page.appendChild(title);

  const formHost = el("div", "compose-form");
  page.appendChild(formHost);

  const paint = () => {
    formHost.innerHTML = "";
    if (!table) {
      formHost.appendChild(el("div", "result-empty", t("layout.compose.noTable")));
      return;
    }
    const extra = columns;
    const rec: Record<string, unknown> = {};
    const cells = draft?.table === table ? draft.cells : undefined;
    const recordId = draft?.table === table ? (draft.recordId ?? null) : null;
    const localId = draft?.table === table ? draft.localId : undefined;
    const writeOpts = (asDraft: boolean): SubmitOpts => ({
      asDraft,
      localId,
      app,
      comments,
      extra,
    });

    if (entityKind === "person") {
      const nameF = field(table, comments, extra, NAME_TOKENS, "name");
      const headF = field(table, comments, extra, HEAD_TOKENS, "head");
      const gradeF = field(table, comments, extra, GRADE_TOKENS);
      const introF = field(table, comments, extra, BODY_TOKENS, "intro");
      const nameIn = textInput(t("layout.compose.placeholderName"), asText(cellValue(cells, table, nameF)));
      let headUrl = asText(cellValue(cells, table, headF)) || null;
      formHost.appendChild(labeledInput(t("layout.compose.placeholderName"), nameIn));
      if (headF) {
        formHost.appendChild(
          mountCoverPicker({
            url: headUrl,
            base: opts.apijsonBase,
            label: t("layout.compose.pickAvatar"),
            onChange: (url) => {
              headUrl = url;
            },
          }),
        );
      }
      const gradeIn = gradeF
        ? textInput(t("layout.compose.fieldRole"), asText(cellValue(cells, table, gradeF)))
        : null;
      if (gradeIn && gradeF) {
        formHost.appendChild(labeledInput(t("layout.compose.fieldRole"), gradeIn));
      }
      const introIn = introF
        ? textInput(t("layout.compose.placeholderBody"), asText(cellValue(cells, table, introF)), true)
        : null;
      if (introIn) formHost.appendChild(labeledInput(t("layout.compose.placeholderBody"), introIn));
      const runPerson = (asDraft: boolean) => async () => {
        const payload: Record<string, unknown> = {};
        const name = nameIn.value.trim();
        if (!asDraft && !name) {
          flash(t("layout.compose.needTitle"));
          return false;
        }
        if (nameF && name) payload[nameF] = name;
        if (headF && headUrl) payload[headF] = headUrl;
        if (gradeF && gradeIn) payload[gradeF] = gradeIn.value.trim();
        if (introF && introIn) payload[introF] = introIn.value.trim();
        return submitWrite(opts.handlers, table!, payload, recordId, writeOpts(asDraft));
      };
      formHost.appendChild(composeActions(recordId, runPerson(false), runPerson(true)));
      return;
    }

    if (kind === "chat" || entityKind === "chat") {
      const bodyF = field(table, comments, extra, BODY_TOKENS, "content");
      const toF = field(table, comments, extra, TO_TOKENS, "toUserId");
      const bodyIn = textInput(
        t("layout.compose.placeholderCaption"),
        asText(cellValue(cells, table, bodyF)),
        true,
      );
      const toIn = textInput(t("layout.compose.fieldTo"), asText(cellValue(cells, table, toF)));
      formHost.appendChild(labeledInput(t("layout.compose.fieldTo"), toIn));
      formHost.appendChild(labeledInput(t("layout.compose.placeholderCaption"), bodyIn));
      const runChat = (asDraft: boolean) => async () => {
        const payload: Record<string, unknown> = {};
        const text = bodyIn.value.trim();
        if (!asDraft && !text) {
          flash(t("layout.compose.needBody"));
          return false;
        }
        if (bodyF && text) payload[bodyF] = text;
        if (toF && toIn.value.trim()) {
          const raw = toIn.value.trim();
          payload[toF] = /^-?\d+$/.test(raw) ? Number(raw) : raw;
        }
        return submitWrite(opts.handlers, table!, payload, recordId, writeOpts(asDraft));
      };
      formHost.appendChild(composeActions(recordId, runChat(false), runChat(true)));
      return;
    }

    if (kind === "moment") {
      const bodyF = field(table, comments, extra, BODY_TOKENS, "content");
      const picsF = field(table, comments, extra, PIC_LIST_TOKENS, "pictureList");
      const bodyIn = textInput(
        t("layout.compose.placeholderCaption"),
        asText(cellValue(cells, table, bodyF)),
        true,
      );
      let pics = asStringList(cellValue(cells, table, picsF));
      formHost.appendChild(bodyIn);
      if (picsF) {
        formHost.appendChild(
          mountUrlList({
            urls: pics,
            base: opts.apijsonBase,
            addLabel: t("layout.compose.pickImages"),
            accept: "image/*",
            onChange: (next) => {
              pics = next;
            },
          }),
        );
      }
      const runMoment = (asDraft: boolean) => async () => {
        const payload: Record<string, unknown> = {};
        const text = bodyIn.value.trim();
        if (!asDraft && !text && !pics.length) {
          flash(t("layout.compose.needBody"));
          return false;
        }
        if (bodyF && text) payload[bodyF] = text;
        if (picsF && pics.length) payload[picsF] = pics;
        return submitWrite(opts.handlers, table!, payload, recordId, writeOpts(asDraft));
      };
      formHost.appendChild(composeActions(recordId, runMoment(false), runMoment(true)));
      return;
    }

    const titleF = field(table, comments, extra, TITLE_TOKENS, "title");
    const bodyF = field(table, comments, extra, BODY_TOKENS, "content");
    const coverF = field(table, comments, extra, COVER_TOKENS, "cover");
    const picsF =
      field(table, comments, extra, PIC_LIST_TOKENS) ||
      (app === "comics" || app === "photo" || kind === "product"
        ? "pictureList"
        : null);
    const videoF = field(table, comments, extra, VIDEO_TOKENS);
    const audioF = field(table, comments, extra, AUDIO_TOKENS);
    const priceF = field(table, comments, extra, PRICE_TOKENS);
    const stockF = field(table, comments, extra, STOCK_TOKENS);
    const authorF = field(table, comments, extra, AUTHOR_TOKENS);
    const lessonF = field(table, comments, extra, LESSON_TOKENS);
    const durationF = field(table, comments, extra, DURATION_TOKENS);

    const titleIn = textInput(
      t("layout.compose.placeholderTitle"),
      asText(cellValue(cells, table, titleF)),
    );
    titleIn.classList.add("compose-title-input");
    titleIn.setAttribute("aria-label", t("layout.compose.placeholderTitle"));
    formHost.appendChild(titleIn);

    let coverUrl = asText(cellValue(cells, table, coverF)) || null;
    if (coverF) {
      formHost.appendChild(
        mountCoverPicker({
          url: coverUrl,
          base: opts.apijsonBase,
          label: t("layout.compose.pickCover"),
          onChange: (url) => {
            coverUrl = url;
          },
        }),
      );
    }

    if (kind === "product" || kind === "listing" || entityKind === "listing") {
      if (authorF && kind !== "product") {
        const authorIn = textInput(
          t("layout.compose.fieldAuthor"),
          asText(cellValue(cells, table, authorF)),
        );
        formHost.appendChild(labeledInput(t("layout.compose.fieldAuthor"), authorIn));
        rec.__authorInput = authorIn;
      }
      if (priceF) {
        const priceIn = numberInput(
          t("layout.compose.fieldPrice"),
          asText(cellValue(cells, table, priceF)),
        );
        formHost.appendChild(labeledInput(t("layout.compose.fieldPrice"), priceIn));
        rec.__priceInput = priceIn;
      }
      if (stockF) {
        const stockIn = numberInput(
          t("layout.compose.fieldStock"),
          asText(cellValue(cells, table, stockF)),
        );
        formHost.appendChild(labeledInput(t("layout.compose.fieldStock"), stockIn));
        rec.__stockInput = stockIn;
      }
      if (lessonF) {
        const lessonIn = numberInput(
          t("layout.compose.fieldLessons"),
          asText(cellValue(cells, table, lessonF)),
        );
        formHost.appendChild(labeledInput(t("layout.compose.fieldLessons"), lessonIn));
        rec.__lessonInput = lessonIn;
      }
    }

    let pics = asStringList(cellValue(cells, table, picsF));
    const wantPages = kind === "upload" && (app === "comics" || app === "photo");
    if (picsF && (wantPages || kind === "product")) {
      formHost.appendChild(
        mountUrlList({
          urls: pics,
          base: opts.apijsonBase,
          addLabel:
            app === "comics"
              ? t("layout.compose.pickPages")
              : t("layout.compose.pickImages"),
          accept: "image/*",
          onChange: (next) => {
            pics = next;
          },
        }),
      );
    }

    let mediaUrl = asText(cellValue(cells, table, app === "music" ? audioF : videoF)) || null;
    let duration: number | null = Number(asText(cellValue(cells, table, durationF))) || null;
    if (kind === "upload" && (app === "video" || app === "music")) {
      const accept = app === "music" ? "audio/*" : "video/*";
      const label =
        app === "music" ? t("layout.compose.pickAudio") : t("layout.compose.pickVideo");
      const slot = el("div", "compose-file");
      slot.appendChild(el("div", "compose-lab", label));
      const name = el("div", "layout-meta", mediaUrl || t("layout.compose.needFile"));
      const btn = el("button", "layout-btn", label);
      btn.type = "button";
      btn.onclick = () => {
        void (async () => {
          const [file] = await pickFiles(accept, false);
          if (!file) return;
          btn.disabled = true;
          btn.textContent = t("layout.compose.uploading");
          const url = await uploadOne(opts.apijsonBase, file);
          btn.disabled = false;
          btn.textContent = label;
          if (!url) return;
          mediaUrl = url;
          name.textContent = file.name;
          duration = (await mediaDuration(file)) ?? duration;
        })();
      };
      slot.append(name, btn);
      formHost.appendChild(slot);
    }

    let quill: Quill | null = null;
    const useRich =
      kind === "richtext" ||
      kind === "listing" ||
      kind === "education" ||
      kind === "product" ||
      entityKind === "listing";
    const richBodyF = bodyF || (useRich ? "content" : null);
    if (useRich && richBodyF) {
      const shell = el("div", "compose-editor");
      shell.appendChild(el("div", "compose-lab", t("layout.compose.placeholderRich")));
      const editor = el("div", "compose-quill");
      shell.appendChild(editor);
      formHost.appendChild(shell);
      quill = mountQuill(editor, {
        placeholder: t("layout.compose.placeholderRich"),
        html: asText(cellValue(cells, table, richBodyF)),
        apijsonBase: opts.apijsonBase,
      });
    } else if (bodyF) {
      const bodyIn = textInput(
        t("layout.compose.placeholderBody"),
        asText(cellValue(cells, table, bodyF)),
        true,
      );
      formHost.appendChild(bodyIn);
      rec.__bodyInput = bodyIn;
    }

    const runListing = (asDraft: boolean) => async () => {
      const payload: Record<string, unknown> = {};
      const titleVal = titleIn.value.trim();
      if (titleF && !titleVal && !asDraft) {
        flash(t("layout.compose.needTitle"));
        return false;
      }
      if (titleF && titleVal) payload[titleF] = titleVal;
      if (coverF && coverUrl) payload[coverF] = coverUrl;
      if (picsF && pics.length) payload[picsF] = pics;
      const mediaField = app === "music" ? audioF : videoF;
      if (mediaField && mediaUrl) payload[mediaField] = mediaUrl;
      if (durationF && duration != null) payload[durationF] = duration;
      const authorIn = rec.__authorInput as HTMLInputElement | undefined;
      const priceIn = rec.__priceInput as HTMLInputElement | undefined;
      const stockIn = rec.__stockInput as HTMLInputElement | undefined;
      const lessonIn = rec.__lessonInput as HTMLInputElement | undefined;
      const bodyIn = rec.__bodyInput as HTMLTextAreaElement | undefined;
      if (authorF && authorIn) payload[authorF] = authorIn.value.trim();
      if (priceF && priceIn?.value) payload[priceF] = Number(priceIn.value);
      if (stockF && stockIn?.value) payload[stockF] = Number(stockIn.value);
      if (lessonF && lessonIn?.value) payload[lessonF] = Number(lessonIn.value);
      if (useRich && quill && richBodyF) {
        const text = quill.getText().trim();
        const html = quill.getSemanticHTML();
        if (!asDraft && !text && !/<img/i.test(html)) {
          flash(t("layout.compose.needBody"));
          return false;
        }
        if (text || /<img/i.test(html)) payload[richBodyF] = html;
      } else if (bodyF && bodyIn) {
        const text = bodyIn.value.trim();
        if (text) payload[bodyF] = text;
      }
      if (
        !asDraft &&
        kind === "upload" &&
        (app === "video" || app === "music") &&
        !mediaUrl &&
        recordId == null
      ) {
        flash(t("layout.compose.needFile"));
        return false;
      }
      return submitWrite(opts.handlers, table!, payload, recordId, writeOpts(asDraft));
    };
    formHost.appendChild(composeActions(recordId, runListing(false), runListing(true)));
  };

  if (entities) {
    const tabs = el("div", "compose-entities");
    for (const ent of entities) {
      const btn = el(
        "button",
        "compose-entity" + (ent.table === table ? " is-active" : ""),
        ent.label,
      );
      btn.type = "button";
      btn.onclick = () => {
        table = ent.table;
        entityKind = ent.kind;
        for (const b of tabs.querySelectorAll(".compose-entity")) {
          b.classList.toggle("is-active", b === btn);
        }
        paint();
      };
      tabs.appendChild(btn);
    }
    title.after(tabs);
  }

  paint();
  return page;
}

function bindBusy(btn: HTMLButtonElement, fn: () => Promise<boolean>) {
  btn.onclick = () => {
    void (async () => {
      btn.disabled = true;
      try {
        await fn();
      } finally {
        btn.disabled = false;
      }
    })();
  };
}

function publishBtn(
  recordId: string | number | null,
  onSave: () => Promise<boolean>,
): HTMLButtonElement {
  const btn = el(
    "button",
    "layout-btn layout-btn-primary compose-publish",
    recordId != null ? t("layout.compose.save") : t("layout.compose.publish"),
  );
  btn.type = "button";
  bindBusy(btn, onSave);
  return btn;
}

function composeActions(
  recordId: string | number | null,
  onPublish: () => Promise<boolean>,
  onDraft: () => Promise<boolean>,
): HTMLElement {
  const row = el("div", "compose-actions");
  const draft = el("button", "layout-btn compose-draft", t("layout.compose.saveDraft"));
  draft.type = "button";
  bindBusy(draft, onDraft);
  row.append(draft, publishBtn(recordId, onPublish));
  return row;
}
