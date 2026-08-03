import { describe, it, expect, vi, beforeEach } from '@jest/globals';
import { geocodeAddress, reverseGeocode } from '../../../src/lib/geocoding-adapter';

describe('geocodeAddress', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should geocode a valid address', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{
        lat: '8.5241',
        lon: '76.9366',
        display_name: 'Thiruvananthapuram, Kerala, India',
      }],
    }));

    const result = await geocodeAddress('Thiruvananthapuram');
    expect(result).not.toBeNull();
    expect(result!.lat).toBeCloseTo(8.5241);
    expect(result!.lng).toBeCloseTo(76.9366);
    expect(result!.displayName).toContain('Thiruvananthapuram');
  });

  it('should return null when no results found', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }));

    const result = await geocodeAddress('nonexistentplace12345');
    expect(result).toBeNull();
  });

  it('should return null on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

    const result = await geocodeAddress('Thiruvananthapuram');
    expect(result).toBeNull();
  });
});

describe('reverseGeocode', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should reverse geocode valid coordinates', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        display_name: 'Thiruvananthapuram, Kerala, India',
      }),
    }));

    const result = await reverseGeocode(8.5241, 76.9366);
    expect(result).not.toBeNull();
    expect(result!.displayName).toContain('Thiruvananthapuram');
  });

  it('should return null on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

    const result = await reverseGeocode(8.5241, 76.9366);
    expect(result).toBeNull();
  });
});
