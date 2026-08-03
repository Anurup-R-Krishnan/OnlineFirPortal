'use client';

import { useEffect, useRef } from 'react';

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialCenter?: [number, number];
}

export function MapPicker({ onLocationSelect, initialCenter = [76.9366, 8.5241] }: MapPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let mounted = true;

    const initMap = async () => {
      const maplibregl = await import('maplibre-gl');

      if (!mounted || !mapContainer.current) return;

      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://tiles.openfreemap.org/style/liberty',
        center: initialCenter,
        zoom: 12,
      });

      map.addControl(new maplibregl.NavigationControl(), 'top-right');

      let marker: maplibregl.Marker | null = null;

      map.on('click', (e: { lngLat: { lat: number; lng: number } }) => {
        const { lat, lng } = e.lngLat;

        if (marker) marker.remove();

        marker = new maplibregl.Marker({ color: 'hsl(152, 40%, 35%)' })
          .setLngLat([lng, lat])
          .addTo(map);

        onLocationSelect(lat, lng);
      });

      mapRef.current = map;
    };

    initMap();

    return () => {
      mounted = false;
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
  }, [initialCenter, onLocationSelect]);

  return (
    <div className="space-y-2">
      <p className="text-sm text-[hsl(var(--color-ink-muted))]">
        Click on the map to select the incident location.
      </p>
      <div
        ref={mapContainer}
        className="h-64 w-full rounded-lg border border-[hsl(var(--color-border))]"
      />
    </div>
  );
}
