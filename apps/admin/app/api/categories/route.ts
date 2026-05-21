import type { TASK_TYPE } from '@help-platform/shared';
import { NextResponse, type NextRequest } from 'next/server';

import { parsePagination } from '@/lib/pagination';
import { prisma } from '@/lib/prisma';

/** GET /api/categories — 获取分类列表，支持按 type 过滤和分页 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const type = params.get('type') || undefined;
    const { page, pageSize, skip } = parsePagination(params);

    const where = type ? { type: type as TASK_TYPE } : {};

    const [list, total] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: pageSize,
      }),
      prisma.category.count({ where }),
    ]);

    return NextResponse.json({ code: 0, data: { list, total, page, pageSize }, message: 'ok' });
  } catch (error) {
    console.error('categories:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}
