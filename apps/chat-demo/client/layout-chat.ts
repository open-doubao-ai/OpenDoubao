/**
 * WeChat-style thread extras: emoji / voice / image / call / red-packet / transfer / file / location.
 * Payloads go through the bound `message` slot as encoded text — no Demo table names.
 */

import { t } from "./i18n/index.js";
import { openImageLightbox } from "./image-lightbox.js";
import { mediaSrc } from "./page-layout.js";
import { uploadFile } from "./upload.js";

export type ChatKind =
  | "text"
  | "image"
  | "voice"
  | "file"
  | "location"
  | "hongbao"
  | "transfer"
  | "call";

export type ChatPayload =
  | { kind: "text"; text: string }
  | { kind: "image"; url: string }
  | { kind: "voice"; sec: number; url?: string }
  | { kind: "file"; name: string; url: string; size?: number }
  | { kind: "location"; lat: number; lng: number; label: string }
  | { kind: "hongbao"; amount: string; note: string }
  | { kind: "transfer"; amount: string; note: string }
  | { kind: "call"; mode: "voice" | "video"; sec: number };

const PREFIX = "#im/";

const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😅", "😊", "😍", "😘", "😎", "🤔",
  "😢", "😭", "😡", "🤯", "😴", "🤗", "👍", "👎", "👏", "🙏",
  "❤️", "🔥", "⭐", "🎉", "🎁", "🧧", "💰", "📍", "📷", "🎵",
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

function enc(s: string): string {
  return encodeURIComponent(s);
}

