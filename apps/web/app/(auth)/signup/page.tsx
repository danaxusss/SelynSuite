import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUp } from './actions';

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function SignupPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const error = mapError(sp.error);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Créer un compte</CardTitle>
          <CardDescription>Selyn Suite — gérez la paie, sans la complexité.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async (data) => {
              'use server';
              const result = await signUp(data);
              if (!result.ok) {
                redirect(`/signup?error=${encodeURIComponent(result.reason)}`);
              }
              redirect('/account');
            }}
            className="space-y-4"
          >
            <Field id="email" label="Adresse e-mail" type="email" autoComplete="email" />
            <Field
              id="password"
              label="Mot de passe (12 caractères minimum)"
              type="password"
              autoComplete="new-password"
              minLength={12}
            />
            <Field id="raisonSociale" label="Raison sociale" />
            <div className="space-y-1">
              <Label htmlFor="formeJuridique">Forme juridique</Label>
              <select
                id="formeJuridique"
                name="formeJuridique"
                required
                defaultValue="SARL"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                {FORMES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full">
              Créer le compte
            </Button>
          </form>
          <p className="text-muted-foreground mt-6 text-center text-sm">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

function Field({
  id,
  label,
  type = 'text',
  autoComplete,
  minLength,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  minLength?: number;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type={type}
        required
        autoComplete={autoComplete}
        minLength={minLength}
      />
    </div>
  );
}

const FORMES = [
  'SARL',
  'SARL_AU',
  'SA',
  'SAS',
  'SNC',
  'SCS',
  'SCA',
  'EI',
  'AUTO_ENTREPRENEUR',
  'ASSOCIATION',
  'COOPERATIVE',
  'AUTRE',
] as const;

function mapError(code: string | undefined): string | null {
  switch (code) {
    case 'EMAIL_TAKEN':
      return 'Cet e-mail est déjà utilisé.';
    case 'WEAK_PASSWORD':
      return 'Le mot de passe doit contenir au moins 12 caractères.';
    case 'SIGNIN_FAILED':
      return 'Compte créé, mais la connexion automatique a échoué. Connectez-vous.';
    case 'INVALID':
      return 'Vérifiez les informations saisies.';
    case 'SERVER':
      return 'Erreur serveur. Réessayez dans un instant.';
    default:
      return null;
  }
}
