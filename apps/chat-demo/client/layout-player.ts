/**
 * Real HTMLMediaElement chrome: play/pause, seek (drag), volume, fullscreen.
 * Used by YouTube watch / TikTok stage / Spotify bar.
 */

import { getUiLocale, t } from "./i18n/index.js";
import {
  formatDuration,
  inferQualityFromUrl,
  mediaSrc,
  VIDEO_QUALITY_LADDER,
  type MediaQuality,
  type MediaSubtitle,
  type VideoQualityLabel,
} from "./page-layout.js";

const SEEK_MAX = 1000;

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

function iconBtn(className: string, label: string, text: string): HTMLButtonElement {
  const b = el("button", className, text);
  b.type = "button";
  b.title = label;
  b.setAttribute("aria-label", label);
  return b;
}

function mediaDuration(media: HTMLMediaElement, hint?: number | null): number {
  const d = media.duration;
  if (Number.isFinite(d) && d > 0) return d;
  if (hint != null && Number.isFinite(hint) && hint > 0) return hint;
  return 0;
}

function captionSrc(url: string, apijsonBase: string): string {
  const s = url.trim();
  if (s.startsWith("/media/")) return s;
  return mediaSrc(s, apijsonBase);
}

function stripCueHtml(text: string): string {
  return text.replace(/<[^>]+>/g, "").replace(/\n+/g, "\n").trim();
}

function closeMenus(shell: HTMLElement) {
  for (const node of shell.querySelectorAll(".mp-menu")) {
    (node as HTMLElement).hidden = true;
  }
}

function attachMenu(
  shell: HTMLElement,
  btn: HTMLButtonElement,
  menu: HTMLElement,
) {
  menu.hidden = true;
  btn.onclick = (ev) => {
    ev.stopPropagation();
    const open = menu.hidden;
    closeMenus(shell);
    menu.hidden = !open;
  };
  menu.addEventListener("click", (ev) => ev.stopPropagation());
}

