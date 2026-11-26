/** 极薄的 fetch 封装：统一 JSON 解析与错误抛出，方便测试里断言调用次数。 */

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!response.ok) {
    throw new HttpError(response.status, `请求失败：${response.status} ${url}`);
  }
  return (await response.json()) as T;
}
