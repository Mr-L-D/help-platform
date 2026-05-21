import { TASK_STATUS } from '@help-platform/shared';
import { NextResponse, type NextRequest } from 'next/server';

import { withUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

/** POST /api/tasks/[id]/cancel — 取消任务 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return withUser(request, async (payload) => {
      const { id } = await params;
      const task = await prisma.task.findUnique({ where: { id } });

      if (!task) {
        return NextResponse.json({ code: 404, data: null, message: '任务不存在' }, { status: 404 });
      }
      if (task.publisherId !== payload.userId) {
        return NextResponse.json(
          { code: 403, data: null, message: '仅发布者可操作' },
          { status: 403 },
        );
      }
      if (task.status === TASK_STATUS.COMPLETED || task.status === TASK_STATUS.CANCELLED) {
        return NextResponse.json(
          { code: 422, data: null, message: '任务已结束，不可取消' },
          { status: 422 },
        );
      }

      const updated = await prisma.task.update({
        where: { id },
        data: { status: TASK_STATUS.CANCELLED },
        include: {
          category: true,
          publisher: { select: { id: true, nickname: true, avatar: true } },
        },
      });

      return NextResponse.json({ code: 0, data: updated, message: 'ok' });
    });
  } catch (error) {
    console.error('task cancel:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}
