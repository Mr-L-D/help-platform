import { USER_ROLE } from '@help-platform/shared';
import { NextResponse, type NextRequest } from 'next/server';

import { signToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

/** POST /api/auth/admin/login — 管理员登录 */
export async function POST(request: NextRequest) {
  try {
    // 速率限制：每 IP 每分钟最多 5 次
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`admin-login:${clientIp}`, 5, 60_000)) {
      return NextResponse.json(
        { code: 429, data: null, message: '请求过于频繁，请稍后再试' },
        { status: 429 },
      );
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { code: 422, data: null, message: '用户名和密码不能为空' },
        { status: 422 },
      );
    }

    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || '123456';

    // 生产环境必须显式配置凭据，防止默认值泄露
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
        console.error('[admin-login] 生产环境未设置 ADMIN_USERNAME / ADMIN_PASSWORD');
        return NextResponse.json(
          { code: 500, data: null, message: '服务器配置错误' },
          { status: 500 },
        );
      }
    }

    if (username !== adminUser || password !== adminPass) {
      return NextResponse.json(
        { code: 401, data: null, message: '用户名或密码错误' },
        { status: 401 },
      );
    }

    let user = await prisma.user.findFirst({ where: { role: USER_ROLE.ADMIN } });
    if (!user) {
      user = await prisma.user.create({
        data: { nickname: '管理员', avatar: '', role: USER_ROLE.ADMIN },
      });
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
