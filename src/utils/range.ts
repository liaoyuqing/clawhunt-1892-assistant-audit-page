/** 时间范围工具：90 天硬上限的判定与夹取（AC2）。 */
import dayjs from 'dayjs';
import { MAX_RANGE_DAYS } from '@/schemas/audit';

export const RANGE_EXCEEDED_HINT = '审计查询时间跨度不能超过 90 天，请缩小范围';

export interface DateRange {
  from: string | null;
  to: string | null;
}

/** 跨度天数：含首尾（同一天算 1 天），与界面 RangePicker 的直觉一致。 */
export function spanDays(from: string, to: string): number {
  const start = dayjs(from).startOf('day');
  const end = dayjs(to).startOf('day');
  if (!start.isValid() || !end.isValid()) return 0;
  return end.diff(start, 'day') + 1;
}

export function isRangeEmpty(range: DateRange): boolean {
  return !range.from || !range.to;
}

/** 超过 90 天即视为非法：此时查询按钮禁用并给出提示。 */
export function isRangeExceeded(range: DateRange): boolean {
  if (isRangeEmpty(range)) return false;
  return spanDays(range.from as string, range.to as string) > MAX_RANGE_DAYS;
}

/** 把结束日夹到起始日 + (90 - 1) 天。 */
export function clampRange(range: DateRange): DateRange {
  if (isRangeEmpty(range)) return range;
  const from = dayjs(range.from as string).startOf('day');
  const to = dayjs(range.to as string).startOf('day');
  if (to.diff(from, 'day') + 1 <= MAX_RANGE_DAYS) return range;
  return { from: range.from, to: from.add(MAX_RANGE_DAYS - 1, 'day').format('YYYY-MM-DD') };
}
