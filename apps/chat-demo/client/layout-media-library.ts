/**
 * Music / video local scan, import (upload + bound write), and export.
 * Table / column names come from comments + bound columns — not Demo literals.
 */

import { t } from "./i18n/index.js";
import {
  inferAuthorIdField,
  inferItemTableForApp,
  inferNamedField,
  isCategoryTable,
} from "./layout-category.js";
import { visitorId } from "./layout-social.js";
import {
  mediaSrc,
  pickRowPresentation,
  type LayoutApp,
} from "./page-layout.js";
import type { WritePayload } from "./result-view.js";
import type { SchemaComments } from "./schema-types.js";
import { uploadFile } from "./upload.js";

type FlatRow = { key: string; cells: Record<string, unknown> };

export type MediaKind = "music" | "video";

export type MediaLibraryCtx = {
  app: MediaKind;
  rows: FlatRow[];
  columns: string[];
  primaryTable: string | null;
  comments?: SchemaComments | null;
  apijsonBase: string;
  recordId: (row: FlatRow) => string | number | null;
  onWrite?: (payload: WritePayload) => void | Promise<boolean | void>;
  onOpenScan?: () => void;
};

export type MediaPlaylistItem = {
  title: string;
  url: string;
  cover?: string;
  duration?: number;
  author?: string;
  album?: string;
  id?: string | number;
};

type MediaFields = {
  table: string;
  title: string;
  url: string;
  duration: string | null;
  cover: string | null;
  artist: string | null;
  album: string | null;
  userId: string | null;
};

const AUDIO_EXT = /\.(mp3|m4a|wav|flac|aac|ogg|opus)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|mkv|ogv)$/i;
const AUDIO_MIME = /^audio\//i;
const VIDEO_MIME = /^video\//i;

const TITLE_TOKENS = [
  "title",
  "name",
  "song",
  "songname",
  "videotitle",
  "标题",
  "歌名",
  "歌曲名",
  "视频标题",
  "片名",
];
const VIDEO_URL_TOKENS = [
  "videourl",
  "playurl",
  "videopath",
  "src",
  "mp4",
  "vod",
  "视频地址",
  "播放地址",
];
const AUDIO_URL_TOKENS = [
  "audiourl",
  "musicurl",
  "audiopath",
  "src",
  "mp3",
  "songurl",
  "音频地址",
  "歌曲地址",
  "音乐地址",
];
const DURATION_TOKENS = ["duration", "length", "seconds", "时长"];
const COVER_TOKENS = ["cover", "poster", "thumb", "thumbnail", "封面"];
const ARTIST_TOKENS = ["artist", "singer", "author", "歌手", "艺人", "作者"];
const ALBUM_TOKENS = ["album", "专辑"];

export function isMediaLibraryApp(app: LayoutApp | null | undefined): app is MediaKind {
  return app === "music" || app === "video";
}

function mediaKind(app: MediaKind): "audio" | "video" {
  return app === "music" ? "audio" : "video";
}

function flash(text: string) {
  document.getElementById("layout-toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "layout-toast";
  toast.id = "layout-toast";
  toast.textContent = text;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 1800);
}

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

function btn(label: string, className = "layout-btn"): HTMLButtonElement {
  const node = el("button", className, label);
  node.type = "button";
  return node;
}

function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function isMediaFile(file: File, kind: "audio" | "video"): boolean {
  if (kind === "audio") {
    return AUDIO_MIME.test(file.type) || AUDIO_EXT.test(file.name);
  }
  return VIDEO_MIME.test(file.type) || VIDEO_EXT.test(file.name);
}

function parseMediaName(file: File): { title: string; artist: string } {
  const base = file.name.replace(/\.[^.]+$/, "").trim() || file.name;
  const m = base.match(/^(.+?)\s+[-–—]\s+(.+)$/);
  if (m?.[1] && m[2]) return { artist: m[1].trim(), title: m[2].trim() };
  return { title: base, artist: "" };
}

