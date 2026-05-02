import { ApiHealthBadge } from '@/components/api-health-badge';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">
          Selyn Suite
        </p>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">SelynPaie</h1>
        <p className="text-muted-foreground text-pretty text-lg sm:text-xl">
          La paie marocaine, sans la complexité.
        </p>
      </div>

      <p className="text-muted-foreground max-w-xl text-sm">
        Bientôt disponible. Premier bulletin en moins de 15 minutes, mises à jour légales
        automatiques, sans consultant.
      </p>

      <ApiHealthBadge />
    </main>
  );
}
