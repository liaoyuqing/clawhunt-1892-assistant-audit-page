import { describe, expect, it } from 'vitest';
import { formatCountdown, isLinkExpired, progressPercent, remainingMs } from '@/utils/export';

describe('导出链接倒计时工具', () => {
  it('剩余时间基于 expires_at 计算', () => {
    const now = new Date('2026-11-20T10:00:00Z').getTime();
    const expires = new Date('2026-11-20T10:10:00Z').toISOString();
    expect(remainingMs(expires, now)).toBe(10 * 60 * 1000);
    expect(isLinkExpired(expires, now)).toBe(false);
  });

  it('到期后判为过期', () => {
    const now = new Date('2026-11-20T10:11:00Z').getTime();
    const expires = new Date('2026-11-20T10:10:00Z').toISOString();
    expect(remainingMs(expires, now)).toBe(0);
    expect(isLinkExpired(expires, now)).toBe(true);
  });

  it('mm:ss 格式化', () => {
    expect(formatCountdown(10 * 60 * 1000)).toBe('10:00');
    expect(formatCountdown(65 * 1000)).toBe('01:05');
    expect(formatCountdown(0)).toBe('00:00');
  });

  it('进度百分比取整并封顶 100', () => {
    expect(progressPercent(13, 40)).toBe(33);
    expect(progressPercent(40, 40)).toBe(100);
    expect(progressPercent(0, 0)).toBe(0);
  });
});
