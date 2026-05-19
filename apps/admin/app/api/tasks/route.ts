import type { Prisma } from '@help-platform/database';
import { NextResponse, type NextRequest } from 'next/server';

import { requireUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

const defaultInclude = {
  category: true,
  publisher: { select: { id: true, nickname: true, avatar: true } },
} as const;

function buildWhere(searchParams: URLSearchParams) {
  const where: Prisma.TaskWhereInput = {};

  const type = searchParams.get('type');
  if (type) where.type = type as 'HELP' | 'SKILL' | 'COMMUNITY';

  const categoryId = searchParams.get('categoryId');
  if (categoryId) where.categoryId = categoryId;

  const rewardType = searchParams.get('rewardType');
  if (rewardType) where.rewardType = rewardType as 'FREE' | 'PAID';

  const status = searchParams.get('status');
  where.status = (status as 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED') || 'OPEN';

  const keyword = searchParams.get('keyword');
  if (keyword) where.title = { contains: keyword };

  return where;
}

// GET /api/tasks — 任务列表
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get('page') || '1'));
    const pageSize = Math.min(50, Math.max(1, parseInt(params.get('pageSize') || '10')));
    const sort = params.get('sort') || 'newest';

    const where = buildWhere(params);
    const [list, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: defaultInclude,
        orderBy: sort === 'reward_desc' ? { rewardAmount: 'desc' } : { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
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

// POST /api/tasks — 发布任务
export async function POST(request: NextRequest) {
  try {
    const payload = await requireUser(request).catch(() => null);
    if (!payload) {
      return NextResponse.json({ code: 401, data: null, message: '请先登录' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.title || body.title.length < 1 || body.title.length > 50) {
      return NextResponse.json({ code: 422, data: null, message: '标题需1-50字' }, { status: 422 });
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
    if (body.rewardType === 'PAID' && (!body.rewardAmount || body.rewardAmount <= 0)) {
      return NextResponse.json(
        { code: 422, data: null, message: '付费悬赏需填写金额' },
        { status: 422 },
      );
    }

    const task = await prisma.task.create({
      data: {
        publisherId: payload.userId,
        title: body.title,
        description: body.description,
        type: body.type || 'HELP',
        categoryId: body.categoryId,
        rewardType: body.rewardType || 'FREE',
        rewardAmount: body.rewardAmount || null,
        images: body.images || [],
        location: body.location || null,
      },
      include: defaultInclude,
    });

    return NextResponse.json({ code: 0, data: task, message: 'ok' });
  } catch (error) {
    console.error('tasks POST:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}
