import type { NextRequest } from 'next/server';

import { verifyToken, type JwtPayload } from '@/lib/auth';

export async function getAuthUser(request: NextRequest): Promise<JwtPayload | null> {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    return await verifyToken(auth.slice(7));
  } catch {
    return null;
  }
}

export async function requireUser(request: NextRequest): Promise<JwtPayload> {
  const user = await getAuthUser(request);
  if (!user) throw new Error('Unauthorized');
  return user;
}

export async function requireAdmin(request: NextRequest): Promise<JwtPayload> {
  const user = await requireUser(request);
  if (user.role !== 'ADMIN') throw new Error('Forbidden');
  return user;
}
