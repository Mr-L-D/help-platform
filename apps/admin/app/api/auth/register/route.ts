import { NextResponse, type NextRequest } from 'next/server';

import { signToken } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
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

    if (!/^[a-zA-Z0-9]{4,20}$/.test(username)) {
      return NextResponse.json(
        { code: 422, data: null, message: '用户名需为4-20位字母数字' },
        { status: 422 },
      );
    }

    if (password.length < 6 || password.length > 32) {
      return NextResponse.json(
        { code: 422, data: null, message: '密码需为6-32位' },
        { status: 422 },
      );
    }

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
