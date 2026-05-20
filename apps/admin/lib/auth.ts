import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');

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

/** 验证并解析 JWT token */
export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify<JwtPayload>(token, secret);
  return payload;
}
