import { NextResponse, type NextRequest } from 'next/server';

import { requireUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

/** POST /api/orders — 接单 */
export async function POST(request: NextRequest) {
  try {
    const payload = await requireUser(request).catch(() => null);
    if (!payload) {
      return NextResponse.json({ code: 401, data: null, message: '请先登录' }, { status: 401 });
    }

    const { taskId } = await request.json();

    if (!taskId) {
      return NextResponse.json({ code: 422, data: null, message: '缺少任务ID' }, { status: 422 });
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return NextResponse.json({ code: 404, data: null, message: '任务不存在' }, { status: 404 });
    }
    if (task.status !== 'OPEN') {
      return NextResponse.json(
        { code: 422, data: null, message: '任务已被接单或已结束' },
        { status: 422 },
      );
    }
    if (task.publisherId === payload.userId) {
      return NextResponse.json(
        { code: 422, data: null, message: '不能接自己发布的任务' },
        { status: 422 },
      );
    }

    const [order] = await prisma.$transaction([
      prisma.order.create({ data: { taskId, helperId: payload.userId } }),
      prisma.task.update({ where: { id: taskId }, data: { status: 'IN_PROGRESS' } }),
    ]);

    return NextResponse.json({ code: 0, data: order, message: 'ok' });
  } catch (error) {
    console.error('orders POST:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}

/** GET /api/orders — 我的接单列表 */
export async function GET(request: NextRequest) {
  try {
    const payload = await requireUser(request).catch(() => null);
    if (!payload) {
      return NextResponse.json({ code: 401, data: null, message: '请先登录' }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get('page') || '1'));
    const pageSize = Math.min(50, Math.max(1, parseInt(params.get('pageSize') || '10')));
    const role = params.get('role') || 'helper';
    const status = params.get('status') || undefined;

    const where: Record<string, unknown> = {
      ...(role === 'helper'
        ? { helperId: payload.userId }
        : { task: { publisherId: payload.userId } }),
      ...(status ? { status } : {}),
    };

    const [list, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          task: {
            include: {
              category: true,
              publisher: { select: { id: true, nickname: true, avatar: true } },
            },
          },
          helper: { select: { id: true, nickname: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({ code: 0, data: { list, total, page, pageSize }, message: 'ok' });
  } catch (error) {
    console.error('orders GET:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}
