import { NextResponse, type NextRequest } from 'next/server';

import { withAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

/** PUT /api/admin/tasks/[id] — 管理端编辑/下架任务 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return withAdmin(request, async () => {
      const { id } = await params;
      const task = await prisma.task.findUnique({ where: { id } });
      if (!task) {
        return NextResponse.json({ code: 404, data: null, message: '任务不存在' }, { status: 404 });
      }

      const body = await request.json();
      const data: Record<string, unknown> = {};
      if (body.status !== undefined) data.status = body.status;
      if (body.title !== undefined) data.title = body.title;

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
    console.error('admin tasks PUT:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}
