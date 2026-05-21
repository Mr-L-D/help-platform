/**
 * 基础 HTML 实体编码，防止 XSS。
 * 存入数据库前对用户输入的文本内容调用。
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
