import { NextResponse, type NextRequest } from 'next/server';

import { signToken } from '@/lib/auth';
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

    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || '123456';

    if (username !== adminUser || password !== adminPass) {
      return NextResponse.json(
        { code: 401, data: null, message: '用户名或密码错误' },
        { status: 401 },
      );
    }

    let user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!user) {
      user = await prisma.user.create({ data: { nickname: '管理员', avatar: '', role: 'ADMIN' } });
    }

    const token = await signToken({ userId: user.id, role: user.role });

    return NextResponse.json({
      code: 0,
      data: { token, user: { id: user.id, nickname: user.nickname, role: user.role } },
      message: 'ok',
    });
  } catch (error) {
    console.error('admin-login:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}
