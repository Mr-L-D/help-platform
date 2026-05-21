import { NextResponse } from 'next/server';

/** GET /api/health — 健康检查端点，供 Vercel / 负载均衡器 / 监控系统使用 */
export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: Date.now() });
}
