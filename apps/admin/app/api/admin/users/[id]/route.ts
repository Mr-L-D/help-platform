import { NextResponse, type NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// PUT /api/admin/users/[id] — 管理端编辑/拉黑用户
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await requireAdmin(request).catch(() => null);
    if (!payload) {
      return NextResponse.json({ code: 403, data: null, message: '无权限' }, { status: 403 });
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ code: 404, data: null, message: '用户不存在' }, { status: 404 });
    }
    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { code: 403, data: null, message: '不可操作管理员' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.role !== undefined) data.role = body.role;
    if (body.points !== undefined) data.points = body.points;

    const updated = await prisma.user.update({ where: { id }, data });

    return NextResponse.json({
      code: 0,
      data: {
        id: updated.id,
        nickname: updated.nickname,
        username: updated.username,
        phone: updated.phone,
        role: updated.role,
        points: updated.points,
      },
      message: 'ok',
    });
  } catch (error) {
    console.error('admin users PUT:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}
