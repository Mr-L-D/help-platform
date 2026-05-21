import type { Prisma } from '@prisma/client';
import { NextResponse, type NextRequest } from 'next/server';

import { withAdmin } from '@/lib/auth-helpers';
import { parsePagination } from '@/lib/pagination';
import { prisma } from '@/lib/prisma';

/** GET /api/admin/users — 用户列表 */
export async function GET(request: NextRequest) {
  try {
    return withAdmin(request, async () => {
      const params = request.nextUrl.searchParams;
      const { page, pageSize, skip } = parsePagination(params);
      const keyword = params.get('keyword') || undefined;

      const where: Prisma.UserWhereInput = {};
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
          skip,
          take: pageSize,
        }),
        prisma.user.count({ where }),
      ]);

      return NextResponse.json({ code: 0, data: { list, total, page, pageSize }, message: 'ok' });
    });
  } catch (error) {
    console.error('admin users GET:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}
