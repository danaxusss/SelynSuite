import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TwoFactorEnrollmentForm } from './enrollment-form';

interface EnrollStartResponse {
  secret: string;
  uri: string;
}

export default async function TwoFactorPage() {
  const session = await auth();
  if (!session?.user.id) redirect('/login');

  const token = await getApiToken();
  if (!token) redirect('/login');

  const start = await apiFetch<EnrollStartResponse>('/auth/2fa/enroll-start', {
    method: 'POST',
    token,
  });

  if (!start.ok) {
    return (
      <main className="mx-auto max-w-xl px-6 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Activer la 2FA</CardTitle>
            <CardDescription>
              Impossible de générer un code d&apos;activation. Réessayez plus tard.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Activer la 2FA</CardTitle>
          <CardDescription>
            Scannez le code QR avec votre application d&apos;authentification, puis confirmez avec
            un code à 6 chiffres.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TwoFactorEnrollmentForm secret={start.data.secret} uri={start.data.uri} />
        </CardContent>
      </Card>
    </main>
  );
}

async function getApiToken(): Promise<string | null> {
  const store = await cookies();
  return (
    store.get('__Secure-authjs.session-token')?.value ??
    store.get('authjs.session-token')?.value ??
    null
  );
}
