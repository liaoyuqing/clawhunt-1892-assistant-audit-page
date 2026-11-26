/** 虚构测试数据：不包含任何真实个人信息或企业信息。 */
import type {
  AuditItem,
  AuditSessionDetailResponse,
  AuditSessionSummary,
  CurrentUser,
} from '@/schemas/audit';

export const AUDITOR: CurrentUser = {
  user_id: 'usr_0001',
  name: '审计员 林砚',
  employee_no: 'A1024',
  roles: ['auditor'],
  permissions: ['audit.assistant.read', 'audit.assistant.export'],
  site_id: 'site_hq',
};

export const VIEWER: CurrentUser = {
  user_id: 'usr_0002',
  name: '招商顾问 沈迟',
  employee_no: 'S2098',
  roles: ['member'],
  permissions: ['workbench.read'],
  site_id: 'site_hq',
};

export const AVAILABLE_TOOLS = ['crm_lookup', 'kb_search', 'contract_draft', 'calendar_book'];

export const SESSIONS: AuditSessionSummary[] = [
  {
    id: 'ses_20261120_0001',
    title: '会员企业年框续签条款确认',
    user: { name: '沈迟', employee_no: 'S2098' },
    role_snapshot: '招商顾问',
    messages: 18,
    tool_calls: 6,
    bad_count: 2,
    has_intercept: true,
    last_at: '2026-11-20T14:32:07+08:00',
  },
  {
    id: 'ses_20261119_0002',
    title: '产业资源对接名单筛选',
    user: { name: '顾南', employee_no: 'S2110' },
    role_snapshot: '资源经理',
    messages: 12,
    tool_calls: 3,
    bad_count: 0,
    has_intercept: false,
    last_at: '2026-11-19T10:05:41+08:00',
  },
  {
    id: 'ses_20261118_0003',
    title: '工位租赁报价口径核对',
    user: { name: '许清', employee_no: 'A1130' },
    role_snapshot: '运营主管',
    messages: 9,
    tool_calls: 2,
    bad_count: 1,
    has_intercept: false,
    last_at: '2026-11-18T16:48:12+08:00',
  },
  {
    id: 'ses_20261117_0004',
    title: '跨会员空间数据导出请求',
    user: { name: '沈迟', employee_no: 'S2098' },
    role_snapshot: '招商顾问',
    messages: 7,
    tool_calls: 4,
    bad_count: 0,
    has_intercept: true,
    last_at: '2026-11-17T09:12:55+08:00',
  },
  {
    id: 'ses_20261115_0005',
    title: '知识库 SOP 检索（保洁巡检）',
    user: { name: '顾南', employee_no: 'S2110' },
    role_snapshot: '资源经理',
    messages: 5,
    tool_calls: 1,
    bad_count: 0,
    has_intercept: false,
    last_at: '2026-11-15T11:30:02+08:00',
  },
  {
    id: 'ses_20261112_0006',
    title: '商机流转阶段说明',
    user: { name: '许清', employee_no: 'A1130' },
    role_snapshot: '运营主管',
    messages: 6,
    tool_calls: 2,
    bad_count: 0,
    has_intercept: false,
    last_at: '2026-11-12T15:20:33+08:00',
  },
];

