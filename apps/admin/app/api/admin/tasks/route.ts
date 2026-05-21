import type { TASK_TYPE, TASK_STATUS } from '@help-platform/shared';
import type { Prisma } from '@prisma/client';
import { NextResponse, type NextRequest } from 'next/server';

import { withAdmin } from '@/lib/auth-helpers';
import { parsePagination } from '@/lib/pagination';
import { prisma } from '@/lib/prisma';

/** GET /api/admin/tasks — 管理端任务列表 */
export async function GET(request: NextRequest) {
  try {
    return withAdmin(request, async () => {
      const params = request.nextUrl.searchParams;
      const { page, pageSize, skip } = parsePagination(params);
      const keyword = params.get('keyword') || undefined;
      const type = params.get('type') || undefined;
      const status = params.get('status') || undefined;
      const publisherName = params.get('publisherName') || undefined;

      const where: Prisma.TaskWhereInput = {};
      if (keyword) where.title = { contains: keyword };
      if (type) where.type = type as TASK_TYPE;
      if (status) where.status = status as TASK_STATUS;
      if (publisherName) where.publisher = { nickname: { contains: publisherName } };

      const [list, total] = await Promise.all([
        prisma.task.findMany({
          where,
          include: {
            category: true,
            publisher: { select: { id: true, nickname: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        }),
        prisma.task.count({ where }),
      ]);

      return NextResponse.json({ code: 0, data: { list, total, page, pageSize }, message: 'ok' });
    });
  } catch (error) {
    console.error('admin tasks GET:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}
