import { NextResponse, type NextRequest } from 'next/server';

import { signToken } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { code: 422, data: null, message: '用户名和密码不能为空' },
        { status: 422 },
      );
    }

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
