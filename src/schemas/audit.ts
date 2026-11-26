/**
 * 审计接口的类型集中地（字段 snake_case，与后端契约一一对应）。
 * 契约来源：工单 1892 提案「接口契约（mock 同此实现）」。
 */

/** 审计角色判定用的权限点。 */
export const AUDIT_READ_PERMISSION = 'audit.assistant.read';

/** 时间跨度硬上限（天）。AC2 的 90 天限制。 */
export const MAX_RANGE_DAYS = 90;

/** 导出链接有效期（毫秒），10 分钟。 */
export const EXPORT_LINK_TTL_MS = 10 * 60 * 1000;

/** 导出任务轮询间隔（毫秒），3 秒。 */
export const EXPORT_POLL_INTERVAL_MS = 3000;

/** 员工 AI 助手条目类型：用户消息 / 助手回答 / 工具调用 / 拦截事件 / 反馈。 */
export type AuditItemKind = 'user' | 'assistant' | 'tool' | 'intercept' | 'feedback';

export interface CurrentUser {
  user_id: string;
  name: string;
  employee_no: string;
  roles: string[];
  permissions: string[];
  site_id: string;
}

export interface SessionUser {
  name: string;
  employee_no: string;
}

export interface AuditSessionSummary {
  id: string;
  title: string;
  user: SessionUser;
  role_snapshot: string;
  messages: number;
  tool_calls: number;
  bad_count: number;
  has_intercept: boolean;
  last_at: string;
}

export interface AuditSessionListResponse {
  items: AuditSessionSummary[];
  next_cursor: string | null;
  total: number;
}

export interface Citation {
  no: number;
  title: string;
  source_id: string;
}

export interface ToolDetail {
  name: string;
  args: Record<string, unknown>;
  result_summary: string;
  confirmed_by: string;
  confirmed_at: string;
}

export interface InterceptDetail {
  reason: string;
  policy_name: string;
  shutdown: boolean;
}

export type FeedbackVerdict = 'up' | 'down';

export interface FeedbackDetail {
  verdict: FeedbackVerdict;
  reason?: string;
  note?: string;
}

export interface AuditItem {
  seq: number;
  kind: AuditItemKind;
  at: string;
  role_snapshot: string;
  model: string;
  prompt_version: string;
  content_raw: string;
  content_masked: string;
  citations?: Citation[];
  tool?: ToolDetail;
  intercept?: InterceptDetail;
  feedback?: FeedbackDetail;
}

export interface AuditSessionDetailResponse {
  id: string;
  title: string;
  role_snapshot: string;
  redaction_count: number;
  items: AuditItem[];
}

/** 列表筛选条件；null 表示「不限」。 */
export interface AuditFilters {
  user_no: string;
  from: string | null;
  to: string | null;
  tools: string[];
  has_bad: boolean | null;
  intercepted: boolean | null;
  overreach: boolean | null;
}

export type ExportStatus = 'pending' | 'running' | 'done' | 'failed';

export interface ExportTask {
  task_id: string;
  status: ExportStatus;
  done: number;
  total: number;
  download_url: string | null;
  expires_at: string | null;
  error?: string;
}

export const DEFAULT_FILTERS: AuditFilters = {
  user_no: '',
  from: null,
  to: null,
  tools: [],
  has_bad: null,
  intercepted: null,
  overreach: null,
};

/** 原文 / 脱敏视图。AC3。 */
export type AuditView = 'raw' | 'masked';
