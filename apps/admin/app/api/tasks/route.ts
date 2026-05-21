import { TASK_TYPE, type TASK_STATUS, REWARD_TYPE } from '@help-platform/shared';
import type { Prisma } from '@prisma/client';
import { NextResponse, type NextRequest } from 'next/server';

import { withUser } from '@/lib/auth-helpers';
import { parsePagination } from '@/lib/pagination';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeHtml } from '@/lib/sanitize';

const defaultInclude = {
  category: true,
  publisher: { select: { id: true, nickname: true, avatar: true } },
} as const;

/** 根据查询参数构建任务列表的 Prisma 筛选条件 */
function buildWhere(searchParams: URLSearchParams) {
  const where: Prisma.TaskWhereInput = {};

  const type = searchParams.get('type');
  if (type) where.type = type as TASK_TYPE;

  const categoryId = searchParams.get('categoryId');
  if (categoryId) where.categoryId = categoryId;

  const rewardType = searchParams.get('rewardType');
  if (rewardType) where.rewardType = rewardType as REWARD_TYPE;

  const status = searchParams.get('status');
  if (status) where.status = status as TASK_STATUS;

  const keyword = searchParams.get('keyword');
  if (keyword) where.title = { contains: keyword };

  return where;
}

/** GET /api/tasks — 任务列表（不传 status 则不过滤，返回所有状态） */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const { page, pageSize, skip } = parsePagination(params);
    const sort = params.get('sort') || 'newest';

    const where = buildWhere(params);
    const [list, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: defaultInclude,
        orderBy: sort === 'reward_desc' ? { rewardAmount: 'desc' } : { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.task.count({ where }),
    ]);

    return NextResponse.json({
      code: 0,
      data: { list, total, page, pageSize },
      message: 'ok',
    });
  } catch (error) {
    console.error('tasks GET:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}

/** POST /api/tasks — 发布任务 */
export async function POST(request: NextRequest) {
  try {
    return withUser(request, async (payload) => {
      // 速率限制：每用户每分钟最多 5 次发布
      if (!rateLimit(`tasks-create:${payload.userId}`, 5, 60_000)) {
        return NextResponse.json(
          { code: 429, data: null, message: '请求过于频繁，请稍后再试' },
          { status: 429 },
        );
      }

      const body = await request.json();

      if (!body.title || body.title.length < 1 || body.title.length > 50) {
        return NextResponse.json(
          { code: 422, data: null, message: '标题需1-50字' },
          { status: 422 },
        );
      }
      if (!body.description || body.description.length < 1 || body.description.length > 2000) {
        return NextResponse.json(
          { code: 422, data: null, message: '描述需1-2000字' },
          { status: 422 },
        );
      }
      if (!body.categoryId) {
        return NextResponse.json({ code: 422, data: null, message: '请选择分类' }, { status: 422 });
      }
      if (body.rewardType === REWARD_TYPE.PAID && (!body.rewardAmount || body.rewardAmount <= 0)) {
        return NextResponse.json(
          { code: 422, data: null, message: '付费悬赏需填写金额' },
          { status: 422 },
        );
      }

      const task = await prisma.task.create({
        data: {
          publisherId: payload.userId,
          title: sanitizeHtml(body.title),
          description: sanitizeHtml(body.description),
          type: body.type || TASK_TYPE.HELP,
          categoryId: body.categoryId,
          rewardType: body.rewardType || REWARD_TYPE.FREE,
          rewardAmount: body.rewardAmount || null,
          images: body.images || [],
          location: body.location || null,
        },
        include: defaultInclude,
      });

      return NextResponse.json({ code: 0, data: task, message: 'ok' });
    });
  } catch (error) {
    console.error('tasks POST:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}
