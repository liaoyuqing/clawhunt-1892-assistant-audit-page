/**
 * 脱敏规则（AC3）：手机号、邮箱、身份证。
 * 只处理文本本身，调用方保证不改变 DOM 结构与布局。
 */

/** 18 位身份证：保留前 6 后 4，中间 8 位替换为 ****。 */
const ID_CARD_RE = /(?<![0-9])(\d{6})(\d{8})([0-9Xx]{4})(?![0-9Xx])/g;

/** 11 位手机号：138****1234。 */
const PHONE_RE = /(?<![0-9])(1[3-9]\d)(\d{4})(\d{4})(?![0-9])/g;

/** 邮箱：保留首字母与域名，a***@b.com。 */
const EMAIL_RE = /([A-Za-z0-9._%+-])([A-Za-z0-9._%+-]*)@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

export function maskIdCard(input: string): string {
  return input.replace(ID_CARD_RE, (_m, head: string, _mid: string, tail: string) => `${head}********${tail}`);
}

export function maskPhone(input: string): string {
  return input.replace(PHONE_RE, (_m, head: string, _mid: string, tail: string) => `${head}****${tail}`);
}

export function maskEmail(input: string): string {
  return input.replace(EMAIL_RE, (_m, first: string, _rest: string, domain: string) => `${first}***@${domain}`);
}

/**
 * 一次跑完全部规则。身份证先处理，避免 18 位串里的片段被手机号规则误伤。
 * 返回脱敏后的文本与命中处数。
 */
export function redactText(input: string): { text: string; count: number } {
  let count = 0;
  const countHits = (re: RegExp, value: string) => {
    re.lastIndex = 0;
    const hits = value.match(new RegExp(re.source, re.flags)) ?? [];
    count += hits.length;
  };

  countHits(ID_CARD_RE, input);
  const afterId = maskIdCard(input);
  countHits(PHONE_RE, afterId);
  const afterPhone = maskPhone(afterId);
  countHits(EMAIL_RE, afterPhone);
  const text = maskEmail(afterPhone);

  return { text, count };
}

/** 结构化值的递归脱敏（工具参数、引用标题等）。 */
export function redactValue<T>(value: T): { value: T; count: number } {
  if (typeof value === 'string') {
    const { text, count } = redactText(value);
    return { value: text as unknown as T, count };
  }
  if (Array.isArray(value)) {
    let count = 0;
    const list = value.map((entry) => {
      const result = redactValue(entry);
      count += result.count;
      return result.value;
    });
    return { value: list as unknown as T, count };
  }
  if (value && typeof value === 'object') {
    let count = 0;
    const next: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
      const result = redactValue(entry);
      count += result.count;
      next[key] = result.value;
    });
    return { value: next as unknown as T, count };
  }
  return { value, count: 0 };
}
