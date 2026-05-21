import { NextResponse, type NextRequest } from 'next/server';

import { withAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

/** GET /api/admin/dashboard — 管理端仪表盘统计 */
export async function GET(request: NextRequest) {
  try {
    return withAdmin(request, async () => {
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
    });
  } catch (error) {
    console.error('admin dashboard:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}
