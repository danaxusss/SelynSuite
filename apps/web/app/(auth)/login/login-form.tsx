'use client';

import { useState, type FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Stage = 'credentials' | 'totp' | 'recovery';

export function LoginForm({ next, initialError }: { next: string; initialError: string | null }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [error, setError] = useState<string | null>(initialError);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        totpCode: stage === 'totp' ? totpCode : undefined,
        recoveryCode: stage === 'recovery' ? recoveryCode : undefined,
        redirect: false,
      });
      if (!result || result.error) {
        const reason = (result?.error ?? '').toUpperCase();
        if (reason.includes('TOTP_REQUIRED')) {
          setStage('totp');
        } else if (reason.includes('TOTP_INVALID')) {
          setError('Code TOTP invalide.');
        } else if (reason.includes('RECOVERY_INVALID')) {
          setError('Code de récupération invalide ou déjà utilisé.');
        } else {
          setError('E-mail ou mot de passe incorrect.');
        }
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError('Erreur réseau. Réessayez dans un instant.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        void submit(e);
      }}
      className="space-y-4"
    >
      <div className="space-y-1">
        <Label htmlFor="email">Adresse e-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={stage !== 'credentials'}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={stage !== 'credentials'}
        />
      </div>

      {stage === 'totp' && (
        <div className="space-y-1">
          <Label htmlFor="totp">Code de votre application 2FA</Label>
          <Input
            id="totp"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            autoFocus
          />
          <button
            type="button"
            onClick={() => setStage('recovery')}
            className="text-muted-foreground text-xs underline-offset-4 hover:underline"
          >
            Utiliser un code de récupération à la place
          </button>
        </div>
      )}

      {stage === 'recovery' && (
        <div className="space-y-1">
          <Label htmlFor="recovery">Code de récupération</Label>
          <Input
            id="recovery"
            value={recoveryCode}
            onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            required
            autoFocus
          />
          <button
            type="button"
            onClick={() => setStage('totp')}
            className="text-muted-foreground text-xs underline-offset-4 hover:underline"
          >
            Revenir au code TOTP
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Connexion…' : 'Se connecter'}
      </Button>
    </form>
  );
}
