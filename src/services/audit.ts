/** 审计接口访问层：本单全部接口契约的唯一定义处。 */
import type {
  AuditSessionDetailResponse,
  AuditSessionListResponse,
  AuditFilters,
  CurrentUser,
  ExportTask,
} from '@/schemas/audit';
import { requestJson } from '@/services/http';

function toQuery(filters: AuditFilters, cursor?: string | null): string {
  const search = new URLSearchParams();
  if (filters.user_no) search.set('user_no', filters.user_no);
  if (filters.from) search.set('from', filters.from);
  if (filters.to) search.set('to', filters.to);
  filters.tools.forEach((tool) => search.append('tools', tool));
  if (filters.has_bad !== null) search.set('has_bad', String(filters.has_bad));
  if (filters.intercepted !== null) search.set('intercepted', String(filters.intercepted));
  if (filters.overreach !== null) search.set('overreach', String(filters.overreach));
  if (cursor) search.set('cursor', cursor);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

/** GET /api/iam/me/permissions —— 角色与权限点。 */
export function fetchPermissions(): Promise<CurrentUser> {
  return requestJson<CurrentUser>('/api/iam/me/permissions');
}

/** GET /api/audit/assistant/sessions —— 会话检索列表。 */
export function fetchSessions(
  filters: AuditFilters,
  cursor?: string | null,
): Promise<AuditSessionListResponse> {
  return requestJson<AuditSessionListResponse>(`/api/audit/assistant/sessions${toQuery(filters, cursor)}`);
}

/** GET /api/audit/assistant/sessions/{id} —— 整段会话回放。 */
export function fetchSessionDetail(sessionId: string): Promise<AuditSessionDetailResponse> {
  return requestJson<AuditSessionDetailResponse>(
    `/api/audit/assistant/sessions/${encodeURIComponent(sessionId)}`,
  );
}

/** POST /api/audit/assistant/exports —— 按当前筛选条件发起导出。 */
export function createExport(filters: AuditFilters): Promise<{ task_id: string }> {
  return requestJson<{ task_id: string }>('/api/audit/assistant/exports', {
    method: 'POST',
    body: JSON.stringify({ filters }),
  });
}

/** GET /api/audit/assistant/exports/{task_id} —— 导出任务进度。 */
export function fetchExportTask(taskId: string): Promise<ExportTask> {
  return requestJson<ExportTask>(`/api/audit/assistant/exports/${encodeURIComponent(taskId)}`);
}
