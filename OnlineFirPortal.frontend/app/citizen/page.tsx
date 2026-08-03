import Link from 'next/link';

export default function CitizenHome() {
  return (
    <div className="space-y-8">
      <section className="text-center">
        <h1 className="text-3xl font-bold text-[hsl(var(--color-ink))]">
          File Your First Information Report
        </h1>
        <p className="mt-3 text-[hsl(var(--color-ink-muted))]">
          Report an incident securely. Your FIR will be routed to the correct police station automatically.
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/citizen/file"
          className="block rounded-[hsl(var(--radius-lg))] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-raised))] p-8 shadow-[hsl(var(--shadow-sm))] transition-shadow hover:shadow-[hsl(var(--shadow-md))]"
        >
          <h2 className="text-xl font-semibold text-[hsl(var(--color-primary))]">File a New FIR</h2>
          <p className="mt-2 text-sm text-[hsl(var(--color-ink-muted))]">
            Complete the guided form to submit your report. Location and station routing are handled automatically.
          </p>
        </Link>

        <Link
          href="/citizen/track"
          className="block rounded-[hsl(var(--radius-lg))] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-raised))] p-8 shadow-[hsl(var(--shadow-sm))] transition-shadow hover:shadow-[hsl(var(--shadow-md))]"
        >
          <h2 className="text-xl font-semibold text-[hsl(var(--color-primary))]">Track Your FIR</h2>
          <p className="mt-2 text-sm text-[hsl(var(--color-ink-muted))]">
            Enter your FIR number to view the current status and updates on your case.
          </p>
        </Link>
      </div>

      <section className="rounded-[hsl(var(--radius-lg))] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-raised))] p-6">
        <h2 className="font-semibold text-[hsl(var(--color-ink))]">How It Works</h2>
        <ol className="mt-3 space-y-2 text-sm text-[hsl(var(--color-ink-muted))]">
          <li>1. Enter your incident details and location</li>
          <li>2. The system recommends the correct police station</li>
          <li>3. Your FIR is submitted and assigned a tracking number</li>
          <li>4. Track progress through the status dashboard</li>
        </ol>
      </section>
    </div>
  );
}
