/**
 * 导出条（提案 AC4）。
 * 流程：POST 拿 task_id → 3 秒轮询进度 → 完成后给 10 分钟有效下载链接并倒计时 → 到期置灰。
 * 页面隐藏时暂停轮询，回来补查一次。
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Alert, Button, Progress } from 'tdesign-react';
import { DownloadIcon, RefreshIcon } from 'tdesign-icons-react';
import { createExport, fetchExportTask } from '@/services/audit';
import type { AuditFilters } from '@/schemas/audit';
import { EXPORT_POLL_INTERVAL_MS } from '@/schemas/audit';
import {
  formatCountdown,
  isLinkExpired,
  isTaskRunning,
  progressPercent,
  remainingMs,
} from '@/utils/export';

export interface ExportBarProps {
  filters: AuditFilters;
}

export function ExportBar({ filters }: ExportBarProps) {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [visible, setVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState !== 'hidden',
  );
  const pollCount = useRef(0);

  const mutation = useMutation({
    mutationFn: (next: AuditFilters) => createExport(next),
    onSuccess: (data) => {
      pollCount.current = 0;
      setTaskId(data.task_id);
      setStartedAt(Date.now());
    },
  });

  const taskQuery = useQuery({
    queryKey: ['export-task', taskId, pollCount.current],
    queryFn: () => fetchExportTask(taskId as string),
    enabled: Boolean(taskId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return EXPORT_POLL_INTERVAL_MS;
      return isTaskRunning(data.status) && visible ? EXPORT_POLL_INTERVAL_MS : false;
    },
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const task = taskQuery.data;

  // 页面隐藏时暂停轮询，回到前台补查一次。
  useEffect(() => {
    const onVisibility = () => {
      const isVisible = document.visibilityState !== 'hidden';
      setVisible(isVisible);
      if (isVisible && taskId) void taskQuery.refetch();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [taskId, taskQuery]);

  const completed = task?.status === 'done' && Boolean(task.download_url);
  const expiresAt = task?.expires_at ?? null;

  // 倒计时：每秒刷新一次，仅在已完成时跑。
  useEffect(() => {
    if (!completed) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [completed]);

  const remaining = useMemo(() => remainingMs(expiresAt, now), [expiresAt, now]);
  const expired = completed ? isLinkExpired(expiresAt, now) : false;

  const stalled = Boolean(task && isTaskRunning(task.status) && startedAt && now - startedAt > 10 * 60 * 1000);
  const failed = task?.status === 'failed' || taskQuery.isError;

  const reset = () => {
    setTaskId(null);
    setStartedAt(null);
  };

  const handleExport = () => {
    reset();
    mutation.mutate(filters);
  };

  const handleDownload = () => {
    if (expired || !task?.download_url) return;
    window.open(task.download_url, '_blank', 'noopener');
  };

  return (
    <section className="export-bar" aria-label="导出">
      <div className="export-bar__head">
        <span className="export-bar__title">按当前筛选条件导出</span>
        <Button
          data-testid="export-button"
          theme="primary"
          variant="outline"
          icon={<DownloadIcon />}
          loading={mutation.isPending}
          disabled={Boolean(task && isTaskRunning(task.status)) || stalled}
          onClick={handleExport}
        >
          导出
        </Button>
      </div>

      {mutation.isError ? (
        <Alert theme="error" message="导出任务发起失败，请稍后重试" className="export-bar__alert" />
      ) : null}

      {task && isTaskRunning(task.status) && !stalled ? (
        <div className="export-bar__progress" data-testid="export-progress">
          <Progress
            theme="line"
            percentage={progressPercent(task.done, task.total)}
            label={`${progressPercent(task.done, task.total)}%`}
          />
          <p className="export-bar__meta" role="status" aria-live="polite">
            已生成 {task.done} / 共 {task.total} 条 · 每 3 秒刷新
          </p>
        </div>
      ) : null}

      {stalled ? (
        <div className="export-bar__failed" role="alert" data-testid="export-failed">
          <strong>导出超时</strong>
          <span>任务已超过 10 分钟仍未完成，请重试或联系管理员。</span>
          <Button
            data-testid="export-retry"
            size="small"
            theme="primary"
            icon={<RefreshIcon />}
            onClick={handleExport}
          >
            重试
          </Button>
        </div>
      ) : null}

      {failed && !stalled ? (
        <div className="export-bar__failed" role="alert" data-testid="export-failed">
          <strong>导出失败</strong>
          <span>{task?.error ?? '导出服务暂时不可用。'}</span>
          <Button
            data-testid="export-retry"
            size="small"
            theme="primary"
            icon={<RefreshIcon />}
            onClick={handleExport}
          >
            重试
          </Button>
        </div>
      ) : null}

      {completed ? (
        <div className="export-bar__done" data-testid="export-done">
          <Button
            data-testid="export-download"
            tag="button"
            theme="success"
            icon={<DownloadIcon />}
            disabled={expired}
            onClick={handleDownload}
          >
            {expired ? '下载链接已过期' : '下载（10 分钟内有效）'}
          </Button>
          <span
            className={`export-bar__countdown${expired ? ' export-bar__countdown--expired' : ''}`}
            data-testid="export-countdown"
          >
            {expired ? '链接已过期，请重新导出' : `剩余有效时间 ${formatCountdown(remaining)}`}
          </span>
        </div>
      ) : null}
    </section>
  );
}
