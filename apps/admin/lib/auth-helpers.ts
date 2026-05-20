import type { NextRequest } from 'next/server';

import { verifyToken, type JwtPayload } from '@/lib/auth';

/** 从请求 Authorization 头中提取用户信息，未登录返回 null */
export async function getAuthUser(request: NextRequest): Promise<JwtPayload | null> {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    return await verifyToken(auth.slice(7));
  } catch {
    return null;
  }
}

/** 要求登录，未登录抛出 'Unauthorized' 错误 */
export async function requireUser(request: NextRequest): Promise<JwtPayload> {
  const user = await getAuthUser(request);
  if (!user) throw new Error('Unauthorized');
  return user;
}

/** 要求管理员权限，非管理员抛出 'Forbidden' 错误 */
export async function requireAdmin(request: NextRequest): Promise<JwtPayload> {
  const user = await requireUser(request);
  if (user.role !== 'ADMIN') throw new Error('Forbidden');
  return user;
}
