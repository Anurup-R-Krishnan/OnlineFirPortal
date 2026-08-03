'use client';

import { useState, useCallback } from 'react';

interface LocationPickerProps {
  onLocationConfirm: (data: {
    lat?: number;
    lng?: number;
    address?: string;
    method: 'map' | 'search' | 'manual';
  }) => void;
}

export function LocationPicker({ onLocationConfirm }: LocationPickerProps) {
  const [mode, setMode] = useState<'map' | 'manual'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handleMapLocation = useCallback((lat: number, lng: number) => {
    setSelectedCoords({ lat, lng });
    onLocationConfirm({ lat, lng, method: 'map' });
  }, [onLocationConfirm]);

  const handleManualSubmit = useCallback(() => {
    if (manualAddress.trim()) {
      onLocationConfirm({ address: manualAddress, method: 'manual' });
    }
  }, [manualAddress, onLocationConfirm]);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="location-search" className="block text-sm font-medium text-[hsl(var(--color-ink))]">
          Search Location
        </label>
        <input
          id="location-search"
          type="text"
          placeholder="Search location (e.g., 'Thiruvananthapuram Central Station')"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[hsl(var(--color-border))] px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('map')}
          className={`rounded-lg px-4 py-2 text-sm ${mode === 'map' ? 'bg-[hsl(var(--color-primary))] text-white' : 'border border-[hsl(var(--color-border))] text-[hsl(var(--color-ink-muted))]'}`}
        >
          Use Map
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`rounded-lg px-4 py-2 text-sm ${mode === 'manual' ? 'bg-[hsl(var(--color-primary))] text-white' : 'border border-[hsl(var(--color-border))] text-[hsl(var(--color-ink-muted))]'}`}
        >
          Enter Address Manually
        </button>
      </div>

      {mode === 'map' && (
        <div className="rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4">
          <p className="text-sm text-[hsl(var(--color-ink-muted))]">
            Map component loads here. Click to place a pin.
          </p>
          {selectedCoords && (
            <p className="mt-2 text-xs text-[hsl(var(--color-success))]">
              Selected: {selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}
            </p>
          )}
        </div>
      )}

      {mode === 'manual' && (
        <div className="space-y-3">
          <div>
            <label htmlFor="manual-address" className="block text-sm font-medium text-[hsl(var(--color-ink))]">
              Address
            </label>
            <textarea
              id="manual-address"
              rows={3}
              placeholder="Enter the address where the incident occurred"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[hsl(var(--color-border))] px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleManualSubmit}
            className="rounded-lg bg-[hsl(var(--color-primary))] px-4 py-2 text-sm text-white"
          >
            Confirm Address
          </button>
        </div>
      )}
    </div>
  );
}
