import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/auth';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Me {
  user: {
    id: string;
    email: string;
    name: string | null;
    emailVerified: string | null;
    has2FA: boolean;
  };
  currentTenantId: string | null;
  role: string | null;
  mfaVerified: boolean;
  memberships: { tenantId: string; tenantName: string; role: string }[];
}

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user.id) redirect('/login');

  // Fetch the canonical /me from the API. Auth.js's session is a snapshot;
  // /me is the source of truth for memberships and 2FA state.
  const apiToken = await getApiToken();
  const result = apiToken
    ? await apiFetch<Me>('/me', { token: apiToken })
    : { ok: false as const, status: 0, body: null };

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mon compte</h1>
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/login' });
          }}
        >
          <Button type="submit" variant="outline" size="sm">
            Se déconnecter
          </Button>
        </form>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Informations de votre compte Selyn.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {result.ok ? (
            <>
              <Row label="E-mail">{result.data.user.email}</Row>
              <Row label="Société active">{result.data.currentTenantId ?? '—'}</Row>
              <Row label="Rôle">{result.data.role ?? '—'}</Row>
              <Row label="2FA">
                {result.data.user.has2FA ? (
                  <span className="text-emerald-600">Activée</span>
                ) : (
                  <span>
                    Non configurée —{' '}
                    <Link
                      href="/account/2fa"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      activer maintenant
                    </Link>
                  </span>
                )}
              </Row>
            </>
          ) : (
            <p className="text-muted-foreground">
              Impossible de charger votre profil. Reconnectez-vous.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vos sociétés</CardTitle>
          <CardDescription>Sociétés auxquelles vous avez accès.</CardDescription>
        </CardHeader>
        <CardContent>
          {result.ok && result.data.memberships.length > 0 ? (
            <ul className="divide-border divide-y text-sm">
              {result.data.memberships.map((m) => (
                <li key={m.tenantId} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium">{m.tenantName}</div>
                    <div className="text-muted-foreground text-xs">
                      {m.role} · {m.tenantId}
                    </div>
                  </div>
                  {result.data.currentTenantId === m.tenantId ? (
                    <span className="text-muted-foreground text-xs">Active</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">Aucune société.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

/**
 * Reads the Auth.js session cookie and returns it as a Bearer-able JWT.
 * Auth.js's encode/decode is configured to produce the same HS256 token
 * the API verifies, so the cookie value IS the API token.
 */
async function getApiToken(): Promise<string | null> {
  const { cookies } = await import('next/headers');
  const store = await cookies();
  const value =
    store.get('__Secure-authjs.session-token')?.value ??
    store.get('authjs.session-token')?.value ??
    null;
  return value;
}
