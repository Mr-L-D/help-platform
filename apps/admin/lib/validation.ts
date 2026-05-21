import { NextResponse } from 'next/server';
import { z } from 'zod';

/** 注册表单校验 */
export const registerSchema = z.object({
  username: z.string().regex(/^[a-zA-Z0-9]{4,20}$/, '用户名需为4-20位字母数字'),
  password: z.string().min(6, '密码需为6-32位').max(32, '密码需为6-32位'),
});

/** 密码登录表单校验 */
export const passwordLoginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
});

/**
 * 使用 zod schema 校验 JSON 请求体。
 * 成功 → { success: true, data }；失败 → { success: false, response }（已包装为 422 NextResponse）
 */
export async function validateBody<T>(
  request: Request,
  schema: z.ZodSchema<T>,
): Promise<
  { success: true; data: T } | { success: false; response: ReturnType<typeof NextResponse.json> }
> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { code: 422, data: null, message: '请求体格式错误' },
        { status: 422 },
      ),
    };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join('; ');
    return {
      success: false,
      response: NextResponse.json({ code: 422, data: null, message }, { status: 422 }),
    };
  }

  return { success: true, data: result.data };
}