const MAIN_SESSION_ITEMS: AuditItem[] = [
  {
    seq: 1,
    kind: 'user',
    at: '2026-11-20T14:20:11+08:00',
    role_snapshot: '招商顾问',
    model: 'assistant-core-v3',
    prompt_version: 'pv-2026.11.3',
    content_raw: '帮我核对一下会员企业「星野智造」的年框续签条款，联系人手机号 13812341234，邮箱 shen.chi@example.com，签约人身份证 310101199001011234，历史合同在附件里。',
    content_masked: '帮我核对一下会员企业「星野智造」的年框续签条款，联系人手机号 138****1234，邮箱 s***@example.com，签约人身份证 310101********1234，历史合同在附件里。',
  },
  {
    seq: 2,
    kind: 'assistant',
    at: '2026-11-20T14:20:39+08:00',
    role_snapshot: '招商顾问',
    model: 'assistant-core-v3',
    prompt_version: 'pv-2026.11.3',
    content_raw: '已找到 3 条与年框续签相关的条款依据：价格调整机制、服务范围变更、以及提前 30 天书面通知的解约条款。按会员政策，续签价格调整需在合同到期前 60 天发起，本次时间窗口充裕。',
    content_masked: '已找到 3 条与年框续签相关的条款依据：价格调整机制、服务范围变更、以及提前 30 天书面通知的解约条款。按会员政策，续签价格调整需在合同到期前 60 天发起，本次时间窗口充裕。',
    citations: [
      { no: 1, title: '会员企业年框服务合同（2025 版）第 7.2 条 价格调整机制', source_id: 'kb_10023' },
      { no: 2, title: '会员服务范围与变更流程 SOP', source_id: 'kb_10088' },
      { no: 3, title: '合同解约与续签管理办法', source_id: 'kb_10190' },
    ],
  },
  {
    seq: 3,
    kind: 'tool',
    at: '2026-11-20T14:21:05+08:00',
    role_snapshot: '招商顾问',
    model: 'assistant-core-v3',
    prompt_version: 'pv-2026.11.3',
    content_raw: '调用 CRM 合同检索接口，按会员企业名称查历史合同。',
    content_masked: '调用 CRM 合同检索接口，按会员企业名称查历史合同。',
    tool: {
      name: 'crm_lookup',
      args: {
        member_name: '星野智造',
        contract_type: 'annual_frame',
        include_expired: true,
        contact_phone: '13812341234',
      },
      result_summary: '命中 4 份历史合同，最近一份签署于 2025-12-01，服务期至 2026-11-30，年框金额 486000.00 元。',
      confirmed_by: '沈迟（S2098）',
      confirmed_at: '2026-11-20T14:21:03+08:00',
    },
  },
  {
    seq: 4,
    kind: 'intercept',
    at: '2026-11-20T14:25:47+08:00',
    role_snapshot: '招商顾问',
    model: 'assistant-core-v3',
    prompt_version: 'pv-2026.11.3',
    content_raw: '尝试将「星野智造」的会员联系人明细导出为 CSV 并提供下载链接。',
    content_masked: '尝试将「星野智造」的会员联系人明细导出为 CSV 并提供下载链接。',
    intercept: {
      reason: '会员联系人明细属于受限数据，超出招商顾问的数据范围，导出请求被策略引擎拦截。',
      policy_name: 'data_scope.member_contact_export',
      shutdown: true,
    },
  },
  {
    seq: 5,
    kind: 'feedback',
    at: '2026-11-20T14:32:07+08:00',
    role_snapshot: '招商顾问',
    model: 'assistant-core-v3',
    prompt_version: 'pv-2026.11.3',
    content_raw: '用户对第 2 条回答点了「踩」：引用条款版本不是最新的，请核对 2026 版。',
    content_masked: '用户对第 2 条回答点了「踩」：引用条款版本不是最新的，请核对 2026 版。',
    feedback: {
      verdict: 'down',
      reason: '引用不准确',
      note: '引用的是 2025 版条款，2026 版已调整价格调整窗口期。',
    },
  },
];

export function sessionDetail(sessionId: string): AuditSessionDetailResponse {
  const summary = SESSIONS.find((item) => item.id === sessionId) ?? SESSIONS[0];
  const items = sessionId === SESSIONS[0].id ? MAIN_SESSION_ITEMS : MAIN_SESSION_ITEMS.slice(0, 2);
  const redactionCount = items.reduce((sum, item) => {
    let hits = 0;
    if (item.content_raw !== item.content_masked) {
      hits += 3;
    }
    if (item.tool) {
      hits += 1;
    }
    return sum + hits;
  }, 0);

  return {
    id: summary.id,
    title: summary.title,
    role_snapshot: summary.role_snapshot,
    redaction_count: redactionCount,
    items,
  };
}
