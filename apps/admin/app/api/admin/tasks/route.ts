import { NextResponse, type NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

/** GET /api/admin/tasks — 管理端任务列表 */
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
    const type = params.get('type') || undefined;
    const status = params.get('status') || undefined;
    const publisherName = params.get('publisherName') || undefined;

    const where: Record<string, unknown> = {};
    if (keyword) where.title = { contains: keyword };
    if (type) where.type = type;
    if (status) where.status = status;
    if (publisherName) where.publisher = { nickname: { contains: publisherName } };

    const [list, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          category: true,
          publisher: { select: { id: true, nickname: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.task.count({ where }),
    ]);

    return NextResponse.json({ code: 0, data: { list, total, page, pageSize }, message: 'ok' });
  } catch (error) {
    console.error('admin tasks GET:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}
