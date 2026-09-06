/**
 * Checkout address pick + Nominatim-backed suggest / map pick (via BFF).
 */

import { t } from "./i18n/index.js";
import {
  beginListPick,
  clearListPick,
  getListPick,
  isListPickActive,
} from "./layout-list-select.js";

export type CheckoutAddress = {
  id?: string | number;
  consignee: string;
  phone: string;
  region: string;
  address: string;
  tag?: string;
  isDefault?: boolean;
};

export type GeoPlace = {
  label: string;
  region: string;
  address: string;
  lat: number;
  lng: number;
};

const CHECKOUT_KEY = "a2api.checkoutAddress";
export const CHECKOUT_ADDRESS_PURPOSE = "checkoutAddress";

export function getCheckoutAddress(): CheckoutAddress | null {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckoutAddress;
    if (!parsed || typeof parsed !== "object") return null;
    if (!String(parsed.consignee || "").trim() && !String(parsed.address || "").trim()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setCheckoutAddress(addr: CheckoutAddress): void {
  try {
    sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify(addr));
  } catch {
    /* quota */
  }
}

export function clearCheckoutAddress(): void {
  try {
    sessionStorage.removeItem(CHECKOUT_KEY);
  } catch {
    /* ignore */
  }
}

/** Start single-select pick of a recipient for checkout. */
export function beginAddressPick(): void {
  beginListPick({
    purpose: CHECKOUT_ADDRESS_PURPOSE,
    mode: "single",
    returnPage: "order",
  });
}

export function isAddressPickMode(): boolean {
  if (!isListPickActive()) return false;
  const s = getListPick();
  return s?.purpose === CHECKOUT_ADDRESS_PURPOSE;
}

export function clearAddressPick(): void {
  if (isAddressPickMode()) clearListPick();
}

export function formatAddressLine(addr: CheckoutAddress): string {
  return [addr.region, addr.address].map((s) => String(s || "").trim()).filter(Boolean).join(" ");
}

export function formatAddressCard(addr: CheckoutAddress): string {
  const line = formatAddressLine(addr);
  const head = [addr.consignee, addr.phone].map((s) => String(s || "").trim()).filter(Boolean).join(" · ");
  return [head, line].filter(Boolean).join("\n");
}

function cell(
  cells: Record<string, unknown>,
  table: string | null | undefined,
  field: string,
): unknown {
  const tname = (table || "").trim();
  if (tname && cells[`${tname}.${field}`] != null) return cells[`${tname}.${field}`];
  return cells[field];
}

export function checkoutAddressFromRow(
  cells: Record<string, unknown>,
  table: string | null | undefined,
  id?: string | number | null,
): CheckoutAddress {
  const def = cell(cells, table, "isDefault");
  return {
    id: id ?? (cell(cells, table, "id") as string | number | undefined),
    consignee: String(cell(cells, table, "consignee") ?? "").trim(),
    phone: String(cell(cells, table, "phone") ?? "").trim(),
    region: String(cell(cells, table, "region") ?? "").trim(),
    address: String(cell(cells, table, "address") ?? "").trim(),
    tag: String(cell(cells, table, "tag") ?? "").trim() || undefined,
    isDefault: def === 1 || def === "1" || def === true || def === "true",
  };
}

export type ShippingRole =
  | "consignee"
  | "sender"
  | "courier"
  | "pickup"
  | "unknown";

export type ParsedShippingParty = {
  role: ShippingRole;
  roleLabel: string;
  consignee: string;
  phone: string;
  region: string;
  address: string;
};

const ROLE_PATTERNS: Array<{ role: ShippingRole; re: RegExp; labelZh: string }> = [
  {
    role: "consignee",
    re: /收\s*货\s*人|收\s*件\s*人|收\s*件|收\s*货|送达|receiver|consignee/i,
    labelZh: "收货人",
  },
  {
    role: "sender",
    re: /寄\s*件\s*人|发\s*件\s*人|寄\s*件|发\s*件|寄\s*货|sender|shipper/i,
    labelZh: "寄件人",
  },
  {
    role: "courier",
    re: /送\s*货\s*人|配\s*送\s*员|派\s*件\s*员|送\s*件|courier|driver/i,
    labelZh: "送货人",
  },
  {
    role: "pickup",
    re: /取\s*货\s*人|提\s*货\s*人|取\s*件\s*人|取\s*货|提\s*货|pickup/i,
    labelZh: "取货人",
  },
];

const PHONE_RE =
  /(?<![0-9])(?:1[3-9]\d{9}|0\d{2,3}-?\d{7,8}|\+?86[-\s]?1[3-9]\d{9})(?![0-9])/g;

const REGION_RE =
  /((?:北京|天津|上海|重庆)市?|(?:河北|山西|辽宁|吉林|黑龙江|江苏|浙江|安徽|福建|江西|山东|河南|湖北|湖南|广东|海南|四川|贵州|云南|陕西|甘肃|青海|台湾)省?|内蒙古|广西|西藏|宁夏|新疆|香港|澳门)(?:[\s/]*(?:[\u4e00-\u9fff]{1,12}(?:市|州|盟|地区|区|县|旗))){0,3}/;

function cleanChunk(s: string): string {
  return s
    .replace(/^[，,;；:\s：]+|[，,;；:\s：]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractPhone(text: string): { phone: string; rest: string } {
  PHONE_RE.lastIndex = 0;
  const m = PHONE_RE.exec(text);
  if (!m) return { phone: "", rest: text };
  const phone = m[0]!.replace(/[^\d+]/g, "").replace(/^\+?86/, "");
  const rest = `${text.slice(0, m.index)} ${text.slice(m.index + m[0]!.length)}`;
  return { phone, rest: cleanChunk(rest) };
}

function extractRegion(text: string): { region: string; rest: string } {
  const m = text.match(REGION_RE);
  if (!m || m.index == null) return { region: "", rest: text };
  const region = cleanChunk(m[0]!);
  const rest = cleanChunk(
    `${text.slice(0, m.index)} ${text.slice(m.index + m[0]!.length)}`,
  );
  return { region, rest };
}

function extractName(text: string): { name: string; rest: string } {
  const labeled = text.match(
    /(?:姓名|名字|联系人|name)\s*[:：]?\s*([A-Za-z·\u4e00-\u9fff]{2,20})/i,
  );
  if (labeled?.[1]) {
    const name = labeled[1].trim();
    return {
      name,
      rest: cleanChunk(text.replace(labeled[0], " ")),
    };
  }
  const cn = text.match(/^([A-Za-z·\u4e00-\u9fff]{2,8})(?:\s|$|，|,|；|;)/);
  if (cn?.[1] && !/省|市|区|县|路|街|号|楼/.test(cn[1])) {
    return { name: cn[1], rest: cleanChunk(text.slice(cn[0].length)) };
  }
  const any = text.match(/([A-Za-z·\u4e00-\u9fff]{2,4})/);
  if (any?.[1] && !/省|市|区|县|路|街|号/.test(any[1])) {
    return {
      name: any[1],
      rest: cleanChunk(text.replace(any[1], " ")),
    };
  }
  return { name: "", rest: text };
}

function parsePartyChunk(
  chunk: string,
  role: ShippingRole,
  roleLabel: string,
): ParsedShippingParty | null {
  let rest = cleanChunk(
    chunk
      .replace(
        /(?:姓名|名字|手机|电话|手机号|联系电话|所在地区|地区|省市区|详细地址|地址|住址)\s*[:：]/g,
        " ",
      )
      .replace(
        /(?:收\s*货\s*人|收\s*件\s*人|寄\s*件\s*人|发\s*件\s*人|送\s*货\s*人|取\s*货\s*人|提\s*货\s*人|收\s*件|寄\s*件|取\s*货|提\s*货)\s*[:：]?/gi,
        " ",
      ),
  );
  if (!rest) return null;
  const phoneHit = extractPhone(rest);
  rest = phoneHit.rest;
  const regionHit = extractRegion(rest);
  rest = regionHit.rest;
  const nameHit = extractName(rest);
  rest = nameHit.rest;
  const address = cleanChunk(rest).replace(/^的?\s*/, "");
  if (!phoneHit.phone && !nameHit.name && !address && !regionHit.region) {
    return null;
  }
  return {
    role,
    roleLabel,
    consignee: nameHit.name,
    phone: phoneHit.phone,
    region: regionHit.region,
    address: address || (regionHit.region ? "" : cleanChunk(chunk)),
  };
}

function splitByRoles(text: string): Array<{ role: ShippingRole; label: string; body: string }> {
  const src = text.replace(/\r\n?/g, "\n");
  const hits: Array<{ index: number; role: ShippingRole; label: string; len: number }> =
    [];
  for (const pat of ROLE_PATTERNS) {
    const re = new RegExp(pat.re.source, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) {
      hits.push({
        index: m.index,
        role: pat.role,
        label: pat.labelZh,
        len: m[0].length,
      });
    }
  }
  hits.sort((a, b) => a.index - b.index);
  if (!hits.length) {
    return [{ role: "unknown", label: "", body: src }];
  }
  const parts: Array<{ role: ShippingRole; label: string; body: string }> = [];
  for (let i = 0; i < hits.length; i++) {
    const cur = hits[i]!;
    const end = i + 1 < hits.length ? hits[i + 1]!.index : src.length;
    const body = src.slice(cur.index + cur.len, end);
    parts.push({ role: cur.role, label: cur.label, body });
  }
  const before = src.slice(0, hits[0]!.index).trim();
  if (before.length > 4) {
    parts.unshift({ role: "unknown", label: "", body: before });
  }
  return parts;
}

/** Parse pasted shipping / contact blurbs into one or more parties. */
export function parseShippingText(raw: string): ParsedShippingParty[] {
  const text = String(raw || "").trim();
  if (!text) return [];
  const parts = splitByRoles(text);
  const out: ParsedShippingParty[] = [];
  for (const part of parts) {
    const party = parsePartyChunk(
      part.body,
      part.role,
      part.label || (part.role === "unknown" ? "" : part.label),
    );
    if (party) out.push(party);
  }
  if (!out.length) {
    const fallback = parsePartyChunk(text, "consignee", "收货人");
    if (fallback) out.push(fallback);
  }
  return out;
}

/** Prefer 收货人/收件人 when multiple parties were parsed. */
export function preferConsigneeParty(
  parties: ParsedShippingParty[],
): ParsedShippingParty | null {
  if (!parties.length) return null;
  return (
    parties.find((p) => p.role === "consignee") ||
    parties.find((p) => p.role === "unknown") ||
    parties[0] ||
    null
  );
}

export function suggestConsignees(
  q: string,
  known: CheckoutAddress[],
  limit = 8,
): CheckoutAddress[] {
  const query = q.trim().toLowerCase();
  if (!query) return known.slice(0, limit);
  const scored = known
    .map((a) => {
      const hay = `${a.consignee} ${a.phone} ${a.region} ${a.address} ${a.tag || ""}`.toLowerCase();
      let score = 0;
      if (a.consignee.toLowerCase().startsWith(query)) score += 8;
      if (a.phone.includes(query)) score += 6;
      if (hay.includes(query)) score += 3;
      return { a, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const out: CheckoutAddress[] = [];
  for (const { a } of scored) {
    const key = `${a.consignee}|${a.phone}|${a.address}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
    if (out.length >= limit) break;
  }
  return out;
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

/** Name/phone autocomplete from known address-book rows. */
export function bindConsigneeSuggest(
  input: HTMLInputElement,
  opts: {
    known: CheckoutAddress[];
    onPick: (addr: CheckoutAddress) => void;
  },
): () => void {
  const host = input.parentElement;
  if (host) host.classList.add("az-addr-suggest-host");
  const box = el("div", "az-geo-suggest");
  box.hidden = true;
  host?.appendChild(box);

  const hide = () => {
    box.hidden = true;
    box.innerHTML = "";
  };

  const paint = (rows: CheckoutAddress[]) => {
    box.innerHTML = "";
    if (!rows.length) {
      hide();
      return;
    }
    for (const row of rows) {
      const label = [row.consignee, row.phone, formatAddressLine(row)]
        .filter(Boolean)
        .join(" · ");
      const btn = el("button", "az-geo-suggest-item", label);
      btn.type = "button";
      btn.onclick = () => {
        opts.onPick(row);
        hide();
      };
      box.appendChild(btn);
    }
    box.hidden = false;
  };

  const onInput = () => paint(suggestConsignees(input.value, opts.known));
  const onFocus = () => paint(suggestConsignees(input.value, opts.known));
  const onBlur = () => setTimeout(hide, 180);
  input.addEventListener("input", onInput);
  input.addEventListener("focus", onFocus);
  input.addEventListener("blur", onBlur);
  return () => {
    input.removeEventListener("input", onInput);
    input.removeEventListener("focus", onFocus);
    input.removeEventListener("blur", onBlur);
    box.remove();
  };
}

export async function suggestPlaces(q: string, limit = 6): Promise<GeoPlace[]> {
  const query = q.trim();
  if (query.length < 2) return [];
  const url = `/api/geo/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await fetch(url);
  const json = (await res.json().catch(() => null)) as
    | { ok?: boolean; places?: GeoPlace[] }
    | null;
  return Array.isArray(json?.places) ? json!.places! : [];
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeoPlace | null> {
  const url = `/api/geo/reverse?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`;
  const res = await fetch(url);
  const json = (await res.json().catch(() => null)) as
    | { ok?: boolean; place?: GeoPlace | null }
    | null;
  return json?.place ?? null;
}

/** Debounced address suggest under an input; picking fills region + detail. */
export function bindAddressSuggest(
  input: HTMLInputElement | HTMLTextAreaElement,
  opts: {
    onPick: (place: GeoPlace) => void;
    regionInput?: HTMLInputElement | HTMLTextAreaElement | null;
  },
): () => void {
  const box = el("div", "az-geo-suggest");
  box.hidden = true;
  input.parentElement?.appendChild(box);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let seq = 0;

  const hide = () => {
    box.hidden = true;
    box.innerHTML = "";
  };

  const paint = (places: GeoPlace[]) => {
    box.innerHTML = "";
    if (!places.length) {
      hide();
      return;
    }
    for (const place of places) {
      const btn = el("button", "az-geo-suggest-item", place.label);
      btn.type = "button";
      btn.onclick = () => {
        opts.onPick(place);
        hide();
      };
      box.appendChild(btn);
    }
    box.hidden = false;
  };

  const onInput = () => {
    const q = input.value.trim();
    if (timer) clearTimeout(timer);
    if (q.length < 2) {
      hide();
      return;
    }
    timer = setTimeout(() => {
      const my = ++seq;
      void suggestPlaces(q).then((places) => {
        if (my !== seq) return;
        paint(places);
      });
    }, 280);
  };

  const onBlur = () => setTimeout(hide, 180);
  input.addEventListener("input", onInput);
  input.addEventListener("blur", onBlur);

  return () => {
    if (timer) clearTimeout(timer);
    input.removeEventListener("input", onInput);
    input.removeEventListener("blur", onBlur);
    box.remove();
  };
}

/** Modal map / search picker → GeoPlace. */
export function openMapAddressPicker(opts: {
  initialQuery?: string;
  onPick: (place: GeoPlace) => void;
}): void {
  document.getElementById("az-map-pick")?.remove();
  const root = el("div", "az-map-pick");
  root.id = "az-map-pick";
  const panel = el("div", "az-map-pick-panel");
  const head = el("div", "az-map-pick-head");
  head.appendChild(el("div", "az-map-pick-title", t("layout.addressMapPick")));
  const close = el("button", "layout-btn", t("common.close"));
  close.type = "button";
  close.onclick = () => root.remove();
  head.appendChild(close);
  panel.appendChild(head);

  const searchRow = el("div", "az-map-pick-search");
  const search = document.createElement("input");
  search.className = "layout-input";
  search.type = "search";
  search.placeholder = t("layout.addressMapSearch");
  search.value = opts.initialQuery || "";
  const go = el("button", "az-btn az-btn-buy", t("layout.addressMapSearchBtn"));
  go.type = "button";
  searchRow.append(search, go);
  panel.appendChild(searchRow);

  const locBtn = el("button", "layout-btn", t("layout.addressUseLocation"));
  locBtn.type = "button";
  panel.appendChild(locBtn);

  const map = el("iframe", "az-map-pick-frame") as HTMLIFrameElement;
  map.title = t("layout.addressMapPick");
  map.setAttribute("loading", "lazy");
  map.referrerPolicy = "no-referrer-when-downgrade";
  panel.appendChild(map);

  const list = el("div", "az-map-pick-list");
  panel.appendChild(list);

  const useBtn = el("button", "az-btn az-btn-buy", t("layout.addressUsePlace"));
  useBtn.type = "button";
  useBtn.disabled = true;
  panel.appendChild(useBtn);

  let selected: GeoPlace | null = null;

  const setMap = (lat: number, lng: number) => {
    const d = 0.02;
    const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
    map.src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`;
  };

  const paintList = (places: GeoPlace[]) => {
    list.innerHTML = "";
    for (const place of places) {
      const btn = el("button", "az-map-pick-item", place.label);
      btn.type = "button";
      btn.onclick = () => {
        selected = place;
        useBtn.disabled = false;
        setMap(place.lat, place.lng);
        list.querySelectorAll(".az-map-pick-item").forEach((n) => {
          n.classList.toggle("is-on", n === btn);
        });
      };
      list.appendChild(btn);
    }
    if (places[0]) {
      selected = places[0];
      useBtn.disabled = false;
      setMap(places[0].lat, places[0].lng);
      list.firstElementChild?.classList.add("is-on");
    }
  };

  const runSearch = () => {
    const q = search.value.trim();
    if (!q) return;
    go.disabled = true;
    void suggestPlaces(q, 8)
      .then(paintList)
      .finally(() => {
        go.disabled = false;
      });
  };

  go.onclick = () => runSearch();
  search.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      runSearch();
    }
  });

  locBtn.onclick = () => {
    if (!navigator.geolocation) {
      locBtn.textContent = t("layout.addressGeoDenied");
      return;
    }
    locBtn.disabled = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void reverseGeocode(pos.coords.latitude, pos.coords.longitude)
          .then((place) => {
            if (place) paintList([place]);
            else {
              const fallback: GeoPlace = {
                label: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
                region: "",
                address: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              };
              paintList([fallback]);
            }
          })
          .finally(() => {
            locBtn.disabled = false;
          });
      },
      () => {
        locBtn.disabled = false;
        locBtn.textContent = t("layout.addressGeoDenied");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  useBtn.onclick = () => {
    if (!selected) return;
    opts.onPick(selected);
    root.remove();
  };

  root.appendChild(panel);
  root.addEventListener("click", (ev) => {
    if (ev.target === root) root.remove();
  });
  document.body.appendChild(root);
  setMap(31.2304, 121.4737);
  if (opts.initialQuery?.trim()) runSearch();
}
