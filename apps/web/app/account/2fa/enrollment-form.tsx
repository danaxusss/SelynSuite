'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EnrollmentResult {
  recoveryCodes: string[];
}

export function TwoFactorEnrollmentForm({ secret, uri }: { secret: string; uri: string }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<EnrollmentResult | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/2fa/enroll-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, code }),
      });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const reason =
          (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
            ? body.message
            : null) ?? 'Code invalide.';
        setError(reason);
        return;
      }
      setResult(body as EnrollmentResult);
    } catch {
      setError('Erreur réseau. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-4">
        <p className="text-sm">
          2FA activée. Sauvegardez ces <strong>codes de récupération</strong> dans un gestionnaire
          de mots de passe — ils ne seront plus jamais affichés.
        </p>
        <ul className="bg-muted grid grid-cols-2 gap-2 rounded-md p-4 font-mono text-sm">
          {result.recoveryCodes.map((c) => (
            <li key={c} className="select-all">
              {c}
            </li>
          ))}
        </ul>
        <Button asChild className="w-full">
          <a href="/account">Retour au compte</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Code QR (otpauth)</Label>
        <p className="text-muted-foreground break-all rounded-md border p-3 font-mono text-xs">
          {uri}
        </p>
        <p className="text-muted-foreground text-xs">
          Astuce — Google Authenticator, 1Password, Bitwarden, Aegis lisent tous ce code.
        </p>
      </div>
      <form
        onSubmit={(e) => {
          void submit(e);
        }}
        className="space-y-3"
      >
        <div className="space-y-1">
          <Label htmlFor="code">Code à 6 chiffres</Label>
          <Input
            id="code"
            inputMode="numeric"
            pattern="\d{6}"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            autoFocus
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={submitting || code.length !== 6}>
          {submitting ? 'Vérification…' : 'Activer la 2FA'}
        </Button>
      </form>
    </div>
  );
}
