import { ORDER_STATUS, TASK_STATUS } from '@help-platform/shared';
import { NextResponse, type NextRequest } from 'next/server';

import { withUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

/** POST /api/orders/[id]/complete — 完成订单 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return withUser(request, async (payload) => {
      const { id } = await params;
      const order = await prisma.order.findUnique({ where: { id } });

      if (!order) {
        return NextResponse.json({ code: 404, data: null, message: '订单不存在' }, { status: 404 });
      }
      if (order.helperId !== payload.userId) {
        return NextResponse.json(
          { code: 403, data: null, message: '仅接单者可操作' },
          { status: 403 },
        );
      }
      if (order.status !== ORDER_STATUS.ACCEPTED) {
        return NextResponse.json(
          { code: 422, data: null, message: '订单非接单状态' },
          { status: 422 },
        );
      }

      const [updated] = await prisma.$transaction([
        prisma.order.update({ where: { id }, data: { status: ORDER_STATUS.COMPLETED } }),
        prisma.task.update({
          where: { id: order.taskId },
          data: { status: TASK_STATUS.COMPLETED },
        }),
      ]);

      return NextResponse.json({ code: 0, data: updated, message: 'ok' });
    });
  } catch (error) {
    console.error('order complete:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}
