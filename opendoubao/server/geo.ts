/**
 * Nominatim (OSM) proxy for address suggest / reverse geocode.
 * Keeps a User-Agent and rate-friendly caching on the BFF.
 */

export type GeoPlace = {
  label: string;
  region: string;
  address: string;
  lat: number;
  lng: number;
};

type NominatimHit = {
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: Record<string, string>;
};

const UA = "OpenDoubao/0.1 (local demo; address picker)";
const cache = new Map<string, { at: number; places: GeoPlace[] }>();
const CACHE_MS = 60_000;

function regionFromAddress(addr: Record<string, string> | undefined): string {
  if (!addr) return "";
  const parts = [
    addr.state || addr.province,
    addr.city || addr.town || addr.municipality || addr.county,
    addr.suburb || addr.district || addr.city_district || addr.neighbourhood,
  ]
    .map((s) => String(s || "").trim())
    .filter(Boolean);
  return [...new Set(parts)].join(" ");
}

function detailFromAddress(
  addr: Record<string, string> | undefined,
  display: string,
): string {
  if (!addr) return display;
  const line = [
    addr.road || addr.pedestrian || addr.path,
    addr.house_number,
    addr.building || addr.amenity || addr.shop || addr.office,
  ]
    .map((s) => String(s || "").trim())
    .filter(Boolean)
    .join(" ");
  if (line) return line;
  const region = regionFromAddress(addr);
  if (region && display.startsWith(region)) {
    return display.slice(region.length).replace(/^[,，\s]+/, "").trim() || display;
  }
  return display;
}

function toPlace(hit: NominatimHit): GeoPlace | null {
  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const label = String(hit.display_name || "").trim();
  if (!label) return null;
  return {
    label,
    region: regionFromAddress(hit.address),
    address: detailFromAddress(hit.address, label),
    lat,
    lng,
  };
}

async function nominatimJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": UA,
    },
  });
  if (!res.ok) throw new Error(`geocode ${res.status}`);
  return res.json();
}

export async function searchPlaces(q: string, limit = 6): Promise<GeoPlace[]> {
  const query = q.trim();
  if (query.length < 2) return [];
  const key = `s:${query}:${limit}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.places;

  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1` +
    `&limit=${Math.min(Math.max(limit, 1), 10)}` +
    `&q=${encodeURIComponent(query)}`;
  const raw = (await nominatimJson(url)) as NominatimHit[];
  const places = (Array.isArray(raw) ? raw : [])
    .map(toPlace)
    .filter((p): p is GeoPlace => !!p);
  cache.set(key, { at: Date.now(), places });
  return places;
}

export async function reversePlace(lat: number, lng: number): Promise<GeoPlace | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const key = `r:${lat.toFixed(5)},${lng.toFixed(5)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.places[0] ?? null;

  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1` +
    `&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}`;
  const raw = (await nominatimJson(url)) as NominatimHit;
  const place = toPlace(raw);
  cache.set(key, { at: Date.now(), places: place ? [place] : [] });
  return place;
}
