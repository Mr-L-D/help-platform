import { NextResponse, type NextRequest } from 'next/server';

import { requireUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

/** GET /api/auth/me — 获取当前用户信息 */
export async function GET(request: NextRequest) {
  try {
    const payload = await requireUser(request).catch(() => null);
    if (!payload) {
      return NextResponse.json({ code: 401, data: null, message: '请先登录' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json({ code: 404, data: null, message: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json({
      code: 0,
      data: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone,
        role: user.role,
        points: user.points,
      },
      message: 'ok',
    });
  } catch (error) {
    console.error('me GET:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}

/** PUT /api/auth/me — 更新当前用户信息 */
export async function PUT(request: NextRequest) {
  try {
    const payload = await requireUser(request).catch(() => null);
    if (!payload) {
      return NextResponse.json({ code: 401, data: null, message: '请先登录' }, { status: 401 });
    }

    const body = await request.json();
    const data: Record<string, string> = {};
    if (body.nickname) data.nickname = body.nickname;
    if (body.avatar) data.avatar = body.avatar;
    if (body.phone) data.phone = body.phone;

    const user = await prisma.user.update({ where: { id: payload.userId }, data });

    return NextResponse.json({
      code: 0,
      data: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone,
        role: user.role,
        points: user.points,
      },
      message: 'ok',
    });
  } catch (error) {
    console.error('me PUT:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}
