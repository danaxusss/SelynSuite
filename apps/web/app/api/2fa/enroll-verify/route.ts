import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';

interface EnrollVerifyResponse {
  recoveryCodes: string[];
}

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const store = await cookies();
  const token =
    store.get('__Secure-authjs.session-token')?.value ??
    store.get('authjs.session-token')?.value ??
    null;
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.text();
  const result = await apiFetch<EnrollVerifyResponse>('/auth/2fa/enroll-verify', {
    method: 'POST',
    body,
    token,
  });
  if (!result.ok) {
    return NextResponse.json(
      result.body && typeof result.body === 'object' ? result.body : { message: 'Failed' },
      { status: result.status || 502 },
    );
  }
  return NextResponse.json(result.data);
}
