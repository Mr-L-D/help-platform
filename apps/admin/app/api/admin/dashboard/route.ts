import { NextResponse, type NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const payload = await requireAdmin(request).catch(() => null);
    if (!payload) {
      const code = payload === undefined ? 403 : 401;
      return NextResponse.json(
        { code, data: null, message: code === 403 ? '无权限' : '请先登录' },
        { status: code },
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [taskCount, userCount, orderCount, todayNewTasks, todayNewUsers] = await Promise.all([
      prisma.task.count(),
      prisma.user.count(),
      prisma.order.count(),
      prisma.task.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
    ]);

    return NextResponse.json({
      code: 0,
      data: { taskCount, userCount, orderCount, todayNewTasks, todayNewUsers },
      message: 'ok',
    });
  } catch (error) {
    console.error('admin dashboard:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}