function safeFileName(title: string, fallback: string): string {
  const s = (title || fallback).replace(/[\\/:*?"<>|]+/g, "_").trim();
  return s.slice(0, 80) || fallback;
}

function extFromUrl(url: string, mime?: string): string {
  try {
    const path = new URL(url, window.location.origin).pathname;
    const m = path.match(/(\.[a-z0-9]{2,5})$/i);
    if (m) return m[1]!.toLowerCase();
  } catch {
    /* ignore */
  }
  if (mime?.includes("audio/mpeg")) return ".mp3";
  if (mime?.includes("audio/")) return ".m4a";
  if (mime?.includes("video/webm")) return ".webm";
  if (mime?.includes("video/")) return ".mp4";
  return "";
}

function triggerDownload(href: string, name: string, revoke = false) {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (revoke) window.setTimeout(() => URL.revokeObjectURL(href), 4000);
}

function resolveTable(ctx: MediaLibraryCtx): string | null {
  const inferred = inferItemTableForApp(ctx.app, ctx.comments);
  if (inferred) return inferred;
  const primary = (ctx.primaryTable || "").trim() || null;
  if (primary && !isCategoryTable(primary, ctx.comments)) return primary;
  return primary;
}

function resolveMediaFields(ctx: MediaLibraryCtx): MediaFields | null {
  const table = resolveTable(ctx);
  if (!table) return null;
  const extra = ctx.columns;
  const comments = ctx.comments;
  const title = inferNamedField(table, comments, TITLE_TOKENS, extra);
  const url = inferNamedField(
    table,
    comments,
    ctx.app === "video" ? VIDEO_URL_TOKENS : AUDIO_URL_TOKENS,
    extra,
  );
  if (!title || !url) return null;
  return {
    table,
    title,
    url,
    duration: inferNamedField(table, comments, DURATION_TOKENS, extra),
    cover: inferNamedField(table, comments, COVER_TOKENS, extra),
    artist: inferNamedField(table, comments, ARTIST_TOKENS, extra),
    album: inferNamedField(table, comments, ALBUM_TOKENS, extra),
    userId: inferAuthorIdField(table, comments, extra),
  };
}

function readMediaDuration(file: File, kind: "audio" | "video"): Promise<number> {
  return new Promise((resolve) => {
    const node = document.createElement(kind);
    const url = URL.createObjectURL(file);
    let settled = false;
    const done = (sec: number) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      node.removeAttribute("src");
      node.load();
      resolve(sec);
    };
    window.setTimeout(() => done(0), 4000);
    node.preload = "metadata";
    node.onloadedmetadata = () => {
      const d = node.duration;
      done(Number.isFinite(d) ? Math.max(0, Math.round(d)) : 0);
    };
    node.onerror = () => done(0);
    node.src = url;
  });
}

function grabVideoPoster(file: File): Promise<File | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    let settled = false;
    const finish = (out: File | null) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
      resolve(out);
    };
    const timer = window.setTimeout(() => finish(null), 3500);
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onloadeddata = () => {
      try {
        const hint = Number.isFinite(video.duration) ? video.duration * 0.08 : 0.4;
        video.currentTime = Math.max(0.1, Math.min(hint, 1.2));
      } catch {
        window.clearTimeout(timer);
        finish(null);
      }
    };
    video.onseeked = () => {
      try {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) {
          window.clearTimeout(timer);
          finish(null);
          return;
        }
        const scale = Math.min(1, 480 / Math.max(w, h));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          window.clearTimeout(timer);
          finish(null);
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            window.clearTimeout(timer);
            if (!blob) {
              finish(null);
              return;
            }
            const name = `${file.name.replace(/\.[^.]+$/, "")}.jpg`;
            finish(new File([blob], name, { type: "image/jpeg" }));
          },
          "image/jpeg",
          0.82,
        );
      } catch {
        window.clearTimeout(timer);
        finish(null);
      }
    };
    video.onerror = () => {
      window.clearTimeout(timer);
      finish(null);
    };
    video.src = url;
  });
}

type DirEntry = {
  kind: string;
  getFile?: () => Promise<File>;
};

