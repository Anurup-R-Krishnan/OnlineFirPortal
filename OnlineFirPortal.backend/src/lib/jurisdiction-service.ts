/**
 * Jurisdiction Routing Service
 *
 * Routes FIR locations to the correct police station using:
 * 1. Polygon containment (ray-casting algorithm) — highest confidence
 * 2. Haversine distance fallback — lower confidence
 * 3. Confidence scoring based on method and distance
 */

interface Point {
  lat: number;
  lng: number;
}

interface Station {
  id: string;
  name: string;
  polygon: [number, number][];
}

interface JurisdictionResult {
  stationId: string;
  stationName: string;
  confidence: number;
  method: 'polygon_match' | 'nearest_station';
  explanation: string;
  alternatives: Array<{
    stationId: string;
    stationName: string;
    distance: number;
    confidence: number;
  }>;
}

/**
 * Haversine distance between two points in kilometers
 */
export function haversineDistance(a: Point, b: Point): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Ray-casting algorithm for point-in-polygon test
 */
export function pointInPolygon(point: Point, polygon: [number, number][]): boolean {
  let inside = false;
  const { lat, lng } = point;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    if (
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Calculate polygon centroid (simple average of vertices)
 */
function polygonCentroid(polygon: [number, number][]): Point {
  const sum = polygon.reduce(
    (acc, [lng, lat]) => ({ lat: acc.lat + lat, lng: acc.lng + lng }),
    { lat: 0, lng: 0 }
  );
  return {
    lat: sum.lat / polygon.length,
    lng: sum.lng / polygon.length,
  };
}

/**
 * Route a location to the appropriate FIR station
 */
export function routeToFIRStation(
  location: Point,
  stations: Station[]
): JurisdictionResult {
  // Step 1: Check polygon containment
  for (const station of stations) {
    if (pointInPolygon(location, station.polygon)) {
      const alternatives = stations
        .filter((s) => s.id !== station.id)
        .map((s) => {
          const centroid = polygonCentroid(s.polygon);
          const distance = haversineDistance(location, centroid);
          return {
            stationId: s.id,
            stationName: s.name,
            distance: Math.round(distance * 100) / 100,
            confidence: Math.max(0.3, 1 - distance / 50),
          };
        })
        .sort((a, b) => a.distance - b.distance);

      return {
        stationId: station.id,
        stationName: station.name,
        confidence: 0.95,
        method: 'polygon_match',
        explanation: `Location falls within ${station.name}'s jurisdiction boundary.`,
        alternatives,
      };
    }
  }

  // Step 2: Nearest station fallback
  const candidates = stations.map((station) => {
    const centroid = polygonCentroid(station.polygon);
    const distance = haversineDistance(location, centroid);
    const confidence = Math.max(0.1, 1 - distance / 50);
    return {
      stationId: station.id,
      stationName: station.name,
      distance: Math.round(distance * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
    };
  });

  candidates.sort((a, b) => a.distance - b.distance);

  const best = candidates[0];
  const alternatives = candidates.slice(1);

  return {
    stationId: best.stationId,
    stationName: best.stationName,
    confidence: best.confidence,
    method: 'nearest_station',
    explanation: `No polygon match found. Routed to nearest station: ${best.stationName} (${best.distance} km).`,
    alternatives,
  };
}
