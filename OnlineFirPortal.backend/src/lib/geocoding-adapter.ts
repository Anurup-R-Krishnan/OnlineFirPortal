/**
 * Geocoding Adapter
 *
 * Converts text addresses to coordinates using Nominatim (OpenStreetMap).
 * Includes in-memory cache to avoid repeated API calls.
 * Graceful fallback: returns null on any failure.
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

// Simple in-memory cache (address → result)
const cache = new Map<string, GeocodeResult>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  const normalizedQuery = query.trim().toLowerCase();

  // Check cache
  const cached = cache.get(normalizedQuery);
  const cachedTime = cacheTimestamps.get(normalizedQuery);
  if (cached && cachedTime && Date.now() - cachedTime < CACHE_TTL) {
    return cached;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'OnlineFIRPortal/1.0 (demonstration)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const result: GeocodeResult = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    };

    // Cache the result
    cache.set(normalizedQuery, result);
    cacheTimestamps.set(normalizedQuery, Date.now());

    return result;
  } catch {
    return null;
  }
}

/**
 * Reverse geocode: convert coordinates to address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
  const cacheKey = `reverse:${lat},${lng}`;
  const cached = cache.get(cacheKey);
  const cachedTime = cacheTimestamps.get(cacheKey);
  if (cached && cachedTime && Date.now() - cachedTime < CACHE_TTL) {
    return cached;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'OnlineFIRPortal/1.0 (demonstration)' },
    });
    if (!res.ok) return null;
    const data = await res.json();

    const result: GeocodeResult = {
      lat,
      lng,
      displayName: data.display_name || `${lat}, ${lng}`,
    };

    cache.set(cacheKey, result);
    cacheTimestamps.set(cacheKey, Date.now());

    return result;
  } catch {
    return null;
  }
}
