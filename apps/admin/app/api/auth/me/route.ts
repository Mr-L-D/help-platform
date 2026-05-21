import { NextResponse, type NextRequest } from 'next/server';

import { withUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { sanitizeUser } from '@/lib/user-utils';

/** 中国大陆手机号正则 */
const PHONE_RE = /^1[3-9]\d{9}$/;

/** GET /api/auth/me — 获取当前用户信息 */
export async function GET(request: NextRequest) {
  try {
    return withUser(request, async (payload) => {
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) {
        return NextResponse.json({ code: 404, data: null, message: '用户不存在' }, { status: 404 });
      }

      return NextResponse.json({
        code: 0,
        data: sanitizeUser(user),
        message: 'ok',
      });
    });
  } catch (error) {
    console.error('me GET:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}

/** PUT /api/auth/me — 更新当前用户信息 */
export async function PUT(request: NextRequest) {
  try {
    return withUser(request, async (payload) => {
      const body = await request.json();
      const data: Record<string, string> = {};
      if (body.nickname) data.nickname = body.nickname;
      if (body.avatar) data.avatar = body.avatar;
      if (body.phone) {
        if (!PHONE_RE.test(body.phone)) {
          return NextResponse.json(
            { code: 422, data: null, message: '手机号格式不正确' },
            { status: 422 },
          );
        }
        data.phone = body.phone;
      }

      const user = await prisma.user.update({ where: { id: payload.userId }, data });

      return NextResponse.json({
        code: 0,
        data: sanitizeUser(user),
        message: 'ok',
      });
    });
  } catch (error) {
    console.error('me PUT:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}
