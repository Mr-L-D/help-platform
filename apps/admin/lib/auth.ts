import { SignJWT, jwtVerify } from 'jose';

// ---------- JWT 密钥校验 ----------
const rawSecret = process.env.JWT_SECRET;
if ((!rawSecret || rawSecret === 'dev-secret') && process.env.NODE_ENV === 'production') {
  console.error(
    '[auth] JWT_SECRET 未设置或仍为默认值。请在 Vercel 环境变量中设置 ≥32 字符的强随机密钥。',
  );
}
const secret = new TextEncoder().encode(rawSecret || 'dev-secret');

// ---------- 鉴权错误类型 ----------
/** JWT 校验失败的错误类型，携带可读消息和错误码 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: 'TOKEN_EXPIRED' | 'TOKEN_INVALID',
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/** JWT 载荷中包含的用户身份信息 */
export interface JwtPayload {
  userId: string;
  role: string;
}

/** 签发 JWT token，有效期 7 天 */
export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(secret);
}

/** 验证并解析 JWT token，失败时抛出 AuthError */
export async function verifyToken(token: string): Promise<JwtPayload> {
  try {
    const { payload } = await jwtVerify<JwtPayload>(token, secret);
    return payload;
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'ERR_JWT_EXPIRED') {
      throw new AuthError('登录已过期，请重新登录', 'TOKEN_EXPIRED');
    }
    throw new AuthError('登录信息无效，请重新登录', 'TOKEN_INVALID');
  }
}