function dec(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export function encodeChatMessage(payload: ChatPayload): string {
  switch (payload.kind) {
    case "text":
      return payload.text;
    case "image":
      return `${PREFIX}image|${enc(payload.url)}`;
    case "voice":
      return `${PREFIX}voice|${payload.sec}|${enc(payload.url || "")}`;
    case "file":
      return `${PREFIX}file|${enc(payload.name)}|${enc(payload.url)}|${payload.size ?? ""}`;
    case "location":
      return `${PREFIX}loc|${payload.lat}|${payload.lng}|${enc(payload.label)}`;
    case "hongbao":
      return `${PREFIX}pack|${enc(payload.amount)}|${enc(payload.note)}`;
    case "transfer":
      return `${PREFIX}pay|${enc(payload.amount)}|${enc(payload.note)}`;
    case "call":
      return `${PREFIX}call|${payload.mode}|${payload.sec}`;
  }
}

const IMAGE_URL_RE = /^(https?:\/\/|\/|data:image\/).+\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i;
const LOOSE_IMAGE_RE = /^(https?:\/\/|\/apijson\/|\/download\/).+/i;

export function decodeChatMessage(raw: string): ChatPayload {
  const text = (raw || "").trim();
  if (!text) return { kind: "text", text: "" };
  if (text.startsWith(PREFIX)) {
    const rest = text.slice(PREFIX.length);
    const [kind, ...parts] = rest.split("|");
    if (kind === "image") return { kind: "image", url: dec(parts[0] || "") };
    if (kind === "voice") {
      return {
        kind: "voice",
        sec: Number(parts[0]) || 0,
        url: dec(parts[1] || "") || undefined,
      };
    }
    if (kind === "file") {
      return {
        kind: "file",
        name: dec(parts[0] || t("layout.im.file")),
        url: dec(parts[1] || ""),
        size: parts[2] ? Number(parts[2]) : undefined,
      };
    }
    if (kind === "loc") {
      return {
        kind: "location",
        lat: Number(parts[0]) || 0,
        lng: Number(parts[1]) || 0,
        label: dec(parts[2] || t("layout.im.location")),
      };
    }
    if (kind === "pack") {
      return {
        kind: "hongbao",
        amount: dec(parts[0] || ""),
        note: dec(parts[1] || t("layout.im.hongbaoBless")),
      };
    }
    if (kind === "pay" || kind === "xfer" || kind === "transfer") {
      return {
        kind: "transfer",
        amount: dec(parts[0] || ""),
        note: dec(parts[1] || t("layout.im.transferDefault")),
      };
    }
    if (kind === "call") {
      return {
        kind: "call",
        mode: parts[0] === "video" ? "video" : "voice",
        sec: Number(parts[1]) || 0,
      };
    }
  }
  if (IMAGE_URL_RE.test(text) || (/^https?:\/\//i.test(text) && LOOSE_IMAGE_RE.test(text) && /(?:pic|img|image|avatar|head)/i.test(text))) {
    return { kind: "image", url: text };
  }
  return { kind: "text", text };
}

function formatSize(n?: number): string {
  if (n == null || !Number.isFinite(n) || n <= 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatSec(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m ? `${m}:${String(r).padStart(2, "0")}` : `${r}″`;
}

export function fillChatBubble(
  bubble: HTMLElement,
  raw: string,
  apijsonBase: string,
): void {
  const payload = decodeChatMessage(raw);
  if (payload.kind === "text") {
    bubble.appendChild(el("div", "wx-text", payload.text));
    return;
  }
  if (payload.kind === "image" && payload.url) {
    const src = mediaSrc(payload.url, apijsonBase);
    const img = document.createElement("img");
    img.className = "wx-img";
    img.src = src;
    img.alt = "";
    img.onclick = () => openImageLightbox(() => [src], 0);
    bubble.appendChild(img);
    return;
  }
  if (payload.kind === "voice") {
    const btn = el("button", "wx-voice");
    btn.type = "button";
    btn.textContent = `♫  ${formatSec(payload.sec)}`;
    if (payload.url) {
      const audio = new Audio(mediaSrc(payload.url, apijsonBase));
      btn.onclick = () => {
        void audio.play().catch(() => undefined);
      };
    }
    bubble.appendChild(btn);
    return;
  }
  if (payload.kind === "file") {
    const card = el("a", "wx-file");
    card.href = payload.url ? mediaSrc(payload.url, apijsonBase) : "#";
    if (payload.url) card.target = "_blank";
    else card.onclick = (ev) => ev.preventDefault();
    card.appendChild(el("div", "wx-file-ico", "📄"));
    const mid = el("div");
    mid.appendChild(el("div", "wx-text", payload.name));
    const meta = formatSize(payload.size);
    if (meta) mid.appendChild(el("div", "wx-time", meta));
    card.appendChild(mid);
    bubble.appendChild(card);
    return;
  }
  if (payload.kind === "location") {
    const card = el("a", "wx-loc");
    const q = `${payload.lat},${payload.lng}`;
    card.href = `https://maps.google.com/?q=${enc(q)}`;
    card.target = "_blank";
    card.rel = "noreferrer";
    card.appendChild(el("div", "wx-loc-pin", "📍"));
    const mid = el("div");
    mid.appendChild(el("div", "wx-text", payload.label || t("layout.im.location")));
    mid.appendChild(el("div", "wx-time", q));
    card.appendChild(mid);
    bubble.appendChild(card);
    return;
  }
  if (payload.kind === "hongbao") {
    const card = el("div", "wx-pack");
    card.appendChild(el("div", "wx-pack-ico", "🧧"));
    const mid = el("div");
    mid.appendChild(el("div", "wx-pack-amt", payload.amount));
    mid.appendChild(el("div", "wx-pack-note", payload.note || t("layout.im.hongbaoBless")));
    card.append(mid);
    bubble.appendChild(card);
    return;
  }
  if (payload.kind === "transfer") {
    const card = el("div", "wx-xfer");
    card.appendChild(el("div", "wx-pack-ico", "💸"));
    const mid = el("div");
    mid.appendChild(el("div", "wx-pack-amt", payload.amount));
    mid.appendChild(
      el("div", "wx-pack-note", payload.note || t("layout.im.transferDefault")),
    );
    card.append(mid);
    bubble.appendChild(card);
    return;
  }
  if (payload.kind === "call") {
    const label =
      payload.mode === "video"
        ? t("layout.im.videoCall")
        : t("layout.im.voiceCall");
    bubble.appendChild(
      el("div", "wx-call-rec", `${payload.mode === "video" ? "📹" : "📞"}  ${label}  ${formatSec(payload.sec)}`),
    );
  }
}

export type ChatComposerOpts = {
  apijsonBase: string;
  onSend: (text: string) => Promise<boolean>;
  onNote?: (msg: string) => void;
};

export function mountChatComposer(opts: ChatComposerOpts): HTMLElement {
  const wrap = el("div", "wx-dock");
  const composer = el("div", "wx-composer");
  const voiceBtn = el("button", "wx-tool", "🎙");
  voiceBtn.type = "button";
  voiceBtn.title = t("layout.im.voice");
  const input = document.createElement("input");
  input.type = "text";
  input.className = "wx-input";
  input.placeholder = t("layout.composerHint");
  const hold = el("button", "wx-hold hidden", t("layout.im.holdTalk"));
  hold.type = "button";
  const emojiBtn = el("button", "wx-tool", "☺");
  emojiBtn.type = "button";
  emojiBtn.title = t("layout.im.emoji");
  const plusBtn = el("button", "wx-tool", "+");
  plusBtn.type = "button";
  plusBtn.title = t("layout.im.more");
  const send = el("button", "wx-send", t("layout.send"));
  send.type = "button";
  composer.append(voiceBtn, input, hold, emojiBtn, plusBtn, send);

  const emojiPanel = el("div", "wx-panel hidden");
  const emojiGrid = el("div", "wx-emoji-grid");
  for (const e of EMOJIS) {
    const b = el("button", "wx-emoji", e);
    b.type = "button";
    b.onclick = () => {
      input.value += e;
      input.focus();
      syncSend();
    };
    emojiGrid.appendChild(b);
  }
  emojiPanel.appendChild(emojiGrid);

  const plusPanel = el("div", "wx-panel hidden");
  const plusGrid = el("div", "wx-plus-grid");
  const tools: Array<{ id: string; icon: string; label: string; run: () => void }> = [
    { id: "image", icon: "🖼", label: t("layout.im.image"), run: () => pickFile("image/*", false) },
    { id: "camera", icon: "📷", label: t("layout.im.camera"), run: () => pickFile("image/*", true) },
    { id: "voiceCall", icon: "📞", label: t("layout.im.voiceCall"), run: () => startCall("voice") },
    { id: "videoCall", icon: "📹", label: t("layout.im.videoCall"), run: () => startCall("video") },
    { id: "hongbao", icon: "🧧", label: t("layout.im.hongbao"), run: () => openHongbao() },
    { id: "transfer", icon: "💸", label: t("layout.im.transfer"), run: () => openTransfer() },
    { id: "file", icon: "📄", label: t("layout.im.file"), run: () => pickFile("*/*", false) },
    { id: "location", icon: "📍", label: t("layout.im.location"), run: () => sendLocation() },
  ];
  for (const tool of tools) {
    const b = el("button", "wx-plus");
    b.type = "button";
    b.dataset.chatTool = tool.id;
    b.append(el("span", "wx-plus-ico", tool.icon), el("span", "wx-plus-lab", tool.label));
    b.onclick = () => {
      plusPanel.classList.add("hidden");
      tool.run();
    };
    plusGrid.appendChild(b);
  }
  plusPanel.appendChild(plusGrid);
  wrap.append(composer, emojiPanel, plusPanel);

  const hidePanels = () => {
    emojiPanel.classList.add("hidden");
    plusPanel.classList.add("hidden");
  };
  const syncSend = () => {
    const canSend = !!input.value.trim() && hold.classList.contains("hidden");
    send.classList.toggle("hidden", !canSend);
    plusBtn.classList.toggle("hidden", canSend);
  };
  emojiBtn.onclick = () => {
    plusPanel.classList.add("hidden");
    emojiPanel.classList.toggle("hidden");
  };
  plusBtn.onclick = () => {
    emojiPanel.classList.add("hidden");
    plusPanel.classList.toggle("hidden");
  };

  let voiceMode = false;
  voiceBtn.onclick = () => {
    voiceMode = !voiceMode;
    input.classList.toggle("hidden", voiceMode);
    hold.classList.toggle("hidden", !voiceMode);
    voiceBtn.classList.toggle("is-on", voiceMode);
    hidePanels();
    syncSend();
  };

  const sendText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const ok = await opts.onSend(trimmed);
    if (ok) input.value = "";
    syncSend();
  };
  send.onclick = () => void sendText(input.value);
  input.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      void sendText(input.value);
    }
  });
  input.addEventListener("input", syncSend);
  syncSend();

  let recorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let recStart = 0;
  let recording = false;
  const stopRec = async () => {
    if (!recording) return;
    recording = false;
    hold.classList.remove("is-rec");
    hold.textContent = t("layout.im.holdTalk");
    const rec = recorder;
    recorder = null;
    const sec = Math.max(1, Math.round((Date.now() - recStart) / 1000));
    if (!rec) {
      void sendText(encodeChatMessage({ kind: "voice", sec }));
      return;
    }
    await new Promise<void>((resolve) => {
      rec.onstop = () => resolve();
      if (rec.state !== "inactive") rec.stop();
      else resolve();
    });
    const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
    chunks = [];
    if (blob.size < 80) {
      void sendText(encodeChatMessage({ kind: "voice", sec }));
      return;
    }
    try {
      const file = new File([blob], `voice-${Date.now()}.webm`, {
        type: blob.type || "audio/webm",
      });
      const up = await uploadFile(opts.apijsonBase, file);
      await sendText(encodeChatMessage({ kind: "voice", sec, url: up.url }));
    } catch (e) {
      opts.onNote?.(e instanceof Error ? e.message : String(e));
      await sendText(encodeChatMessage({ kind: "voice", sec }));
    }
  };
  const startRec = async () => {
    if (recording) return;
    recording = true;
    hold.classList.add("is-rec");
    hold.textContent = t("layout.im.releaseEnd");
    recStart = Date.now();
    chunks = [];
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (ev) => {
        if (ev.data.size) chunks.push(ev.data);
      };
      recorder.onstop = () => {
        for (const track of stream.getTracks()) track.stop();
      };
      recorder.start();
    } catch {
      recorder = null;
    }
  };
  hold.addEventListener("pointerdown", (ev) => {
    ev.preventDefault();
    hold.setPointerCapture(ev.pointerId);
    void startRec();
  });
  hold.addEventListener("pointerup", () => void stopRec());
  hold.addEventListener("pointercancel", () => void stopRec());

  const pickFile = (accept: string, camera: boolean) => {
    const file = document.createElement("input");
    file.type = "file";
    file.accept = accept;
    if (camera) file.setAttribute("capture", "environment");
    file.onchange = () => {
      const picked = file.files?.[0];
      if (!picked) return;
      void (async () => {
        try {
          const up = await uploadFile(opts.apijsonBase, picked);
          const image = /^image\//.test(picked.type) || accept.startsWith("image/");
          if (image) {
            await sendText(encodeChatMessage({ kind: "image", url: up.url }));
          } else {
            await sendText(
              encodeChatMessage({
                kind: "file",
                name: picked.name || t("layout.im.file"),
                url: up.url,
                size: picked.size,
              }),
            );
          }
        } catch (e) {
          opts.onNote?.(e instanceof Error ? e.message : String(e));
        }
      })();
    };
    file.click();
  };

  const sendLocation = () => {
    if (!navigator.geolocation) {
      opts.onNote?.(t("layout.im.noGeo"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void sendText(
          encodeChatMessage({
            kind: "location",
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            label: t("layout.im.myLocation"),
          }),
        );
      },
      () => opts.onNote?.(t("layout.im.noGeo")),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const openAmountSheet = (cfg: {
    title: string;
    amountHint: string;
    noteHint: string;
    noteValue?: string;
    sendLabel: string;
    onOk: (amount: string, note: string) => void;
  }) => {
    document.getElementById("wx-sheet")?.remove();
    const mask = el("div", "wx-sheet");
    mask.id = "wx-sheet";
    const box = el("div", "wx-sheet-box wx-pack-box");
    box.appendChild(el("div", "wx-sheet-title", cfg.title));
    const amount = document.createElement("input");
    amount.className = "wx-input";
    amount.inputMode = "decimal";
    amount.placeholder = cfg.amountHint;
    const note = document.createElement("input");
    note.className = "wx-input";
    note.placeholder = cfg.noteHint;
    if (cfg.noteValue) note.value = cfg.noteValue;
    const row = el("div", "wx-sheet-actions");
    const cancel = el("button", "layout-btn", t("common.cancel"));
    cancel.type = "button";
    const ok = el("button", "wx-send", cfg.sendLabel);
    ok.type = "button";
    cancel.onclick = () => mask.remove();
    ok.onclick = () => {
      const amt = amount.value.trim();
      if (!amt) return;
      mask.remove();
      cfg.onOk(amt, note.value.trim());
    };
    row.append(cancel, ok);
    box.append(amount, note, row);
    mask.appendChild(box);
    mask.onclick = (ev) => {
      if (ev.target === mask) mask.remove();
    };
    document.body.appendChild(mask);
  };
  const openHongbao = () => {
    openAmountSheet({
      title: t("layout.im.hongbao"),
      amountHint: t("layout.im.hongbaoAmount"),
      noteHint: t("layout.im.hongbaoBless"),
      noteValue: t("layout.im.hongbaoBless"),
      sendLabel: t("layout.im.hongbaoSend"),
      onOk: (amount, note) => {
        void sendText(
          encodeChatMessage({
            kind: "hongbao",
            amount,
            note: note || t("layout.im.hongbaoBless"),
          }),
        );
      },
    });
  };
  const openTransfer = () => {
    openAmountSheet({
      title: t("layout.im.transfer"),
      amountHint: t("layout.im.transferAmount"),
      noteHint: t("layout.im.transferNote"),
      sendLabel: t("layout.im.transferSend"),
      onOk: (amount, note) => {
        void sendText(
          encodeChatMessage({
            kind: "transfer",
            amount,
            note: note || t("layout.im.transferDefault"),
          }),
        );
      },
    });
  };

  const startCall = (mode: "voice" | "video") => {
    document.getElementById("wx-call")?.remove();
    const started = Date.now();
    const overlay = el("div", "wx-call");
    overlay.id = "wx-call";
    overlay.appendChild(
      el("div", "wx-call-title", mode === "video" ? t("layout.im.videoCall") : t("layout.im.voiceCall")),
    );
    const timer = el("div", "wx-call-time", "00:00");
    overlay.appendChild(timer);
    let videoEl: HTMLVideoElement | null = null;
    if (mode === "video" && navigator.mediaDevices?.getUserMedia) {
      videoEl = document.createElement("video");
      videoEl.className = "wx-call-video";
      videoEl.autoplay = true;
      videoEl.muted = true;
      videoEl.playsInline = true;
      overlay.appendChild(videoEl);
      void navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (!videoEl) return;
          videoEl.srcObject = stream;
        })
        .catch(() => undefined);
    }
    const tick = window.setInterval(() => {
      const sec = Math.floor((Date.now() - started) / 1000);
      const m = Math.floor(sec / 60);
      const r = sec % 60;
      timer.textContent = `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
    }, 500);
    const hang = el("button", "wx-call-hang", t("layout.im.hangup"));
    hang.type = "button";
    hang.onclick = () => {
      window.clearInterval(tick);
      const stream = videoEl?.srcObject;
      if (stream instanceof MediaStream) {
        for (const track of stream.getTracks()) track.stop();
      }
      overlay.remove();
      void sendText(
        encodeChatMessage({
          kind: "call",
          mode,
          sec: Math.max(1, Math.round((Date.now() - started) / 1000)),
        }),
      );
    };
    overlay.appendChild(hang);
    document.body.appendChild(overlay);
  };

  return wrap;
}