async function collectFromDirectory(dir: unknown, out: File[] = []): Promise<File[]> {
  const handle = dir as { values?: () => AsyncIterable<DirEntry> };
  if (typeof handle.values !== "function") return out;
  for await (const entry of handle.values()) {
    if (entry.kind === "file" && entry.getFile) {
      try {
        out.push(await entry.getFile());
      } catch {
        /* skip unreadable */
      }
    } else if (entry.kind === "directory") {
      await collectFromDirectory(entry, out);
    }
  }
  return out;
}

function pickFiles(opts: {
  kind: "audio" | "video";
  directory?: boolean;
}): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.hidden = true;
    if (opts.directory) {
      input.setAttribute("webkitdirectory", "");
      input.setAttribute("directory", "");
    } else if (opts.kind === "audio") {
      input.accept = "audio/*,.mp3,.m4a,.wav,.flac,.aac,.ogg,.opus";
    } else if (opts.kind === "video") {
      input.accept = "video/*,.mp4,.webm,.mov,.m4v,.mkv";
    }
    const finish = (files: File[]) => {
      input.remove();
      resolve(files);
    };
    input.onchange = () => finish(Array.from(input.files ?? []));
    input.addEventListener("cancel", () => finish([]));
    document.body.appendChild(input);
    input.click();
  });
}

async function pickFolderFiles(kind: "audio" | "video"): Promise<File[]> {
  const picker = (
    window as unknown as { showDirectoryPicker?: () => Promise<unknown> }
  ).showDirectoryPicker;
  if (typeof picker === "function") {
    try {
      const dir = await picker();
      const all = await collectFromDirectory(dir);
      return all.filter((f) => isMediaFile(f, kind));
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return [];
    }
  }
  const picked = await pickFiles({ kind, directory: true });
  return picked.filter((f) => isMediaFile(f, kind));
}

function playlistFromRows(ctx: MediaLibraryCtx): MediaPlaylistItem[] {
  const items: MediaPlaylistItem[] = [];
  for (const row of ctx.rows) {
    const id = ctx.recordId(row);
    const pres = pickRowPresentation(row.cells, {
      primaryTable: ctx.primaryTable,
      columns: ctx.columns,
      comments: ctx.comments,
      recordId: id,
    });
    const url = ctx.app === "video" ? pres.videoUrl : pres.audioUrl || pres.videoUrl;
    if (!url) continue;
    items.push({
      title: pres.title || (id != null ? `#${id}` : row.key),
      url,
      cover: pres.coverUrl || undefined,
      duration: pres.durationSec ?? undefined,
      author: pres.author || undefined,
      album: pres.album || undefined,
      id: id ?? undefined,
    });
  }
  return items;
}

function parsePlaylistJson(raw: unknown, app: MediaKind): MediaPlaylistItem[] {
  const bag =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as { items?: unknown; app?: unknown })
      : null;
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(bag?.items)
      ? bag.items
      : [];
  const items: MediaPlaylistItem[] = [];
  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const rec = entry as Record<string, unknown>;
    const title = String(rec.title ?? rec.name ?? "").trim();
    const url = String(rec.url ?? rec.videoUrl ?? rec.audioUrl ?? "").trim();
    if (!title || !url) continue;
    const duration = Number(rec.duration ?? rec.durationSec);
    items.push({
      title,
      url,
      cover: String(rec.cover ?? rec.coverUrl ?? "").trim() || undefined,
      duration: Number.isFinite(duration) ? Math.max(0, Math.round(duration)) : undefined,
      author: String(rec.author ?? rec.artist ?? "").trim() || undefined,
      album: String(rec.album ?? "").trim() || undefined,
    });
  }
  if (bag?.app && bag.app !== app && items.length) {
    /* still import — urls are the payload */
  }
  return items;
}

async function writeMediaRow(
  ctx: MediaLibraryCtx,
  fields: MediaFields,
  rec: Record<string, unknown>,
  stayOnPage: boolean,
): Promise<boolean> {
  if (!ctx.onWrite) {
    flash(t("layout.needLogin"));
    return false;
  }
  try {
    const ok = await ctx.onWrite({
      method: "post",
      table: fields.table,
      body: { [fields.table]: rec, tag: fields.table },
      keepTag: true,
      skipTemplate: true,
      stayOnPage,
    });
    return ok !== false;
  } catch {
    return false;
  }
}

