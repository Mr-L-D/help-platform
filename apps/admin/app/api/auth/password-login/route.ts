import { NextResponse, type NextRequest } from 'next/server';

import { signToken } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { passwordLoginSchema, validateBody } from '@/lib/validation';

/** POST /api/auth/password-login — 用户名密码登录 */
export async function POST(request: NextRequest) {
  try {
    // 速率限制：每 IP 每分钟最多 5 次
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`password-login:${clientIp}`, 5, 60_000)) {
      return NextResponse.json(
        { code: 429, data: null, message: '请求过于频繁，请稍后再试' },
        { status: 429 },
      );
    }

    // zod 校验请求体
    const parsed = await validateBody(request, passwordLoginSchema);
    if (!parsed.success) return parsed.response;
    const { username, password } = parsed.data;

    const user = await prisma.user.findFirst({ where: { username } });
    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { code: 401, data: null, message: '用户名或密码错误' },
        { status: 401 },
      );
    }

    const token = await signToken({ userId: user.id, role: user.role });

    return NextResponse.json({
      code: 0,
      data: {
        token,
        user: { id: user.id, nickname: user.nickname, avatar: user.avatar, role: user.role },
      },
      message: 'ok',
    });
  } catch (error) {
    console.error('password-login:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}
