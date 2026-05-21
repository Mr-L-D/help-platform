import { USER_ROLE } from '@help-platform/shared';
import { NextResponse, type NextRequest } from 'next/server';

import { verifyToken, AuthError, type JwtPayload } from '@/lib/auth';

/**
 * 从请求 Authorization 头中提取用户信息。
 * 未登录或 token 无效均返回 null。
 */
async function getAuthUser(request: NextRequest): Promise<JwtPayload | null> {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    return await verifyToken(auth.slice(7));
  } catch {
    return null;
  }
}

/**
 * 从请求 Authorization 头中提取用户信息及具体错误原因。
 * 用于需要向客户端返回细分错误消息的场景（如 withUser / withAdmin）。
 */
async function getAuthUserWithError(
  request: NextRequest,
): Promise<{ payload: JwtPayload | null; error?: string }> {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return { payload: null, error: '请先登录' };
  try {
    return { payload: await verifyToken(auth.slice(7)) };
  } catch (e) {
    if (e instanceof AuthError) return { payload: null, error: e.message };
    return { payload: null, error: '登录信息无效' };
  }
}

/** 要求登录，未登录抛出 'Unauthorized' 错误（供程序化调用） */
export async function requireUser(request: NextRequest): Promise<JwtPayload> {
  const user = await getAuthUser(request);
  if (!user) throw new Error('Unauthorized');
  return user;
}

/** 要求管理员权限，非管理员抛出 'Forbidden' 错误（供程序化调用） */
export async function requireAdmin(request: NextRequest): Promise<JwtPayload> {
  const user = await requireUser(request);
  if (user.role !== USER_ROLE.ADMIN) throw new Error('Forbidden');
  return user;
}

/** 包装需要登录的路由处理函数，自动处理 401 并返回细分错误消息 */
export async function withUser(
  request: NextRequest,
  handler: (payload: JwtPayload) => Promise<NextResponse>,
) {
  const { payload, error } = await getAuthUserWithError(request);
  if (!payload) {
    return NextResponse.json(
      { code: 401, data: null, message: error || '请先登录' },
      { status: 401 },
    );
  }
  return handler(payload);
}

/** 包装需要管理员权限的路由处理函数，自动处理 401/403 并返回细分错误消息 */
export async function withAdmin(
  request: NextRequest,
  handler: (payload: JwtPayload) => Promise<NextResponse>,
) {
  const { payload, error } = await getAuthUserWithError(request);
  if (!payload) {
    return NextResponse.json(
      { code: 401, data: null, message: error || '请先登录' },
      { status: 401 },
    );
  }
  if (payload.role !== USER_ROLE.ADMIN) {
    return NextResponse.json({ code: 403, data: null, message: '无权限' }, { status: 403 });
  }
  return handler(payload);
}
