import { NextResponse, type NextRequest } from 'next/server';

import { requireUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// POST /api/tasks/[id]/cancel — 取消任务
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await requireUser(request).catch(() => null);
    if (!payload) {
      return NextResponse.json({ code: 401, data: null, message: '请先登录' }, { status: 401 });
    }

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
    if (task.status === 'COMPLETED' || task.status === 'CANCELLED') {
      return NextResponse.json(
        { code: 422, data: null, message: '任务已结束，不可取消' },
        { status: 422 },
      );
    }

    const updated = await prisma.task.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        category: true,
        publisher: { select: { id: true, nickname: true, avatar: true } },
      },
    });

    return NextResponse.json({ code: 0, data: updated, message: 'ok' });
  } catch (error) {
    console.error('task cancel:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}
