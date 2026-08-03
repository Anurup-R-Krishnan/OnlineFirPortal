import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { geocodeAddress, reverseGeocode, clearCache } from '../../../src/lib/geocoding-adapter';

describe('geocodeAddress', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    clearCache();
  });

  it('should geocode a valid address', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [{
        lat: '8.5241',
        lon: '76.9366',
        display_name: 'Thiruvananthapuram, Kerala, India',
      }],
    } as Response);

    const result = await geocodeAddress('Thiruvananthapuram');
    expect(result).not.toBeNull();
    expect(result!.lat).toBeCloseTo(8.5241);
    expect(result!.lng).toBeCloseTo(76.9366);
    expect(result!.displayName).toContain('Thiruvananthapuram');
  });

  it('should return null when no results found', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);

    const result = await geocodeAddress('nonexistentplace12345');
    expect(result).toBeNull();
  });

  it('should return null on fetch failure', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network error'));

    const result = await geocodeAddress('Thiruvananthapuram');
    expect(result).toBeNull();
  });
});

describe('reverseGeocode', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    clearCache();
  });

  it('should reverse geocode valid coordinates', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        display_name: 'Thiruvananthapuram, Kerala, India',
      }),
    } as Response);

    const result = await reverseGeocode(8.5241, 76.9366);
    expect(result).not.toBeNull();
    expect(result!.displayName).toContain('Thiruvananthapuram');
  });

  it('should return null on failure', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network error'));

    const result = await reverseGeocode(8.5241, 76.9366);
    expect(result).toBeNull();
  });
});
