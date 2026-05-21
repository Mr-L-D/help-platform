import { TASK_STATUS, type ORDER_STATUS } from '@help-platform/shared';
import type { Prisma } from '@prisma/client';
import { NextResponse, type NextRequest } from 'next/server';

import { withUser } from '@/lib/auth-helpers';
import { parsePagination } from '@/lib/pagination';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

/** POST /api/orders — 接单（事务内乐观锁，消除竞态条件） */
export async function POST(request: NextRequest) {
  try {
    return withUser(request, async (payload) => {
      // 速率限制：每用户每分钟最多 10 次接单
      if (!rateLimit(`orders-create:${payload.userId}`, 10, 60_000)) {
        return NextResponse.json(
          { code: 429, data: null, message: '请求过于频繁，请稍后再试' },
          { status: 429 },
        );
      }

      const { taskId } = await request.json();

      if (!taskId) {
        return NextResponse.json({ code: 422, data: null, message: '缺少任务ID' }, { status: 422 });
      }

      // 事务内全流程：校验 → 乐观锁更新状态 → 创建订单
      const result = await prisma.$transaction(async (tx) => {
        const task = await tx.task.findUnique({ where: { id: taskId } });
        if (!task) return { err: '任务不存在', code: 404 } as const;
        if (task.publisherId === payload.userId)
          return { err: '不能接自己发布的任务', code: 422 } as const;

        // updateMany 原子化检查状态，消除并发接单窗口
        const updated = await tx.task.updateMany({
          where: { id: taskId, status: TASK_STATUS.OPEN },
          data: { status: TASK_STATUS.IN_PROGRESS },
        });
        if (updated.count === 0) return { err: '任务已被接单或已结束', code: 422 } as const;

        const order = await tx.order.create({ data: { taskId, helperId: payload.userId } });
        return { order } as const;
      });

      if ('err' in result) {
        return NextResponse.json(
          { code: result.code, data: null, message: result.err },
          { status: result.code },
        );
      }

      return NextResponse.json({ code: 0, data: result.order, message: 'ok' });
    });
  } catch (error) {
    console.error('orders POST:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}

/** GET /api/orders — 我的接单列表 */
export async function GET(request: NextRequest) {
  try {
    return withUser(request, async (payload) => {
      const params = request.nextUrl.searchParams;
      const { page, pageSize, skip } = parsePagination(params);
      const role = params.get('role') || 'helper';
      const status = params.get('status') || undefined;

      const where: Prisma.OrderWhereInput = {};
      if (role === 'helper') {
        where.helperId = payload.userId;
      } else {
        where.task = { publisherId: payload.userId };
      }
      if (status) {
        where.status = status as ORDER_STATUS;
      }

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
          skip,
          take: pageSize,
        }),
        prisma.order.count({ where }),
      ]);

      return NextResponse.json({ code: 0, data: { list, total, page, pageSize }, message: 'ok' });
    });
  } catch (error) {
    console.error('orders GET:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}
