/**
 * 从 URLSearchParams 解析分页参数。
 * @returns {{ page, pageSize, skip }} — page ≥1, pageSize∈[1,50]
 */
export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));
  return { page, pageSize, skip: (page - 1) * pageSize };
}
