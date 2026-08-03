export default async function FIRDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[hsl(var(--color-ink))]">FIR Details</h1>
      <div className="rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-raised))] p-4">
        <p className="font-mono text-lg font-bold text-[hsl(var(--color-primary))]">{decodeURIComponent(id)}</p>
        <p className="mt-2 text-sm text-[hsl(var(--color-ink-muted))]">
          Detailed case information and timeline will be displayed here.
        </p>
      </div>
    </div>
  );
}