function baseRecord(
  fields: MediaFields,
  item: { title: string; url: string; duration?: number; cover?: string; author?: string; album?: string },
): Record<string, unknown> {
  const rec: Record<string, unknown> = {
    [fields.title]: item.title,
    [fields.url]: item.url,
  };
  if (fields.duration && item.duration != null) rec[fields.duration] = item.duration;
  if (fields.cover && item.cover) rec[fields.cover] = item.cover;
  if (fields.artist && item.author) rec[fields.artist] = item.author;
  if (fields.album && item.album) rec[fields.album] = item.album;
  const uid = visitorId();
  if (fields.userId && uid != null) rec[fields.userId] = uid;
  return rec;
}

export async function importLocalMediaFiles(
  ctx: MediaLibraryCtx,
  files: File[],
  onProgress?: (done: number, total: number) => void,
  opts?: { refreshLast?: boolean },
): Promise<{ ok: number; fail: number }> {
  const fields = resolveMediaFields(ctx);
  if (!fields) {
    flash(
      resolveTable(ctx)
        ? t("layout.media.noUrlField")
        : t("layout.explore.noItemTable"),
    );
    return { ok: 0, fail: files.length };
  }
  if (!ctx.onWrite) {
    flash(t("layout.needLogin"));
    return { ok: 0, fail: files.length };
  }
  const kind = mediaKind(ctx.app);
  const media = files.filter((f) => isMediaFile(f, kind));
  let ok = 0;
  let fail = 0;
  for (let i = 0; i < media.length; i++) {
    const file = media[i]!;
    onProgress?.(i + 1, media.length);
    try {
      const parsed = parseMediaName(file);
      const duration = await readMediaDuration(file, kind);
      const uploaded = await uploadFile(ctx.apijsonBase, file);
      let cover: string | undefined;
      if (fields.cover && kind === "video") {
        const poster = await grabVideoPoster(file);
        if (poster) {
          try {
            cover = (await uploadFile(ctx.apijsonBase, poster)).url;
          } catch {
            /* cover is optional */
          }
        }
      }
      const last = i === media.length - 1 && opts?.refreshLast !== false;
      const written = await writeMediaRow(
        ctx,
        fields,
        baseRecord(fields, {
          title: parsed.title,
          url: uploaded.url,
          duration,
          cover,
          author: parsed.artist,
        }),
        !last,
      );
      if (written) ok += 1;
      else fail += 1;
    } catch {
      fail += 1;
    }
  }
  return { ok, fail };
}

export async function importMediaPlaylist(
  ctx: MediaLibraryCtx,
  items: MediaPlaylistItem[],
  onProgress?: (done: number, total: number) => void,
  opts?: { refreshLast?: boolean },
): Promise<{ ok: number; fail: number }> {
  const fields = resolveMediaFields(ctx);
  if (!fields) {
    flash(
      resolveTable(ctx)
        ? t("layout.media.noUrlField")
        : t("layout.explore.noItemTable"),
    );
    return { ok: 0, fail: items.length };
  }
  if (!ctx.onWrite) {
    flash(t("layout.needLogin"));
    return { ok: 0, fail: items.length };
  }
  let ok = 0;
  let fail = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    onProgress?.(i + 1, items.length);
    const last = i === items.length - 1 && opts?.refreshLast !== false;
    const written = await writeMediaRow(
      ctx,
      fields,
      baseRecord(fields, item),
      !last,
    );
    if (written) ok += 1;
    else fail += 1;
  }
  return { ok, fail };
}

