import { NextResponse, type NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

/** PUT /api/admin/tasks/[id] — 管理端编辑/下架任务 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await requireAdmin(request).catch(() => null);
    if (!payload) {
      return NextResponse.json({ code: 403, data: null, message: '无权限' }, { status: 403 });
    }

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

    return NextResponse.json({ code: 0, data: updated, message: 'ok' });
  } catch (error) {
    console.error('admin tasks PUT:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}
