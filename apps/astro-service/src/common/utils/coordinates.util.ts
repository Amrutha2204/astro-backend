import {
  ChartType,
  DEFAULT_COORDINATES,
  FALLBACK_CITY_COORDINATES,
} from '../constants/coordinates.constants';

export { ChartType } from '../constants/coordinates.constants';

const NOMINATIM_USER_AGENT = 'AstroService/1.0';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const GEOCODE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

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