export function exportMediaPlaylist(ctx: MediaLibraryCtx): MediaPlaylistItem[] {
  const items = playlistFromRows(ctx);
  if (!items.length) {
    flash(t("layout.media.downloadEmpty"));
    return [];
  }
  const payload = {
    kind: "a2api-media-library",
    app: ctx.app,
    exportedAt: new Date().toISOString(),
    items,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  triggerDownload(
    URL.createObjectURL(blob),
    `library-${ctx.app}.json`,
    true,
  );
  flash(t("layout.media.downloaded"));
  return items;
}

export async function downloadMediaFiles(
  ctx: MediaLibraryCtx,
  items = playlistFromRows(ctx),
): Promise<void> {
  if (!items.length) {
    flash(t("layout.media.downloadEmpty"));
    return;
  }
  flash(t("layout.media.downloading", { n: items.length }));
  for (const item of items) {
    const url = mediaSrc(item.url, ctx.apijsonBase);
    if (!url) continue;
    const name = safeFileName(item.title, "media");
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("fetch");
      const blob = await res.blob();
      const ext = extFromUrl(url, blob.type) || (ctx.app === "music" ? ".mp3" : ".mp4");
      triggerDownload(URL.createObjectURL(blob), `${name}${ext}`, true);
    } catch {
      triggerDownload(url, name);
    }
    await new Promise((r) => window.setTimeout(r, 180));
  }
}

export async function downloadOneMedia(
  url: string,
  title: string,
  apijsonBase: string,
): Promise<void> {
  const src = mediaSrc(url, apijsonBase);
  if (!src) {
    flash(t("layout.media.downloadEmpty"));
    return;
  }
  const name = safeFileName(title, "media");
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error("fetch");
    const blob = await res.blob();
    const ext = extFromUrl(src, blob.type);
    triggerDownload(URL.createObjectURL(blob), `${name}${ext}`, true);
    flash(t("layout.media.downloaded"));
  } catch {
    triggerDownload(src, name);
    flash(t("layout.media.downloaded"));
  }
}

async function ingestPickedFiles(
  ctx: MediaLibraryCtx,
  files: File[],
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const kind = mediaKind(ctx.app);
  const jsonFiles = files.filter(
    (f) => /\.json$/i.test(f.name) || f.type === "application/json",
  );
  const media = files.filter((f) => isMediaFile(f, kind));
  let ok = 0;
  let fail = 0;
  let total = media.length;
  const playlist: MediaPlaylistItem[] = [];
  for (const file of jsonFiles) {
    try {
      const parsed = parsePlaylistJson(JSON.parse(await file.text()), ctx.app);
      playlist.push(...parsed);
    } catch {
      fail += 1;
    }
  }
  total += playlist.length;
  if (!total) {
    flash(t("layout.media.noFiles"));
    return;
  }
  if (media.length) {
    const r = await importLocalMediaFiles(ctx, media, onProgress, {
      refreshLast: playlist.length === 0,
    });
    ok += r.ok;
    fail += r.fail;
  }
  if (playlist.length) {
    const r = await importMediaPlaylist(ctx, playlist, onProgress, {
      refreshLast: true,
    });
    ok += r.ok;
    fail += r.fail;
  }
  flash(t("layout.media.added", { ok, total: ok + fail }));
}

function actionRow(
  icon: string,
  label: string,
  onClick: () => void,
): HTMLButtonElement {
  const row = el("button", "me-row");
  row.type = "button";
  row.append(
    el("span", "me-ico", icon),
    el("span", "me-lab", label),
    el("span", "me-chev", "›"),
  );
  row.onclick = onClick;
  return row;
}

export function mountMediaLibraryMenu(ctx: MediaLibraryCtx): HTMLElement {
  const wrap = el("div", "me-media");
  const menu = el("div", "me-menu");
  const panel = el("div", "me-media-panel");
  const add = actionRow("＋", t("layout.media.add"), () => {
    void (async () => {
      const files = await pickFiles({ kind: mediaKind(ctx.app) });
      if (!files.length) return;
      add.disabled = true;
      try {
        await ingestPickedFiles(ctx, files);
      } finally {
        add.disabled = false;
      }
    })();
  });
  const upload = actionRow("↑", t("layout.media.upload"), () => {
    panel.replaceChildren(renderMediaScanPage(ctx));
    panel.hidden = false;
  });
  const download = actionRow("↓", t("layout.media.download"), () => {
    void downloadMediaFiles(ctx);
  });
  menu.append(add, upload, download);
  panel.hidden = true;
  wrap.append(menu, panel);
  return wrap;
}

