/**
 * 助手对话审计 · 列表页。
 * 路由：/workbench/audit/assistant
 * 仅审计角色可见（AC1）；筛选与 90 天限制（AC2）；导出（AC4）。
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, Skeleton, Table } from 'tdesign-react';
import { ShieldErrorIcon } from 'tdesign-icons-react';
import { useAuditGuard } from '@/hooks/useAuditGuard';
import { fetchSessions } from '@/services/audit';
import type { AuditFilters, AuditSessionSummary } from '@/schemas/audit';
import { AuditFiltersPanel } from './filters';
import { ExportBar } from './export-bar';
import { AVAILABLE_TOOLS, SESSIONS } from '@/mocks/fixtures';

const PAGE_SIZE = 20;

/** 工号候选去重（同一用户可能在多条会话里出现）。 */
const userCandidates = Array.from(
  new Map(SESSIONS.map((session) => [session.user.employee_no, session.user])).values(),
);

function filtersFromParams(params: URLSearchParams): AuditFilters {
  const tri = (key: string): boolean | null => {
    const raw = params.get(key);
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return null;
  };
  return {
    user_no: params.get('user_no') ?? '',
    from: params.get('from'),
    to: params.get('to'),
    tools: params.getAll('tools'),
    has_bad: tri('has_bad'),
    intercepted: tri('intercepted'),
    overreach: tri('overreach'),
  };
}

function paramsFromFilters(filters: AuditFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.user_no) params.set('user_no', filters.user_no);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  filters.tools.forEach((tool) => params.append('tools', tool));
  if (filters.has_bad !== null) params.set('has_bad', String(filters.has_bad));
  if (filters.intercepted !== null) params.set('intercepted', String(filters.intercepted));
  if (filters.overreach !== null) params.set('overreach', String(filters.overreach));
  return params;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export default function AssistantAuditListPage() {
  const guard = useAuditGuard();
  const [params, setParams] = useSearchParams();

  const applied = useMemo(() => filtersFromParams(params), [params]);

  // 截图 / 演示预设：draft_from / draft_to 只填筛选草稿，不参与查询，
  // 用于展示「跨度超限 → 按钮禁用 + 红字提示」而列表仍有数据的状态。
  const [draft, setDraft] = useState<AuditFilters>(() => {
    const seeded = filtersFromParams(params);
    return {
      ...seeded,
      from: params.get('draft_from') ?? seeded.from,
      to: params.get('draft_to') ?? seeded.to,
    };
  });
  const [page, setPage] = useState(1);

  // URL 变了（含刷新/回退）时同步草稿；首次挂载保留预设草稿，不覆盖。
  const syncedRef = useRef(false);
  useEffect(() => {
    if (!syncedRef.current) {
      syncedRef.current = true;
      return;
    }
    setDraft(applied);
  }, [applied]);

  const listQuery = useQuery({
    queryKey: ['audit-sessions', applied],
    queryFn: () => fetchSessions(applied),
    enabled: guard.status === 'allowed',
  });

  if (guard.status !== 'allowed') {
    // 守卫未通过时不渲染页面骨架，避免闪屏；导航已由 hook 完成。
    return null;
  }

  const items: AuditSessionSummary[] = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = () => {
    setPage(1);
    setParams(paramsFromFilters(draft), { replace: true });
  };

  return (
    <div className="page page--list">
      <header className="page__head">
        <div>
          <h1 className="page__title">助手对话审计</h1>
          <p className="page__subtitle">
            员工 AI 助手入口 · 会话检索与回放 · 数据范围：本会员空间
          </p>
        </div>
      </header>

      {/* 页面顶部固定提示：查看与导出行为本身会被记录（需求原文）。 */}
      <Alert
        className="audit-notice"
        theme="warning"
        message={
          <div className="audit-notice__body">
            <strong>查看与导出行为本身会被记录</strong>
            <span>本页面的检索、回放与导出操作均写入审计日志，记录操作人、时间与筛选条件。</span>
          </div>
        }
      />

      <AuditFiltersPanel
        value={draft}
        onChange={setDraft}
        onSearch={handleSearch}
        loading={listQuery.isFetching}
        candidates={userCandidates}
        toolOptions={AVAILABLE_TOOLS}
      />

      <ExportBar filters={applied} />

      <section className="table-card" aria-label="会话列表">
        {listQuery.isLoading ? (
          <Skeleton theme="paragraph" animation="gradient" />
        ) : listQuery.isError ? (
          <Alert theme="error" message="会话列表加载失败，请稍后重试或联系管理员。" />
        ) : (
          <>
            <div className="table-card__meta">
              共 <strong data-testid="list-total">{total}</strong> 条会话
            </div>
            <Table
              data={pageItems}
              rowKey="id"
              hover
              empty={'没有符合条件的会话'}
              columns={[
                {
                  colKey: 'title',
                  title: '会话标题',
                  cell: ({ row }) => (
                    <Link
                      className="session-link"
                      to={`/workbench/audit/assistant/${row.id}`}
                      data-testid={`session-link-${row.id}`}
                    >
                      {row.has_intercept ? (
                        <span className="session-link__shield" title="含拦截事件">
                          <ShieldErrorIcon />
                        </span>
                      ) : null}
                      {row.title}
                    </Link>
                  ),
                },
                {
                  colKey: 'user',
                  title: '用户',
                  cell: ({ row }) => (
                    <span>
                      <code>{row.user.employee_no}</code> {row.user.name}
                    </span>
                  ),
                },
                { colKey: 'role_snapshot', title: '角色快照' },
                { colKey: 'messages', title: '消息数' },
                { colKey: 'tool_calls', title: '工具调用数' },
                {
                  colKey: 'bad_count',
                  title: '差评数',
                  cell: ({ row }) => (
                    <span className={row.bad_count > 0 ? 'bad-count bad-count--alert' : 'bad-count'}>
                      {row.bad_count}
                    </span>
                  ),
                },
                {
                  colKey: 'last_at',
                  title: '最后时间',
                  cell: ({ row }) => <span>{formatDateTime(row.last_at)}</span>,
                },
              ]}
              pagination={{
                current: page,
                pageSize: PAGE_SIZE,
                total,
                showJumper: false,
                onChange: (info) => setPage(info.current),
              }}
            />
            {pageItems.length === 0 ? (
              <div className="table-card__empty" data-testid="list-empty">
                <p>没有符合条件的会话</p>
                <p className="table-card__empty-hint">调整筛选条件后重新查询，筛选区会保留。</p>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
