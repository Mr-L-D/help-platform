import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

/** 使用随机盐值 + scrypt 对密码进行哈希，返回 `salt:hash` 格式字符串 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/** 验证明文密码是否与存储的 `salt:hash` 匹配，使用 timingSafeEqual 防止时序攻击 */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const inputHash = scryptSync(password, salt, 64).toString('hex');
  return timingSafeEqual(Buffer.from(inputHash), Buffer.from(hash));
}
