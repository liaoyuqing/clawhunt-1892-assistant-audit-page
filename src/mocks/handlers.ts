/**
 * MSW 请求处理器：本单所有接口都在前端跑起来，不需要后端 / 数据库 / 密钥。
 * 通过 mockState 切换四种状态（有数据 / 空结果 / 导出中 / 导出失败）。
 */
import { http, HttpResponse } from 'msw';
import { AUDITOR, AVAILABLE_TOOLS, SESSIONS, VIEWER, sessionDetail } from '@/mocks/fixtures';
import { mockState } from '@/mocks/state';
import { MAX_RANGE_DAYS } from '@/schemas/audit';

interface ExportRecord {
  task_id: string;
  filters: unknown;
  polls: number;
  createdAt: number;
}

const exportTasks = new Map<string, ExportRecord>();
let exportSeq = 0;

export function resetExportTasks(): void {
  exportTasks.clear();
  exportSeq = 0;
}

/** 测试用：直接把某个任务推到指定轮询次数。 */
export function advanceExportTask(taskId: string, polls: number): void {
  const task = exportTasks.get(taskId);
  if (task) task.polls = polls;
}

function daysBetween(from: string, to: string): number {
  const start = new Date(from).getTime();
  const end = new Date(to).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.floor((end - start) / 86400000) + 1;
}

export const handlers = [
  http.get('/api/iam/me/permissions', () =>
    HttpResponse.json(mockState.role === 'viewer' ? VIEWER : AUDITOR),
  ),

  http.get('/api/audit/assistant/sessions', ({ request }) => {
    const url = new URL(request.url);
    if (mockState.listState === 'empty') {
      return HttpResponse.json({ items: [], next_cursor: null, total: 0 });
    }

    const userNo = url.searchParams.get('user_no') ?? '';
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const tools = url.searchParams.getAll('tools');
    const hasBad = url.searchParams.get('has_bad');
    const intercepted = url.searchParams.get('intercepted');

    // 90 天上限：服务端同样拒绝超范围查询（与前端提示互为兜底）。
    if (from && to && daysBetween(from, to) > MAX_RANGE_DAYS) {
      return HttpResponse.json(
        { detail: '审计查询时间跨度不能超过 90 天' },
        { status: 422 },
      );
    }

    let items = SESSIONS.slice();
    if (userNo) {
      items = items.filter(
        (item) =>
          item.user.employee_no.toLowerCase().includes(userNo.toLowerCase()) ||
          item.user.name.includes(userNo),
      );
    }
    if (from) items = items.filter((item) => item.last_at.slice(0, 10) >= from);
    if (to) items = items.filter((item) => item.last_at.slice(0, 10) <= to);
    if (hasBad === 'true') items = items.filter((item) => item.bad_count > 0);
    if (hasBad === 'false') items = items.filter((item) => item.bad_count === 0);
    if (intercepted === 'true') items = items.filter((item) => item.has_intercept);
    if (intercepted === 'false') items = items.filter((item) => !item.has_intercept);
    if (tools.length > 0 && !AVAILABLE_TOOLS.some((tool) => tools.includes(tool))) {
      items = [];
    }

    return HttpResponse.json({ items, next_cursor: null, total: items.length });
  }),

  http.get('/api/audit/assistant/sessions/:sessionId', ({ params }) => {
    const sessionId = String(params.sessionId);
    return HttpResponse.json(sessionDetail(sessionId));
  }),

  http.post('/api/audit/assistant/exports', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { filters?: unknown };
    exportSeq += 1;
    const taskId = `exp_${String(exportSeq).padStart(4, '0')}`;
    exportTasks.set(taskId, {
      task_id: taskId,
      filters: body.filters ?? null,
      polls: 0,
      createdAt: Date.now(),
    });
    return HttpResponse.json({ task_id: taskId });
  }),

  http.get('/api/audit/assistant/exports/:taskId', ({ params }) => {
    const taskId = String(params.taskId);
    const task = exportTasks.get(taskId);
    if (!task) {
      return HttpResponse.json({ detail: '导出任务不存在' }, { status: 404 });
    }
    task.polls += 1;

    const mode = mockState.exportMode;

    if (mode === 'fail') {
      if (task.polls <= 2) {
        return HttpResponse.json({
          task_id: taskId,
          status: 'running',
          done: Math.min(20, task.polls * 10),
          total: 40,
          download_url: null,
          expires_at: null,
        });
      }
      return HttpResponse.json({
        task_id: taskId,
        status: 'failed',
        done: 20,
        total: 40,
        download_url: null,
        expires_at: null,
        error: '导出服务连续 5 次超时，请重试或联系管理员',
      });
    }

    if (mode === 'slow') {
      return HttpResponse.json({
        task_id: taskId,
        status: task.polls >= 3 ? 'running' : 'pending',
        done: Math.min(26, task.polls * 6 + 8),
        total: 40,
        download_url: null,
        expires_at: null,
      });
    }

    if (task.polls < 2) {
      return HttpResponse.json({
        task_id: taskId,
        status: 'running',
        done: Math.min(24, task.polls * 12 + 4),
        total: 40,
        download_url: null,
        expires_at: null,
      });
    }

    return HttpResponse.json({
      task_id: taskId,
      status: 'done',
      done: 40,
      total: 40,
      download_url: `/api/audit/assistant/exports/${taskId}/download`,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
  }),

  http.get('/api/audit/assistant/exports/:taskId/download', ({ params }) =>
    new HttpResponse(`mock export ${String(params.taskId)}`, {
      headers: { 'Content-Type': 'text/csv; charset=utf-8' },
    }),
  ),
];
