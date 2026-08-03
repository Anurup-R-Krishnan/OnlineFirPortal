import { routeToFIRStation } from '../../../src/lib/jurisdiction-service';

const mockStations = [
  {
    id: 'station-1',
    name: 'Thiruvananthapuram City Central',
    polygon: [
      [76.9, 8.48], [76.95, 8.48], [76.95, 8.52], [76.9, 8.52], [76.9, 8.48]
    ],
  },
  {
    id: 'station-2',
    name: 'Neyyattinkara Station',
    polygon: [
      [76.95, 8.4], [77.0, 8.4], [77.0, 8.45], [76.95, 8.45], [76.95, 8.4]
    ],
  },
];

describe('routeToFIRStation', () => {
  it('should match a point inside a polygon with high confidence', () => {
    const result = routeToFIRStation({ lat: 8.50, lng: 76.92 }, mockStations);
    expect(result.stationId).toBe('station-1');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    expect(result.method).toBe('polygon_match');
    expect(result.alternatives).toHaveLength(1);
  });

  it('should use nearest-station fallback for points outside all polygons', () => {
    const result = routeToFIRStation({ lat: 8.3, lng: 76.8 }, mockStations);
    expect(result.method).toBe('nearest_station');
    expect(result.confidence).toBeLessThan(0.8);
    expect(result.explanation).toContain('nearest');
  });

  it('should return low confidence when point is far from all stations', () => {
    const result = routeToFIRStation({ lat: 10.0, lng: 78.0 }, mockStations);
    expect(result.confidence).toBeLessThan(0.5);
  });

  it('should include all candidates sorted by distance', () => {
    const result = routeToFIRStation({ lat: 8.50, lng: 76.92 }, mockStations);
    expect(result.alternatives).toHaveLength(1);
    expect(result.alternatives[0].stationId).toBe('station-2');
  });
});
