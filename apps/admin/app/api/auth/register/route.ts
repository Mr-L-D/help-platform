import { NextResponse, type NextRequest } from 'next/server';

import { signToken } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { registerSchema, validateBody } from '@/lib/validation';

/** POST /api/auth/register — 用户名密码注册 */
export async function POST(request: NextRequest) {
  try {
    // 速率限制：每 IP 每分钟最多 3 次
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`register:${clientIp}`, 3, 60_000)) {
      return NextResponse.json(
        { code: 429, data: null, message: '请求过于频繁，请稍后再试' },
        { status: 429 },
      );
    }

    // zod 校验请求体（含正则用户名和密码长度）
    const parsed = await validateBody(request, registerSchema);
    if (!parsed.success) return parsed.response;
    const { username, password } = parsed.data;

    const existing = await prisma.user.findFirst({ where: { username } });
    if (existing) {
      return NextResponse.json(
        { code: 422, data: null, message: '用户名已被占用' },
        { status: 422 },
      );
    }

    const user = await prisma.user.create({
      data: { username, nickname: username, avatar: '', passwordHash: hashPassword(password) },
    });

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
    console.error('register:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}
