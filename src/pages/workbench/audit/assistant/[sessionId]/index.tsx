/**
 * 助手对话审计 · 详情回放。
 * 路由：/workbench/audit/assistant/:sessionId
 * 按时间正序回放五类条目；原文/脱敏切换只改文本不改布局（AC3）。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Alert, Button, Skeleton, Tag } from 'tdesign-react';
import { ChevronLeftIcon } from 'tdesign-icons-react';
import { useAuditGuard } from '@/hooks/useAuditGuard';
import { fetchSessionDetail } from '@/services/audit';
import type { AuditItem } from '@/schemas/audit';
import { MessageItem } from '../message-item';
import { RedactionToggle } from '../redaction-toggle';
import { useAuditView } from '../use-audit-view';

export default function AssistantAuditDetailPage() {
  const guard = useAuditGuard();
  const { sessionId = '' } = useParams();
  const [view, setView] = useAuditView();

  const detailQuery = useQuery({
    queryKey: ['audit-session', sessionId],
    queryFn: () => fetchSessionDetail(sessionId),
    enabled: guard.status === 'allowed' && Boolean(sessionId),
  });

  const items = useMemo<AuditItem[]>(() => detailQuery.data?.items ?? [], [detailQuery.data]);

  const sorted = useMemo(
    () => items.slice().sort((a, b) => a.seq - b.seq),
    [items],
  );

  // 拦截事件（关停）之后的消息逐个标注，不隐藏。
  const shutdownSeq = useMemo(() => {
    const hit = sorted.find((item) => item.intercept?.shutdown);
    return hit ? hit.seq : null;
  }, [sorted]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 24);
  };

  const backToLatest = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (typeof el.scrollTo === 'function') {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (detailQuery.isSuccess) backToLatest();
  }, [detailQuery.isSuccess, backToLatest]);

  if (guard.status !== 'allowed') {
    return null;
  }

  const redactionCount = detailQuery.data?.redaction_count ?? 0;

  return (
    <div className="page page--detail">
      <header className="page__head page__head--detail">
        <div>
          <Link className="back-link" to="/workbench/audit/assistant" data-testid="back-to-list">
            <ChevronLeftIcon /> 返回会话列表
          </Link>
          <h1 className="page__title" data-testid="detail-title">
            {detailQuery.data?.title ?? '会话回放'}
          </h1>
          <p className="page__subtitle">
            会话 ID <code data-testid="detail-session-id">{sessionId}</code> · 角色快照{' '}
            {detailQuery.data?.role_snapshot ?? '-'}
          </p>
        </div>
        <RedactionToggle view={view} onChange={setView} />
      </header>

      <Alert
        className="audit-notice"
        theme="warning"
        message={
          <div className="audit-notice__body">
            <strong>查看与导出行为本身会被记录</strong>
            <span>会话回放同样写入审计日志，不可关闭。</span>
          </div>
        }
      />

      {view === 'masked' ? (
        <Alert
          className="redaction-notice"
          theme="info"
          message={
            <div className="audit-notice__body">
              <strong data-testid="redaction-notice">
                当前为脱敏视图，共脱敏 {redactionCount} 处
              </strong>
              <span>手机号显示为 138****1234，邮箱显示为 a***@b.com，身份证保留前 6 后 4。</span>
            </div>
          }
        />
      ) : null}

      <div className="detail-layout">
        <div
          className="timeline"
          ref={scrollRef}
          onScroll={handleScroll}
          tabIndex={0}
          role="region"
          aria-label="会话时间线"
          data-testid="timeline"
          data-view={view}
        >
          {detailQuery.isLoading ? <Skeleton theme="paragraph" animation="gradient" /> : null}
          {detailQuery.isError ? (
            <Alert theme="error" message="会话详情加载失败，请返回列表后重试。" />
          ) : null}

          {sorted.map((item) => (
            <MessageItem
              key={item.seq}
              item={item}
              view={view}
              afterShutdown={shutdownSeq !== null && item.seq > shutdownSeq}
            />
          ))}

          {detailQuery.isSuccess && sorted.length === 0 ? (
            <p className="timeline__empty">该会话没有可回放的条目。</p>
          ) : null}
        </div>

        {!atBottom ? (
          <Button
            className="back-to-latest"
            shape="circle"
            theme="primary"
            data-testid="back-to-latest"
            onClick={backToLatest}
            aria-label="回到最新"
          >
            最新
          </Button>
        ) : null}
      </div>

      <footer className="page__foot">
        <Tag variant="light" theme="default">
          共 {sorted.length} 条条目 · 时间按 Asia/Shanghai 显示到秒
        </Tag>
      </footer>
    </div>
  );
}
