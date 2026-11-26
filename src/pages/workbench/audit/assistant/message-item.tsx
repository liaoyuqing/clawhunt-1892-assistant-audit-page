/**
 * 会话回放的单条条目：用户消息 / 助手回答 / 工具调用 / 拦截事件 / 反馈。
 * - 助手回答带引用编号上标，点击展开来源标题。
 * - 工具调用折叠卡显示参数、结果摘要、确认人与确认时间。
 * - 每条底部显示模型名与提示词版本。
 * - view=raw|masked 只切换文本节点，DOM 结构与条目数量不变。
 */
import { useMemo, useState } from 'react';
import { Button, Tag } from 'tdesign-react';
import {
  ChatBubbleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ErrorCircleIcon,
  ShieldErrorIcon,
  ThumbDownIcon,
  ThumbUpIcon,
  ToolsIcon,
  UserTalkIcon,
} from 'tdesign-icons-react';
import type { AuditItem, AuditView } from '@/schemas/audit';
import { redactText, redactValue } from '@/utils/redact';
import { IconBadge } from '@/components/icon-badge';
import { ModelBadge } from '@/components/model-badge';

const KIND_LABEL: Record<AuditItem['kind'], string> = {
  user: '用户',
  assistant: '助手',
  tool: '工具',
  intercept: '拦截',
  feedback: '反馈',
};

const ARG_FOLD_LIMIT = 2000;
const ARG_PREVIEW = 500;

export interface MessageItemProps {
  item: AuditItem;
  view: AuditView;
  /** 该条目是否发生在会话被关停之后（审计需完整回放，此处只标注不隐藏）。 */
  afterShutdown?: boolean;
}

