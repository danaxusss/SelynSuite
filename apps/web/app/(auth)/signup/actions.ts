'use server';

import { z } from 'zod';
import { signIn } from '@/auth';
import { apiFetch } from '@/lib/api';

const SignupForm = z.object({
  email: z.string().email().max(254),
  password: z.string().min(12).max(256),
  raisonSociale: z.string().min(1).max(200),
  formeJuridique: z.string().min(1),
});

export type SignupResult =
  | { ok: true }
  | { ok: false; reason: 'INVALID' | 'WEAK_PASSWORD' | 'EMAIL_TAKEN' | 'SIGNIN_FAILED' | 'SERVER' };

interface ApiSignupResponse {
  token: string;
  user: { id: string; email: string };
}

export async function signUp(form: FormData): Promise<SignupResult> {
  const parsed = SignupForm.safeParse({
    email: form.get('email'),
    password: form.get('password'),
    raisonSociale: form.get('raisonSociale'),
    formeJuridique: form.get('formeJuridique'),
  });
  if (!parsed.success) {
    const passwordIssue = parsed.error.issues.find((i) => i.path[0] === 'password');
    return { ok: false, reason: passwordIssue ? 'WEAK_PASSWORD' : 'INVALID' };
  }
  const result = await apiFetch<ApiSignupResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(parsed.data),
  });
  if (!result.ok) {
    if (result.status === 409) return { ok: false, reason: 'EMAIL_TAKEN' };
    if (result.status === 400) return { ok: false, reason: 'INVALID' };
    return { ok: false, reason: 'SERVER' };
  }
  // Account created; sign the user in via Auth.js so the session cookie
  // is set. signIn returns a Response we need to throw via redirect, but
  // here we let the calling page redirect after `ok: true`.
  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: 'SIGNIN_FAILED' };
  }
}
