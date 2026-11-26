/** 脱敏规则单元测试（AC3 的规则依据）。 */
import { describe, expect, it } from 'vitest';
import { maskEmail, maskIdCard, maskPhone, redactText, redactValue } from '@/utils/redact';

describe('脱敏规则', () => {
  it('手机号保留前 3 后 4', () => {
    expect(maskPhone('联系电话 13812341234 请工作时间拨打')).toBe('联系电话 138****1234 请工作时间拨打');
    expect(maskPhone('19900001111')).toBe('199****1111');
  });

  it('邮箱只保留首字母与域名', () => {
    expect(maskEmail('a@b.com')).toBe('a***@b.com');
    expect(maskEmail('shen.chi@example.com')).toBe('s***@example.com');
  });

  it('身份证保留前 6 后 4', () => {
    expect(maskIdCard('310101199001011234')).toBe('310101********1234');
    expect(maskIdCard('11010519881231002X')).toBe('110105********002X');
  });

  it('redactText 一次处理全部规则并返回命中数', () => {
    const input = '手机 13812341234，邮箱 shen.chi@example.com，身份证 310101199001011234。';
    const { text, count } = redactText(input);
    expect(text).toBe('手机 138****1234，邮箱 s***@example.com，身份证 310101********1234。');
    expect(count).toBe(3);
  });

  it('不误伤普通数字与短号', () => {
    expect(maskPhone('订单号 1234567890')).toBe('订单号 1234567890');
    expect(maskPhone('分机 8888')).toBe('分机 8888');
  });

  it('redactValue 递归处理嵌套结构', () => {
    const { value, count } = redactValue({ phone: '13812341234', nested: ['a@b.com'] });
    expect(value).toEqual({ phone: '138****1234', nested: ['a***@b.com'] });
    expect(count).toBe(2);
  });
});