export function MessageItem({ item, view, afterShutdown = false }: MessageItemProps) {
  const [argsExpanded, setArgsExpanded] = useState(false);
  const [openCitation, setOpenCitation] = useState<number | null>(null);

  // 老数据若无 content_masked，则前端按规则实时脱敏并打「本地脱敏」标签。
  const { content, localFallback } = useMemo(() => {
    if (view === 'raw') return { content: item.content_raw, localFallback: false };
    if (item.content_masked) return { content: item.content_masked, localFallback: false };
    return { content: redactText(item.content_raw).text, localFallback: true };
  }, [item.content_raw, item.content_masked, view]);

  const toolArgs = useMemo(() => {
    if (!item.tool) return '';
    const source = view === 'masked' ? redactValue(item.tool.args).value : item.tool.args;
    return JSON.stringify(source, null, 2);
  }, [item.tool, view]);

  const toolArgsText =
    toolArgs.length > ARG_FOLD_LIMIT && !argsExpanded
      ? `${toolArgs.slice(0, ARG_PREVIEW)}\n…（已折叠，共 ${toolArgs.length} 字符）`
      : toolArgs;

  const citations = item.citations ?? [];

  return (
    <article
      className={`msg msg--${item.kind}`}
      data-testid={`msg-${item.kind}-${item.seq}`}
      data-kind={item.kind}
      data-seq={item.seq}
    >
      <header className="msg__head">
        <IconBadge tone={item.kind} label={KIND_LABEL[item.kind]} icon={iconFor(item.kind)} />
        <span className="msg__role">{item.role_snapshot}</span>
        <time className="msg__time" dateTime={item.at}>
          {formatTime(item.at)}
        </time>
        {afterShutdown ? (
          <Tag size="small" theme="danger" variant="light">
            此后会话已关停
          </Tag>
        ) : null}
      </header>

      <div className={`msg__body msg__body--${item.kind}`}>
        <p className="msg__text" data-testid={`msg-text-${item.seq}`}>
          {content}
          {citations.map((citation) => (
            <span key={citation.no} className="citation">
              <button
                type="button"
                className={`citation__sup${openCitation === citation.no ? ' citation__sup--open' : ''}`}
                aria-label={`引用 ${citation.no}，来源：${citation.title}`}
                aria-expanded={openCitation === citation.no}
                data-testid={`citation-button-${item.seq}-${citation.no}`}
                onClick={() =>
                  setOpenCitation((prev) => (prev === citation.no ? null : citation.no))
                }
              >
                [{citation.no}]
              </button>
            </span>
          ))}
        </p>

        {localFallback ? <span className="msg__local-tag">本地脱敏</span> : null}

        {citations.length > 0 && openCitation !== null ? (
          <div className="citation__sources" data-testid={`citation-sources-${item.seq}`}>
            {citations
              .filter((citation) => citation.no === openCitation)
              .map((citation) => (
                <div key={citation.no} className="citation__source">
                  <span className="citation__no">[{citation.no}]</span>
                  <span className="citation__title" data-testid={`citation-title-${item.seq}`}>
                    {view === 'masked' ? redactValue(citation.title).value : citation.title}
                  </span>
                  <code className="citation__id">{citation.source_id}</code>
                </div>
              ))}
          </div>
        ) : null}

        {item.tool ? (
          <div className="tool-card" data-testid={`tool-card-${item.seq}`}>
            <div className="tool-card__head">
              <ToolsIcon />
              <strong className="tool-card__name">{item.tool.name}</strong>
              <Button
                type="button"
                size="small"
                variant="text"
                data-testid={`tool-toggle-${item.seq}`}
                onClick={() => setArgsExpanded((prev) => !prev)}
              >
                {argsExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                {argsExpanded ? '收起参数' : '展开参数'}
              </Button>
            </div>
            <pre className="tool-card__args" data-testid={`tool-args-${item.seq}`}>
              {toolArgsText}
            </pre>
            <p className="tool-card__result">
              <span className="tool-card__label">结果摘要</span>
              {item.tool.result_summary}
            </p>
            <div className="tool-card__confirm">
              <span className="tool-card__label">确认人</span>
              <span data-testid={`tool-confirm-${item.seq}`}>
                {item.tool.confirmed_by} · {formatTime(item.tool.confirmed_at)}
              </span>
            </div>
          </div>
        ) : null}

        {item.intercept ? (
          <div className="intercept-card" data-testid={`intercept-card-${item.seq}`} role="alert">
            <p className="intercept-card__row">
              <span className="intercept-card__label">拦截原因</span>
              {item.intercept.reason}
            </p>
            <p className="intercept-card__row">
              <span className="intercept-card__label">命中策略</span>
              <code>{item.intercept.policy_name}</code>
            </p>
            <div className="intercept-card__row">
              <span className="intercept-card__label">是否关停</span>
              <Tag size="small" theme={item.intercept.shutdown ? 'danger' : 'default'}>
                {item.intercept.shutdown ? '已关停本次会话' : '仅拦截本次调用'}
              </Tag>
            </div>
          </div>
        ) : null}

        {item.feedback ? (
          <div className="feedback-card" data-testid={`feedback-card-${item.seq}`}>
            <span className={`feedback-card__verdict feedback-card__verdict--${item.feedback.verdict}`}>
              {item.feedback.verdict === 'up' ? <ThumbUpIcon /> : <ThumbDownIcon />}
              {item.feedback.verdict === 'up' ? '点赞' : '点踩'}
            </span>
            {item.feedback.reason ? (
              <span className="feedback-card__reason">原因：{item.feedback.reason}</span>
            ) : null}
            {item.feedback.note ? <p className="feedback-card__note">{item.feedback.note}</p> : null}
          </div>
        ) : null}
      </div>

      <footer className="msg__foot">
        <ModelBadge model={item.model} promptVersion={item.prompt_version} />
      </footer>
    </article>
  );
}

function iconFor(kind: AuditItem['kind']) {
  switch (kind) {
    case 'user':
      return <UserTalkIcon />;
    case 'assistant':
      return <ChatBubbleIcon />;
    case 'tool':
      return <ToolsIcon />;
    case 'intercept':
      return <ShieldErrorIcon />;
    case 'feedback':
      return <ErrorCircleIcon />;
    default:
      return <CheckCircleIcon />;
  }
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
