/**
 * Real HTMLMediaElement chrome: play/pause, seek (drag), volume, fullscreen.
 * Used by YouTube watch / TikTok stage / Spotify bar.
 */

import { t } from "./i18n/index.js";
import { formatDuration } from "./page-layout.js";

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
}): void {
  const { shell, media, variant, durationHint, onNext } = opts;
  media.controls = false;
  media.removeAttribute("controls");
  media.playsInline = true;
  media.preload = media.preload || "metadata";
  shell.classList.add("mp-shell", `mp-${variant}`);
  shell.tabIndex = 0;
  shell.classList.add("is-mp-active");

  const hit = el("div", "mp-hit");
  const big = el("div", "mp-big", "▶");
  big.setAttribute("aria-hidden", "true");
  const empty = el("div", "mp-empty", t("layout.noMedia"));
  empty.hidden = !!media.currentSrc || !!media.getAttribute("src");

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
  right.append(fsBtn);
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
  document.addEventListener("fullscreenchange", setFsUi);

  bindSeekBar({ media, seek, currentEl: timeCur, totalEl: timeTot, durationHint });

  let hideTimer = 0;
  const bumpChrome = () => {
    shell.classList.add("is-mp-active");
    if (hideTimer) window.clearTimeout(hideTimer);
    if (!media.paused) {
      hideTimer = window.setTimeout(() => {
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

  shell.append(hit, big, empty, bar);
  setPlayingUi(!media.paused);
  setMuteUi();
  setFsUi();
  bumpChrome();
}
