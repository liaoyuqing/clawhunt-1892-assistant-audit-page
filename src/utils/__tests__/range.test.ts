import { describe, expect, it } from 'vitest';
import { clampRange, isRangeExceeded, spanDays } from '@/utils/range';

describe('90 天范围工具', () => {
  it('跨度按含首尾计算', () => {
    expect(spanDays('2026-08-01', '2026-08-01')).toBe(1);
    expect(spanDays('2026-08-01', '2026-10-29')).toBe(90);
    expect(spanDays('2026-08-01', '2026-10-30')).toBe(91);
  });

  it('超过 90 天判为非法', () => {
    expect(isRangeExceeded({ from: '2026-08-01', to: '2026-10-30' })).toBe(true);
    expect(isRangeExceeded({ from: '2026-08-01', to: '2026-10-29' })).toBe(false);
    expect(isRangeExceeded({ from: null, to: null })).toBe(false);
  });

  it('clampRange 把结束日夹到起始日 + 89 天', () => {
    expect(clampRange({ from: '2026-08-01', to: '2026-12-01' })).toEqual({
      from: '2026-08-01',
      to: '2026-10-29',
    });
  });
});
