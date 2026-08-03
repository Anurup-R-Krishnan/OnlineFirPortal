'use client';

import { useState } from 'react';

interface StationCandidate {
  stationId: string;
  stationName: string;
  distance: number;
  confidence: number;
}

interface StationRecommendationProps {
  stationName: string;
  confidence: number;
  method: string;
  explanation: string;
  alternatives: StationCandidate[];
  onStationSelect: (stationId: string) => void;
}

export function StationRecommendation({
  stationName,
  confidence,
  method,
  explanation,
  alternatives,
  onStationSelect,
}: StationRecommendationProps) {
  const [showOverride, setShowOverride] = useState(false);
  const confidencePercent = Math.round(confidence * 100);

  return (
    <div className="space-y-4 rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-raised))] p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-[hsl(var(--color-ink))]">{stationName}</h3>
          <p className="mt-1 text-sm text-[hsl(var(--color-ink-muted))]">{explanation}</p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${
              confidence >= 0.8 ? 'bg-[hsl(var(--color-success))]' :
              confidence >= 0.5 ? 'bg-[hsl(var(--color-warning))]' :
              'bg-[hsl(var(--color-danger))]'
            }`}
          />
          <span className="text-sm font-medium text-[hsl(var(--color-ink))]">{confidencePercent}%</span>
        </div>
      </div>

      <div className="text-xs text-[hsl(var(--color-ink-muted))]">
        Method: {method === 'polygon_match' ? 'Boundary match' : 'Nearest station'}
      </div>

      {!showOverride && alternatives.length > 0 && (
        <button
          type="button"
          onClick={() => setShowOverride(true)}
          className="text-sm text-[hsl(var(--color-primary))] underline"
        >
          This station is incorrect. Choose a different one.
        </button>
      )}

      {showOverride && (
        <div className="space-y-2 border-t border-[hsl(var(--color-border))] pt-3">
          <p className="text-sm font-medium text-[hsl(var(--color-ink))]">Select correct station:</p>
          {alternatives.map((alt) => (
            <button
              key={alt.stationId}
              type="button"
              onClick={() => onStationSelect(alt.stationId)}
              className="block w-full rounded border border-[hsl(var(--color-border))] px-3 py-2 text-left text-sm hover:bg-[hsl(var(--color-primary-light))]"
            >
              {alt.stationName} ({Math.round(alt.confidence * 100)}% confidence, {alt.distance.toFixed(1)} km)
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
