import { NextResponse, type NextRequest } from 'next/server';

import { signToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** POST /api/auth/wechat-login — 微信登录 */
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ code: 422, data: null, message: '缺少登录凭证' }, { status: 422 });
    }

    const appid = process.env.WECHAT_APPID;
    const secret = process.env.WECHAT_SECRET;

    let openid: string;

    if (appid && secret) {
      const res = await fetch(
        `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`,
      );
      const data = (await res.json()) as { openid?: string; errcode?: number };
      if (!data.openid) {
        return NextResponse.json(
          { code: 422, data: null, message: '微信登录失败' },
          { status: 422 },
        );
      }
      openid = data.openid;
    } else {
      // 开发模式 mock：确保 code 至少有 8 位可截取
      const suffix = code.length >= 8 ? code.slice(-8) : code.padStart(8, '0').slice(-8);
      openid = `dev_openid_${suffix}`;
    }

    let user = await prisma.user.findUnique({ where: { openid } });
    if (!user) {
      user = await prisma.user.create({ data: { openid, nickname: '微信用户', avatar: '' } });
    }

    const token = await signToken({ userId: user.id, role: user.role });

    return NextResponse.json({
      code: 0,
      data: {
        token,
        user: { id: user.id, nickname: user.nickname, avatar: user.avatar, role: user.role },
      },
      message: 'ok',
    });
  } catch (error) {
    console.error('wechat-login:', error);
    return NextResponse.json({ code: 500, data: null, message: '服务器错误' }, { status: 500 });
  }
}