/** Wire a range input to currentTime. Dragging seeks immediately and does not fight timeupdate. */
export function bindSeekBar(opts: {
  media: HTMLMediaElement;
  seek: HTMLInputElement;
  currentEl?: HTMLElement | null;
  totalEl?: HTMLElement | null;
  durationHint?: number | null;
}): void {
  const { media, seek, currentEl, totalEl, durationHint } = opts;
  seek.type = "range";
  seek.min = "0";
  seek.max = String(SEEK_MAX);
  seek.step = "1";
  if (!seek.value) seek.value = "0";
  let dragging = false;

  const paint = (time: number) => {
    const d = mediaDuration(media, durationHint);
    seek.disabled = d <= 0 && !media.currentSrc;
    if (d > 0) {
      const ratio = Math.min(1, Math.max(0, time / d));
      seek.value = String(Math.round(ratio * SEEK_MAX));
      seek.style.setProperty("--mp-played", `${(ratio * 100).toFixed(2)}%`);
    } else {
      seek.style.setProperty("--mp-played", "0%");
    }
    if (currentEl) currentEl.textContent = formatDuration(time) || "0:00";
    if (totalEl) {
      totalEl.textContent = formatDuration(d) || formatDuration(durationHint) || "0:00";
    }
  };

  const timeFromSeek = (): number => {
    const d = mediaDuration(media, durationHint);
    if (d <= 0) return 0;
    return (Number(seek.value) / SEEK_MAX) * d;
  };

  const applySeek = () => {
    const d = mediaDuration(media, durationHint);
    if (d <= 0) return;
    try {
      media.currentTime = timeFromSeek();
    } catch {
      /* not ready */
    }
  };

  seek.addEventListener("pointerdown", (ev) => {
    dragging = true;
    try {
      seek.setPointerCapture(ev.pointerId);
    } catch {
      /* old browsers */
    }
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    applySeek();
  };
  seek.addEventListener("pointerup", endDrag);
  seek.addEventListener("pointercancel", endDrag);
  seek.addEventListener("input", () => {
    const time = timeFromSeek();
    const d = mediaDuration(media, durationHint);
    if (d > 0) {
      seek.style.setProperty("--mp-played", `${((time / d) * 100).toFixed(2)}%`);
    }
    if (currentEl) currentEl.textContent = formatDuration(time) || "0:00";
    applySeek();
  });
  seek.addEventListener("change", applySeek);
  seek.addEventListener("click", (ev) => ev.stopPropagation());
  seek.addEventListener("pointerdown", (ev) => ev.stopPropagation());

  media.addEventListener("timeupdate", () => {
    if (dragging) return;
    paint(media.currentTime || 0);
  });
  media.addEventListener("loadedmetadata", () => paint(media.currentTime || 0));
  media.addEventListener("durationchange", () => paint(media.currentTime || 0));
  media.addEventListener("seeked", () => {
    if (!dragging) paint(media.currentTime || 0);
  });
  paint(media.currentTime || 0);
}

function togglePlay(media: HTMLMediaElement): void {
  if (!media.currentSrc) return;
  if (media.paused) void media.play().catch(() => undefined);
  else media.pause();
}

function requestFs(shell: HTMLElement, media: HTMLVideoElement): void {
  const webkitFs = (
    media as HTMLVideoElement & { webkitEnterFullscreen?: () => void }
  ).webkitEnterFullscreen;
  if (document.fullscreenElement === shell) {
    void document.exitFullscreen?.();
    return;
  }
  if (shell.requestFullscreen) {
    void shell.requestFullscreen().catch(() => {
      webkitFs?.call(media);
    });
    return;
  }
  webkitFs?.call(media);
}

export function mountVideoChrome(opts: {
  shell: HTMLElement;
  media: HTMLVideoElement;
  variant: "youtube" | "tiktok";
  durationHint?: number | null;
  onNext?: () => void;
  qualities?: MediaQuality[];
  subtitles?: MediaSubtitle[];
  apijsonBase?: string;
}): void {
  const { shell, media, variant, durationHint, onNext } = opts;
  const qualities = (opts.qualities ?? []).filter((q) => q.url);
  const subtitles = opts.subtitles ?? [];
  const apijsonBase = opts.apijsonBase ?? "";
  media.controls = false;
  media.removeAttribute("controls");
  media.playsInline = true;
  media.preload = media.preload || "metadata";
  shell.classList.add("mp-shell", `mp-${variant}`);
  shell.tabIndex = 0;
  shell.classList.add("is-mp-active");
  if (variant === "tiktok") shell.classList.add("is-mp-portrait");

  const hit = el("div", "mp-hit");
  const big = el("div", "mp-big", "▶");
  big.setAttribute("aria-hidden", "true");
  const empty = el("div", "mp-empty", t("layout.noMedia"));
  empty.hidden = !!media.currentSrc || !!media.getAttribute("src");
  const cueEl = el("div", "mp-cue");
  cueEl.hidden = true;

  const bar = el("div", variant === "tiktok" ? "mp-bar mp-bar-slim" : "mp-bar");
  const seek = document.createElement("input");
  seek.className = "mp-seek";
  const timeCur = el("span", "mp-time", "0:00");
  const timeTot = el(
    "span",
    "mp-time",
    formatDuration(durationHint) || "0:00",
  );
  const playBtn = iconBtn("mp-btn mp-btn-play", t("layout.play"), "▶");
  const nextBtn = onNext
    ? iconBtn("mp-btn", t("layout.nextMedia"), "⏭")
    : null;
  const muteBtn = iconBtn(
    "mp-btn",
    media.muted ? t("layout.unmute") : t("layout.mute"),
    media.muted || media.volume === 0 ? "🔇" : "🔊",
  );
  const vol = document.createElement("input");
  vol.type = "range";
  vol.className = "mp-vol";
  vol.min = "0";
  vol.max = "100";
  vol.step = "1";
  vol.value = String(Math.round((media.muted ? 0 : media.volume) * 100));
  vol.title = t("layout.volume");
  vol.setAttribute("aria-label", t("layout.volume"));
  const fsBtn = iconBtn("mp-btn", t("layout.fullscreen"), "⛶");

  const seekRow = el("div", "mp-seek-row");
  seekRow.append(seek);
  const tools = el("div", "mp-tools");
  tools.append(playBtn);
  if (nextBtn) tools.append(nextBtn);
  const times = el("div", "mp-times");
  times.append(timeCur, el("span", "mp-time-sep", "/"), timeTot);
  tools.append(times);
  const right = el("div", "mp-tools-right");
  right.append(muteBtn);
  if (variant === "youtube") right.append(vol);

  const uiLang = getUiLocale() === "zh-CN" ? "zh" : "en";
  let subOn = subtitles.length > 0;
  let subLang =
    subtitles.find((s) => s.lang === uiLang)?.lang ??
    subtitles.find((s) => s.lang.startsWith(uiLang))?.lang ??
    subtitles[0]?.lang ??
    "";
  let qualityUrl = media.currentSrc || media.getAttribute("src") || qualities[0]?.url || "";
  const blobUrls: string[] = [];

  const paintCue = () => {
    if (!subOn) {
      cueEl.textContent = "";
      cueEl.hidden = true;
      return;
    }
    const track = [...media.textTracks].find((tr) => tr.mode === "hidden" || tr.mode === "showing");
    const active = track?.activeCues?.[0] as VTTCue | undefined;
    const text = active?.text ? stripCueHtml(active.text) : "";
    cueEl.textContent = text;
    cueEl.hidden = !text;
  };

  const clearTracks = () => {
    for (const node of [...media.querySelectorAll("track")]) node.remove();
    for (const url of blobUrls) URL.revokeObjectURL(url);
    blobUrls.length = 0;
    for (const tr of media.textTracks) tr.mode = "disabled";
    cueEl.textContent = "";
    cueEl.hidden = true;
  };

  const applySubtitles = () => {
    clearTracks();
    if (!subOn || !subLang) return;
    const sub = subtitles.find((s) => s.lang === subLang) ?? subtitles[0];
    if (!sub) return;
    const track = document.createElement("track");
    track.kind = "subtitles";
    track.label = sub.label;
    track.srclang = sub.lang;
    track.default = true;
    if (sub.vtt) {
      const url = URL.createObjectURL(new Blob([sub.vtt], { type: "text/vtt" }));
      blobUrls.push(url);
      track.src = url;
    } else if (sub.url) {
      track.src = captionSrc(sub.url, apijsonBase);
    } else {
      return;
    }
    media.appendChild(track);
    const ready = () => {
      if (track.track) {
        track.track.mode = "hidden";
        track.track.addEventListener("cuechange", paintCue);
      }
      paintCue();
    };
    track.addEventListener("load", ready);
    window.setTimeout(ready, 80);
  };

  const ccBtn = subtitles.length
    ? iconBtn(
        "mp-btn mp-btn-text",
        t("layout.subtitles"),
        subOn ? "CC" : "CC̸",
      )
    : null;
  const ccMenu = el("div", "mp-menu");
  if (ccBtn) {
    const off = el("button", "mp-menu-item", t("layout.subtitlesOff"));
    off.type = "button";
    off.onclick = () => {
      subOn = false;
      applySubtitles();
      setCcUi();
      ccMenu.hidden = true;
    };
    ccMenu.appendChild(off);
    for (const sub of subtitles) {
      const item = el("button", "mp-menu-item", sub.label);
      item.type = "button";
      item.onclick = () => {
        subOn = true;
        subLang = sub.lang;
        applySubtitles();
        setCcUi();
        ccMenu.hidden = true;
      };
      ccMenu.appendChild(item);
    }
    const other = subtitles.find((s) => s.lang !== subLang);
    if (other) {
      const tr = el("button", "mp-menu-item", t("layout.translateSubtitles"));
      tr.type = "button";
      tr.onclick = () => {
        const cur = subtitles.find((s) => s.lang === subLang);
        const next =
          subtitles.find((s) => s.lang !== (cur?.lang ?? subLang)) ?? other;
        subOn = true;
        subLang = next.lang;
        applySubtitles();
        setCcUi();
        ccMenu.hidden = true;
      };
      ccMenu.appendChild(tr);
    }
    attachMenu(shell, ccBtn, ccMenu);
    right.append(ccBtn, ccMenu);
  }

  const setCcUi = () => {
    if (!ccBtn) return;
    ccBtn.textContent = subOn ? "CC" : "CC̸";
    ccBtn.classList.toggle("is-on", subOn);
    const label = subOn
      ? `${t("layout.subtitles")}: ${
          subtitles.find((s) => s.lang === subLang)?.label ?? subLang
        }`
      : t("layout.subtitlesOff");
    ccBtn.title = label;
    ccBtn.setAttribute("aria-label", label);
    for (const node of ccMenu.querySelectorAll(".mp-menu-item")) {
      const btn = node as HTMLButtonElement;
      btn.classList.toggle(
        "is-current",
        subOn
          ? btn.textContent ===
              (subtitles.find((s) => s.lang === subLang)?.label ?? "")
          : btn.textContent === t("layout.subtitlesOff"),
      );
    }
  };

  const qualityByLabel = new Map<VideoQualityLabel, string>();
  for (const q of qualities) {
    const label = (VIDEO_QUALITY_LADDER as readonly string[]).includes(q.label)
      ? (q.label as VideoQualityLabel)
      : inferQualityFromUrl(q.url);
    if (label && q.url) qualityByLabel.set(label, q.url);
  }
  const fallbackSrc =
    qualityUrl || media.currentSrc || media.getAttribute("src") || "";
  if (!qualityByLabel.size && fallbackSrc) {
    qualityByLabel.set(inferQualityFromUrl(fallbackSrc) ?? "480P", fallbackSrc);
  }
  const currentQualityLabel = (): VideoQualityLabel => {
    for (const label of VIDEO_QUALITY_LADDER) {
      const url = qualityByLabel.get(label);
      if (url && (url === qualityUrl || mediaSrc(url, apijsonBase) === qualityUrl)) {
        return label;
      }
    }
    return (
      inferQualityFromUrl(qualityUrl) ??
      VIDEO_QUALITY_LADDER.find((label) => qualityByLabel.has(label)) ??
      "480P"
    );
  };
  const qBtn = iconBtn(
    "mp-btn mp-btn-text",
    t("layout.quality"),
    currentQualityLabel(),
  );
  const qMenu = el("div", "mp-menu");
  const paintQualityMenu = () => {
    const cur = currentQualityLabel();
    qBtn.textContent = cur;
    for (const node of qMenu.querySelectorAll(".mp-menu-item")) {
      const btn = node as HTMLButtonElement;
      btn.classList.toggle("is-current", btn.dataset.quality === cur);
    }
  };
  for (const label of VIDEO_QUALITY_LADDER) {
    const url = qualityByLabel.get(label) ?? null;
    const item = el("button", "mp-menu-item", label);
    item.type = "button";
    item.dataset.quality = label;
    if (!url) {
      item.disabled = true;
      item.classList.add("is-off");
      item.title = t("layout.qualityUnavailable");
    } else {
      item.onclick = () => {
        if (url === qualityUrl) {
          qMenu.hidden = true;
          return;
        }
        const t0 = media.currentTime || 0;
        const playing = !media.paused;
        qualityUrl = url;
        media.src = mediaSrc(url, apijsonBase);
        const restore = () => {
          try {
            media.currentTime = t0;
          } catch {
            /* ignore */
          }
          applySubtitles();
          if (playing) void media.play().catch(() => undefined);
        };
        media.addEventListener("loadedmetadata", restore, { once: true });
        paintQualityMenu();
        qMenu.hidden = true;
      };
    }
    qMenu.appendChild(item);
  }
  attachMenu(shell, qBtn, qMenu);
  right.append(qBtn, qMenu);
  paintQualityMenu();

  const orientBtn = iconBtn(
    "mp-btn mp-btn-text",
    t("layout.orientation"),
    variant === "tiktok" ? t("layout.landscape") : t("layout.portrait"),
  );
  const setOrientUi = () => {
    const portrait = shell.classList.contains("is-mp-portrait");
    orientBtn.textContent = portrait ? t("layout.landscape") : t("layout.portrait");
    orientBtn.title = t("layout.orientation");
    orientBtn.setAttribute("aria-label", t("layout.orientation"));
    shell.classList.toggle("is-mp-landscape", !portrait);
  };
  orientBtn.onclick = (ev) => {
    ev.stopPropagation();
    shell.classList.toggle("is-mp-portrait");
    setOrientUi();
  };

  right.append(orientBtn, fsBtn);
  tools.append(right);
  bar.append(seekRow, tools);

  const setPlayingUi = (playing: boolean) => {
    playBtn.textContent = playing ? "❚❚" : "▶";
    playBtn.title = playing ? t("layout.pause") : t("layout.play");
    playBtn.setAttribute("aria-label", playBtn.title);
    big.textContent = playing ? "" : "▶";
    big.classList.toggle("is-hidden", playing);
    shell.classList.toggle("is-mp-playing", playing);
    if (!playing) shell.classList.add("is-mp-active");
  };

  const setMuteUi = () => {
    const silent = media.muted || media.volume === 0;
    muteBtn.textContent = silent ? "🔇" : "🔊";
    muteBtn.title = silent ? t("layout.unmute") : t("layout.mute");
    muteBtn.setAttribute("aria-label", muteBtn.title);
    if (!media.muted) vol.value = String(Math.round(media.volume * 100));
    else vol.value = "0";
  };

  const setFsUi = () => {
    const on = document.fullscreenElement === shell;
    fsBtn.title = on ? t("layout.exitFullscreen") : t("layout.fullscreen");
    fsBtn.setAttribute("aria-label", fsBtn.title);
    shell.classList.toggle("is-mp-fs", on);
  };

  playBtn.onclick = (ev) => {
    ev.stopPropagation();
    if (!media.currentSrc) {
      empty.hidden = false;
      empty.textContent = t("layout.noMedia");
      return;
    }
    togglePlay(media);
  };
  if (nextBtn && onNext) {
    nextBtn.onclick = (ev) => {
      ev.stopPropagation();
      onNext();
    };
  }
  muteBtn.onclick = (ev) => {
    ev.stopPropagation();
    media.muted = !media.muted;
    if (!media.muted && media.volume === 0) media.volume = 0.8;
    setMuteUi();
  };
  vol.oninput = () => {
    media.volume = Number(vol.value) / 100;
    media.muted = media.volume === 0;
    setMuteUi();
  };
  vol.addEventListener("click", (ev) => ev.stopPropagation());
  fsBtn.onclick = (ev) => {
    ev.stopPropagation();
    requestFs(shell, media);
  };
  bar.addEventListener("click", (ev) => ev.stopPropagation());
  bar.addEventListener("pointerdown", (ev) => ev.stopPropagation());

  let clickTimer = 0;
  hit.addEventListener("click", () => {
    closeMenus(shell);
    if (clickTimer) window.clearTimeout(clickTimer);
    clickTimer = window.setTimeout(() => {
      clickTimer = 0;
      togglePlay(media);
    }, 220);
  });
  hit.addEventListener("dblclick", (ev) => {
    ev.preventDefault();
    if (clickTimer) {
      window.clearTimeout(clickTimer);
      clickTimer = 0;
    }
    requestFs(shell, media);
  });

  media.addEventListener("play", () => {
    empty.hidden = true;
    setPlayingUi(true);
  });
  media.addEventListener("pause", () => setPlayingUi(false));
  media.addEventListener("volumechange", setMuteUi);
  media.addEventListener("error", () => {
    empty.hidden = false;
    empty.textContent = t("layout.mediaError");
    setPlayingUi(false);
  });
  media.addEventListener("cuechange", paintCue);
  media.textTracks.addEventListener("change", paintCue);
  document.addEventListener("fullscreenchange", setFsUi);

  bindSeekBar({ media, seek, currentEl: timeCur, totalEl: timeTot, durationHint });

  let hideTimer = 0;
  const bumpChrome = () => {
    shell.classList.add("is-mp-active");
    if (hideTimer) window.clearTimeout(hideTimer);
    if (!media.paused) {
      hideTimer = window.setTimeout(() => {
        if (shell.querySelector(".mp-menu:not([hidden])")) return;
        shell.classList.remove("is-mp-active");
      }, 2400);
    }
  };
  shell.addEventListener("mousemove", bumpChrome);
  shell.addEventListener("pointerdown", () => {
    bumpChrome();
    shell.focus({ preventScroll: true });
  });
  media.addEventListener("play", bumpChrome);
  media.addEventListener("pause", bumpChrome);

  shell.addEventListener("keydown", (ev) => {
    const target = ev.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement
    ) {
      return;
    }
    const key = ev.key;
    if (key === " " || key === "k" || key === "K") {
      ev.preventDefault();
      togglePlay(media);
      return;
    }
    if (key === "m" || key === "M") {
      ev.preventDefault();
      muteBtn.click();
      return;
    }
    if (key === "c" || key === "C") {
      ev.preventDefault();
      if (subtitles.length) {
        subOn = !subOn;
        applySubtitles();
        setCcUi();
      }
      return;
    }
    if (key === "t" || key === "T") {
      ev.preventDefault();
      const next = subtitles.find((s) => s.lang !== subLang);
      if (next) {
        subOn = true;
        subLang = next.lang;
        applySubtitles();
        setCcUi();
      }
      return;
    }
    if (key === "r" || key === "R") {
      ev.preventDefault();
      orientBtn.click();
      return;
    }
    if (key === "f" || key === "F") {
      ev.preventDefault();
      requestFs(shell, media);
      return;
    }
    const d = mediaDuration(media, durationHint);
    if (d > 0 && (key === "ArrowLeft" || key === "j" || key === "J")) {
      ev.preventDefault();
      media.currentTime = Math.max(0, media.currentTime - (key === "ArrowLeft" ? 5 : 10));
      return;
    }
    if (d > 0 && (key === "ArrowRight" || key === "l" || key === "L")) {
      ev.preventDefault();
      media.currentTime = Math.min(d, media.currentTime + (key === "ArrowRight" ? 5 : 10));
      return;
    }
    if (key === "ArrowUp") {
      ev.preventDefault();
      media.muted = false;
      media.volume = Math.min(1, media.volume + 0.05);
      return;
    }
    if (key === "ArrowDown") {
      ev.preventDefault();
      media.volume = Math.max(0, media.volume - 0.05);
      return;
    }
    if (key === "n" || key === "N") {
      if (onNext) {
        ev.preventDefault();
        onNext();
      }
    }
  });

  const onDocClick = (ev: MouseEvent) => {
    if (!shell.contains(ev.target as Node)) closeMenus(shell);
  };
  document.addEventListener("click", onDocClick);
  const obs = new MutationObserver(() => {
    if (document.body.contains(shell)) return;
    document.removeEventListener("click", onDocClick);
    document.removeEventListener("fullscreenchange", setFsUi);
    clearTracks();
    obs.disconnect();
  });
  obs.observe(document.body, { childList: true, subtree: true });

  shell.append(hit, big, empty, cueEl, bar);
  setPlayingUi(!media.paused);
  setMuteUi();
  setFsUi();
  setOrientUi();
  setCcUi();
  applySubtitles();
  media.addEventListener("timeupdate", paintCue);
  bumpChrome();
}
