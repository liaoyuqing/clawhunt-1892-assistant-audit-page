/**
 * 详情回放的五类条目与引用上标展开。
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageItem } from '@/pages/workbench/audit/assistant/message-item';
import { sessionDetail } from '@/mocks/fixtures';
import type { AuditItem } from '@/schemas/audit';

const detail = sessionDetail('ses_20261120_0001');

function itemByKind(kind: AuditItem['kind']): AuditItem {
  const found = detail.items.find((item) => item.kind === kind);
  if (!found) throw new Error(`fixture 缺少 ${kind} 条目`);
  return found;
}

describe('详情回放条目', () => {
  it('五类条目都能渲染，且每条显示模型名与提示词版本', () => {
    render(
      <div>
        {detail.items.map((item) => (
          <MessageItem key={item.seq} item={item} view="raw" />
        ))}
      </div>,
    );

    expect(screen.getByTestId('msg-user-1')).toBeInTheDocument();
    expect(screen.getByTestId('msg-assistant-2')).toBeInTheDocument();
    expect(screen.getByTestId('msg-tool-3')).toBeInTheDocument();
    expect(screen.getByTestId('msg-intercept-4')).toBeInTheDocument();
    expect(screen.getByTestId('msg-feedback-5')).toBeInTheDocument();

    const badges = screen.getAllByTestId('model-badge');
    expect(badges).toHaveLength(5);
    badges.forEach((badge) => {
      expect(badge).toHaveTextContent('assistant-core-v3');
      expect(badge).toHaveTextContent('pv-2026.11.3');
    });
  });

  it('点击引用上标 [1] 展开来源标题，再次点击收起', async () => {
    const user = userEvent.setup();
    render(<MessageItem item={itemByKind('assistant')} view="raw" />);

    const button = screen.getByTestId('citation-button-2-1');
    expect(button).toHaveAttribute('aria-label', '引用 1，来源：会员企业年框服务合同（2025 版）第 7.2 条 价格调整机制');

    expect(screen.queryByTestId('citation-sources-2')).not.toBeInTheDocument();

    await user.click(button);

    expect(screen.getByTestId('citation-sources-2')).toBeInTheDocument();
    expect(screen.getByTestId('citation-title-2')).toHaveTextContent(
      '会员企业年框服务合同（2025 版）第 7.2 条 价格调整机制',
    );

    await user.click(button);
    expect(screen.queryByTestId('citation-sources-2')).not.toBeInTheDocument();
  });

  it('工具调用卡显示参数、结果摘要、确认人与确认时间', () => {
    render(<MessageItem item={itemByKind('tool')} view="raw" />);

    expect(screen.getByTestId('tool-card-3')).toHaveTextContent('crm_lookup');
    expect(screen.getByTestId('tool-args-3')).toHaveTextContent('member_name');
    expect(screen.getByTestId('tool-args-3')).toHaveTextContent('星野智造');
    expect(screen.getByTestId('tool-card-3')).toHaveTextContent('命中 4 份历史合同');
    expect(screen.getByTestId('tool-confirm-3')).toHaveTextContent('沈迟（S2098）');
    expect(screen.getByTestId('tool-confirm-3')).toHaveTextContent('2026-11-20 14:21:03');
  });

  it('拦截事件卡显示原因、策略名与关停标记', () => {
    render(<MessageItem item={itemByKind('intercept')} view="raw" />);

    const card = screen.getByTestId('intercept-card-4');
    expect(card).toHaveTextContent('会员联系人明细属于受限数据');
    expect(card).toHaveTextContent('data_scope.member_contact_export');
    expect(card).toHaveTextContent('已关停本次会话');
  });

  it('反馈条目显示点踩与原因', () => {
    render(<MessageItem item={itemByKind('feedback')} view="raw" />);

    const card = screen.getByTestId('feedback-card-5');
    expect(card).toHaveTextContent('点踩');
    expect(card).toHaveTextContent('引用不准确');
  });
});
