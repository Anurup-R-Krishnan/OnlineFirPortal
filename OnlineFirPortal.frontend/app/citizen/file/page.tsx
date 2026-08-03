'use client';

import { useState } from 'react';
import { LocationPicker } from '../../../components/domain/location-picker';
import { StationRecommendation } from '../../../components/domain/station-recommendation';

type Step = 1 | 2 | 3 | 4 | 5;

interface FIRData {
  incidentDate: string;
  incidentTime: string;
  incidentType: string;
  description: string;
  location: { lat?: number; lng?: number; address?: string; method: string } | null;
  station: { stationId: string; stationName: string; confidence: number } | null;
}

const INCIDENT_TYPES = [
  'Theft', 'Burglary', 'Assault', 'Accident', 'Fraud',
  'Cybercrime', 'Missing Person', 'Domestic Violence', 'Property Damage', 'Other',
];

const STEP_LABELS = ['Incident Details', 'Location', 'Station', 'Review', 'Confirmation'];

export default function FileFIR() {
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<FIRData>({
    incidentDate: '', incidentTime: '', incidentType: '', description: '',
    location: null, station: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [firNumber, setFirNumber] = useState<string | null>(null);

  const canNext = (): boolean => {
    switch (step) {
      case 1: return Boolean(data.incidentDate && data.incidentType && data.description);
      case 2: return data.location !== null;
      case 3: return data.station !== null;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    // Simulate submission (real API call would go here)
    await new Promise(r => setTimeout(r, 1500));
    setFirNumber(`FIR-${new Date().getFullYear()}-IN-${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`);
    setSubmitting(false);
    setStep(5);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Step indicator */}
      <nav aria-label="Filing progress" className="flex items-center justify-between">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
              step > i + 1 ? 'bg-[hsl(var(--color-success))] text-white' :
              step === i + 1 ? 'bg-[hsl(var(--color-primary))] text-white' :
              'bg-[hsl(var(--color-border))] text-[hsl(var(--color-ink-muted))]'
            }`}>
              {step > i + 1 ? '✓' : i + 1}
            </span>
            {i < STEP_LABELS.length - 1 && <div className="mx-2 h-px w-8 bg-[hsl(var(--color-border))]" />}
          </div>
        ))}
      </nav>

      <h2 className="text-xl font-semibold text-[hsl(var(--color-ink))]">{STEP_LABELS[step - 1]}</h2>

      {/* Step 1: Incident Details */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-[hsl(var(--color-ink))]">Date of Incident</label>
              <input id="date" type="date" value={data.incidentDate}
                onChange={e => setData(d => ({ ...d, incidentDate: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[hsl(var(--color-border))] px-3 py-2 text-sm" />
            </div>
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-[hsl(var(--color-ink))]">Time (approx.)</label>
              <input id="time" type="time" value={data.incidentTime}
                onChange={e => setData(d => ({ ...d, incidentTime: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[hsl(var(--color-border))] px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-[hsl(var(--color-ink))]">Incident Type</label>
            <select id="type" value={data.incidentType}
              onChange={e => setData(d => ({ ...d, incidentType: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[hsl(var(--color-border))] px-3 py-2 text-sm">
              <option value="">Select type</option>
              {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="desc" className="block text-sm font-medium text-[hsl(var(--color-ink))]">Description</label>
            <textarea id="desc" rows={4} value={data.description}
              onChange={e => setData(d => ({ ...d, description: e.target.value }))}
              placeholder="Describe what happened..."
              className="mt-1 w-full rounded-lg border border-[hsl(var(--color-border))] px-3 py-2 text-sm" />
          </div>
        </div>
      )}

      {/* Step 2: Location */}
      {step === 2 && (
        <LocationPicker onLocationConfirm={(loc) => setData(d => ({ ...d, location: loc }))} />
      )}

      {/* Step 3: Station Recommendation */}
      {step === 3 && (
        <div className="space-y-4">
          <StationRecommendation
            stationName="Thiruvananthapuram City Central"
            confidence={0.92}
            method="polygon_match"
            explanation="Location falls within this station's jurisdiction boundary."
            alternatives={[
              { stationId: 'stn-fort', stationName: 'Fort Station', distance: 2.1, confidence: 0.65 },
            ]}
            onStationSelect={(id) => setData(d => ({ ...d, station: { stationId: id, stationName: id, confidence: 0.5 } }))}
          />
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="space-y-3 rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-raised))] p-4">
          <h3 className="font-semibold text-[hsl(var(--color-ink))]">Review Your FIR</h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-[hsl(var(--color-ink-muted))]">Date:</dt>
            <dd className="text-[hsl(var(--color-ink))]">{data.incidentDate}</dd>
            <dt className="text-[hsl(var(--color-ink-muted))]">Type:</dt>
            <dd className="text-[hsl(var(--color-ink))]">{data.incidentType}</dd>
            <dt className="text-[hsl(var(--color-ink-muted))]">Description:</dt>
            <dd className="text-[hsl(var(--color-ink))]">{data.description}</dd>
            <dt className="text-[hsl(var(--color-ink-muted))]">Station:</dt>
            <dd className="text-[hsl(var(--color-ink))]">{data.station?.stationName}</dd>
          </dl>
        </div>
      )}

      {/* Step 5: Confirmation */}
      {step === 5 && firNumber && (
        <div className="rounded-lg border border-[hsl(var(--color-success))] bg-[hsl(var(--color-primary-light))] p-6 text-center">
          <h3 className="text-lg font-semibold text-[hsl(var(--color-ink))]">FIR Submitted Successfully</h3>
          <p className="mt-2 font-mono text-2xl font-bold text-[hsl(var(--color-primary))]">{firNumber}</p>
          <p className="mt-2 text-sm text-[hsl(var(--color-ink-muted))]">
            Your FIR has been routed to {data.station?.stationName}. You will receive updates on its progress.
          </p>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between">
        {step > 1 && step < 5 && (
          <button type="button" onClick={() => setStep(s => (s - 1) as Step)}
            className="rounded-lg border border-[hsl(var(--color-border))] px-4 py-2 text-sm text-[hsl(var(--color-ink))]">
            Back
          </button>
        )}
        {step < 4 && (
          <button type="button" onClick={() => setStep(s => (s + 1) as Step)} disabled={!canNext()}
            className="ml-auto rounded-lg bg-[hsl(var(--color-primary))] px-4 py-2 text-sm text-white disabled:opacity-50">
            Next
          </button>
        )}
        {step === 4 && (
          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="ml-auto rounded-lg bg-[hsl(var(--color-primary))] px-6 py-2 text-sm text-white disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit FIR'}
          </button>
        )}
      </div>
    </div>
  );
}
