import Link from 'next/link';
import { LoginForm } from './login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Se connecter</CardTitle>
          <CardDescription>Bienvenue. Entrez vos identifiants Selyn.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm next={sp.next ?? '/account'} initialError={sp.error ?? null} />
          <p className="text-muted-foreground mt-6 text-center text-sm">
            Pas encore de compte ?{' '}
            <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
              Créer un compte
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
