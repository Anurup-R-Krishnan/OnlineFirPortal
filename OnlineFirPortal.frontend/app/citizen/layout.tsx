import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Online FIR Portal - Citizen Services',
  description: 'File and track First Information Reports online',
};

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[hsl(var(--color-surface))]">
      <header className="border-b border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-raised))]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/citizen" className="text-xl font-semibold text-[hsl(var(--color-ink))]">
            <span className="text-[hsl(var(--color-primary))]">Kerala</span> FIR Portal
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/citizen/file" className="text-[hsl(var(--color-ink-muted))] hover:text-[hsl(var(--color-ink))]">
              File FIR
            </Link>
            <Link href="/citizen/track" className="text-[hsl(var(--color-ink-muted))] hover:text-[hsl(var(--color-ink))]">
              Track Status
            </Link>
            <Link href="/citizen/notifications" className="text-[hsl(var(--color-ink-muted))] hover:text-[hsl(var(--color-ink))]">
              Notifications
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
