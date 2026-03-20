import {
  ChartType,
  DEFAULT_COORDINATES,
  DEFAULT_PLACE_SUGGESTIONS,
  FALLBACK_CITY_COORDINATES,
} from '../constants/coordinates.constants';

export { ChartType } from '../constants/coordinates.constants';

const NOMINATIM_USER_AGENT = 'AstroService/1.0';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const GEOCODE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const SEARCH_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const searchCache = new Map<
  string,
  { places: Array<{ displayName: string; lat: number; lng: number }>; expiry: number }
>();

const geocodeCache = new Map<
  string,
  { coords: { lat: number; lng: number }; expiry: number }
>();

/**
 * Resolves a city/place name to coordinates.
 * 1. Empty input → Delhi (default).
 * 2. Match in a small fallback list (no network).
 * 3. Match in in-memory cache (from previous Nominatim lookups).
 * 4. OpenStreetMap Nominatim (free, no API key). Results are cached.
 * 5. On any failure → Delhi (default).
 *
 * Uses Nominatim: https://nominatim.org/release-docs/develop/api/Search/
 * A valid User-Agent is required; we send AstroService/1.0.
 */
export async function getCoordinatesFromCity(cityName: string): Promise<{
  lat: number;
  lng: number;
}> {
  if (!cityName || !cityName.trim()) {
    return DEFAULT_COORDINATES;
  }

  const key = cityName.toLowerCase().trim();

  // 1) Fallback list
  const fromFallback = FALLBACK_CITY_COORDINATES[key];
  if (fromFallback) return fromFallback;

  // 2) Fuzzy fallback (e.g. "New Delhi" vs "delhi")
  for (const [city, coords] of Object.entries(FALLBACK_CITY_COORDINATES)) {
    if (key.includes(city) || city.includes(key)) return coords;
  }

  // 3) Cache
  const cached = geocodeCache.get(key);
  if (cached && Date.now() < cached.expiry) return cached.coords;

  // 4) Nominatim
  try {
    const url = `${NOMINATIM_URL}?q=${encodeURIComponent(cityName)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': NOMINATIM_USER_AGENT },
    });
    if (!res.ok) return DEFAULT_COORDINATES;
    const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    if (Array.isArray(data) && data.length > 0 && data[0].lat != null && data[0].lon != null) {
      const coords = { lat: Number(data[0].lat), lng: Number(data[0].lon) };
      if (Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
        geocodeCache.set(key, { coords, expiry: Date.now() + GEOCODE_CACHE_TTL_MS });
        return coords;
      }
    }
  } catch {
    // Network or parse error → use default
  }

  return DEFAULT_COORDINATES;
}

export type PlaceSuggestion = { displayName: string; lat: number; lng: number };

/**
 * Search places for autocomplete. Empty query returns default list; otherwise fetches from Nominatim.
 * Results are cached for 1 hour.
 */
export async function searchPlaces(
  query: string,
  limit = 15,
): Promise<PlaceSuggestion[]> {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [...DEFAULT_PLACE_SUGGESTIONS];

  const cacheKey = `${q}_${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) return cached.places;

  try {
    const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query.trim())}&format=json&limit=${limit}&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': NOMINATIM_USER_AGENT, 'Accept-Language': 'en' },
    });
    if (!res.ok) return [...DEFAULT_PLACE_SUGGESTIONS];
    const data = (await res.json()) as Array<{ display_name?: string; lat?: string; lon?: string }>;
    if (!Array.isArray(data)) return [...DEFAULT_PLACE_SUGGESTIONS];
    const places = data
      .filter((x) => x.display_name && x.lat != null && x.lon != null)
      .map((x) => ({
        displayName: x.display_name!,
        lat: Number(x.lat),
        lng: Number(x.lon),
      }))
      .filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng));
    searchCache.set(cacheKey, { places, expiry: Date.now() + SEARCH_CACHE_TTL_MS });
    return places;
  } catch {
    return [...DEFAULT_PLACE_SUGGESTIONS];
  }
}
