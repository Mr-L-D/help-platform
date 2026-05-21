import { TASK_STATUS } from '@help-platform/shared';
import { NextResponse, type NextRequest } from 'next/server';

import { withUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

/** GET /api/tasks/[id] — 任务详情 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        category: true,
        publisher: { select: { id: true, nickname: true, avatar: true } },
        orders: {
          include: { helper: { select: { id: true, nickname: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!task) {
      return NextResponse.json({ code: 404, data: null, message: '任务不存在' }, { status: 404 });
    }

    // 显式挑选返回字段，避免泄露 publisherId / categoryId
    const { orders } = task;
    return NextResponse.json({
      code: 0,
      data: {
        id: task.id,
        title: task.title,
        description: task.description,
        type: task.type,
        category: task.category,
        rewardType: task.rewardType,
        rewardAmount: task.rewardAmount,
        images: task.images,
        location: task.location,
        status: task.status,
        publisher: task.publisher,
        createdAt: task.createdAt,
        order: orders[0] || null,
      },
      message: 'ok',
    });
  } catch (error) {
    console.error('task detail:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}

/** PUT /api/tasks/[id] — 编辑任务 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return withUser(request, async (payload) => {
      const { id } = await params;
      const task = await prisma.task.findUnique({ where: { id } });

      if (!task) {
        return NextResponse.json({ code: 404, data: null, message: '任务不存在' }, { status: 404 });
      }
      if (task.publisherId !== payload.userId) {
        return NextResponse.json(
          { code: 403, data: null, message: '仅发布者可编辑' },
          { status: 403 },
        );
      }
      if (task.status !== TASK_STATUS.OPEN) {
        return NextResponse.json(
          { code: 422, data: null, message: '仅OPEN状态可编辑' },
          { status: 422 },
        );
      }

      const body = await request.json();
      const data: Record<string, unknown> = {};
      if (body.title !== undefined) data.title = body.title;
      if (body.description !== undefined) data.description = body.description;
      if (body.categoryId !== undefined) data.categoryId = body.categoryId;
      if (body.rewardType !== undefined) data.rewardType = body.rewardType;
      if (body.rewardAmount !== undefined) data.rewardAmount = body.rewardAmount;
      if (body.images !== undefined) data.images = body.images;
      if (body.location !== undefined) data.location = body.location;

      const updated = await prisma.task.update({
        where: { id },
        data,
        include: {
          category: true,
          publisher: { select: { id: true, nickname: true, avatar: true } },
        },
      });

      // 显式挑选返回字段，避免泄露 publisherId / categoryId
      return NextResponse.json({
        code: 0,
        data: {
          id: updated.id,
          title: updated.title,
          description: updated.description,
          type: updated.type,
          category: updated.category,
          rewardType: updated.rewardType,
          rewardAmount: updated.rewardAmount,
          images: updated.images,
          location: updated.location,
          status: updated.status,
          publisher: updated.publisher,
          createdAt: updated.createdAt,
        },
        message: 'ok',
      });
    });
  } catch (error) {
    console.error('task PUT:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}
