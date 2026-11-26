/** 导出相关的纯函数：倒计时与过期判定（提案 AC4）。 */
import dayjs from 'dayjs';
import { EXPORT_LINK_TTL_MS } from '@/schemas/audit';

/** 剩余有效时间的毫秒数，已过期返回 0。 */
export function remainingMs(expiresAt: string | null, now: number = Date.now()): number {
  if (!expiresAt) return 0;
  const target = dayjs(expiresAt).valueOf();
  if (Number.isNaN(target)) return 0;
  return Math.max(0, target - now);
}

export function isLinkExpired(expiresAt: string | null, now: number = Date.now()): boolean {
  return remainingMs(expiresAt, now) <= 0;
}

/** mm:ss 形式的倒计时文本。 */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** 由服务端 expires_at 推一个缺省值（服务端没给时按 10 分钟）。 */
export function defaultExpiresAt(now: number = Date.now()): string {
  return new Date(now + EXPORT_LINK_TTL_MS).toISOString();
}

/** 导出进度百分比，0–100 的整数。 */
export function progressPercent(done: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.round((done / total) * 100));
}

/** 导出任务是否还在跑（需要继续轮询）。 */
export function isTaskRunning(status: string): boolean {
  return status === 'pending' || status === 'running';
}
