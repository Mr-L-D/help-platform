import { NextResponse, type NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type');

    const categories = await prisma.category.findMany({
      ...(type ? { where: { type: type as 'HELP' | 'SKILL' | 'COMMUNITY' } } : {}),
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ code: 0, data: categories, message: 'ok' });
  } catch (error) {
    console.error('categories:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}
