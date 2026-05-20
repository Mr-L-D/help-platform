import { NextResponse, type NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

/** GET /api/admin/users — 用户列表 */
export async function GET(request: NextRequest) {
  try {
    const payload = await requireAdmin(request).catch(() => null);
    if (!payload) {
      return NextResponse.json({ code: 403, data: null, message: '无权限' }, { status: 403 });
    }

    const params = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get('page') || '1'));
    const pageSize = Math.min(50, Math.max(1, parseInt(params.get('pageSize') || '10')));
    const keyword = params.get('keyword') || undefined;

    const where: Record<string, unknown> = {};
    if (keyword) {
      where.OR = [{ nickname: { contains: keyword } }, { username: { contains: keyword } }];
    }

    const [list, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          nickname: true,
          username: true,
          avatar: true,
          phone: true,
          role: true,
          points: true,
          createdAt: true,
          _count: { select: { publishedTasks: true, orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ code: 0, data: { list, total, page, pageSize }, message: 'ok' });
  } catch (error) {
    console.error('admin users GET:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}