export function renderMediaScanPage(ctx: MediaLibraryCtx): HTMLElement {
  const page = el("div", "ex-page media-scan");
  page.appendChild(
    el(
      "h2",
      "ex-title",
      ctx.app === "music" ? t("layout.media.scanMusic") : t("layout.media.scanVideo"),
    ),
  );
  page.appendChild(el("p", "media-scan-hint", t("layout.media.hint")));

  const actions = el("div", "media-scan-actions");
  const folderBtn = btn(t("layout.media.pickFolder"), "layout-btn layout-btn-primary");
  const filesBtn = btn(t("layout.media.pickFiles"));
  actions.append(folderBtn, filesBtn);
  page.appendChild(actions);

  const status = el("div", "media-scan-status", t("layout.media.noFiles"));
  page.appendChild(status);

  const tools = el("div", "media-scan-tools");
  const allBtn = btn(t("layout.media.selectAll"));
  const addBtn = btn(t("layout.media.addSelected"), "layout-btn layout-btn-primary");
  addBtn.disabled = true;
  tools.append(allBtn, addBtn);
  page.appendChild(tools);

  const list = el("div", "media-scan-list");
  page.appendChild(list);

  type Row = { file: File; check: HTMLInputElement };
  const rows: Row[] = [];

  const selected = () => rows.filter((r) => r.check.checked).map((r) => r.file);

  const refreshTools = () => {
    const n = selected().length;
    addBtn.disabled = n === 0;
    addBtn.textContent = t("layout.media.addSelected") + (n ? ` (${n})` : "");
    status.textContent = rows.length
      ? t("layout.media.found", { n: rows.length })
      : t("layout.media.noFiles");
  };

  const addFiles = (files: File[]) => {
    const kind = mediaKind(ctx.app);
    const seen = new Set(rows.map((r) => `${r.file.name}:${r.file.size}`));
    for (const file of files) {
      if (!isMediaFile(file, kind)) continue;
      const key = `${file.name}:${file.size}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const row = el("label", "media-scan-item");
      const check = document.createElement("input");
      check.type = "checkbox";
      check.checked = true;
      check.onchange = () => refreshTools();
      const meta = el("div", "media-scan-meta");
      meta.appendChild(el("div", "media-scan-name", file.name));
      const path =
        typeof (file as File & { webkitRelativePath?: string }).webkitRelativePath ===
        "string"
          ? (file as File & { webkitRelativePath?: string }).webkitRelativePath
          : "";
      meta.appendChild(
        el(
          "div",
          "media-scan-sub",
          [formatBytes(file.size), path && path !== file.name ? path : ""]
            .filter(Boolean)
            .join(" · "),
        ),
      );
      row.append(check, meta);
      list.appendChild(row);
      rows.push({ file, check });
    }
    refreshTools();
  };

  folderBtn.onclick = () => {
    void (async () => {
      status.textContent = t("layout.media.scanning");
      const files = await pickFolderFiles(mediaKind(ctx.app));
      addFiles(files);
      if (!files.length && !rows.length) status.textContent = t("layout.media.noFiles");
    })();
  };
  filesBtn.onclick = () => {
    void (async () => {
      const files = await pickFiles({ kind: mediaKind(ctx.app) });
      addFiles(files.filter((f) => isMediaFile(f, mediaKind(ctx.app))));
    })();
  };
  allBtn.onclick = () => {
    const next = rows.some((r) => !r.check.checked);
    for (const r of rows) r.check.checked = next;
    refreshTools();
  };
  addBtn.onclick = () => {
    const files = selected();
    if (!files.length) return;
    void (async () => {
      addBtn.disabled = true;
      folderBtn.disabled = true;
      filesBtn.disabled = true;
      try {
        await ingestPickedFiles(ctx, files, (n, total) => {
          status.textContent = t("layout.media.adding", { n, total });
        });
      } finally {
        folderBtn.disabled = false;
        filesBtn.disabled = false;
        refreshTools();
      }
    })();
  };

  refreshTools();
  return page;
}
