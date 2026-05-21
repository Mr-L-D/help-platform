/**
 * 从 User 数据库记录中提取可安全返回客户端的字段，
 * 排除 passwordHash / openid / unionid 等敏感信息。
 */
export function sanitizeUser(user: {
  id: string;
  nickname: string;
  avatar: string;
  phone?: string | null;
  role: string;
  points: number;
}) {
  return {
    id: user.id,
    nickname: user.nickname,
    avatar: user.avatar,
    phone: user.phone ?? undefined,
    role: user.role,
    points: user.points,
  };
}
