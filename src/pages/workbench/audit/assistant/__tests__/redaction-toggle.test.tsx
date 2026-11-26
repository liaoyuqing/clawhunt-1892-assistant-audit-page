/**
 * AC3：详情页原文 / 脱敏切换 —— 只改文本节点，不改布局；状态写 URL view=raw|masked。
 */
import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import AssistantAuditDetailPage from '@/pages/workbench/audit/assistant/[sessionId]';
import { makeTestQueryClient } from '@/test/render-app';
import { mockState } from '@/mocks/state';
import '@/test/setup-server';

function LocationReporter() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}

function renderDetail() {
  mockState.role = 'auditor';
  const queryClient = makeTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/workbench/audit/assistant/ses_20261120_0001']}>
        <LocationReporter />
        <Routes>
          <Route
            path="/workbench/audit/assistant/:sessionId"
            element={<AssistantAuditDetailPage />}
          />
          <Route path="/403" element={<div data-testid="forbidden-page">403</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const RAW_PHONE = '13812341234';
const MASKED_PHONE = '138****1234';

describe('AC3 原文 / 脱敏切换', () => {
  it('默认原文视图显示完整手机号；切到脱敏后文本变化、条目数量不变', async () => {
    const user = userEvent.setup();
    renderDetail();

    const userText = await screen.findByTestId('msg-text-1');
    expect(userText).toHaveTextContent(RAW_PHONE);
    expect(userText).not.toHaveTextContent(MASKED_PHONE);

    const articlesBefore = document.querySelectorAll('article.msg');
    const countBefore = articlesBefore.length;
    expect(countBefore).toBe(5);

    await user.click(screen.getByRole('button', { name: '脱敏文本' }));

    await waitFor(() => {
      expect(screen.getByTestId('msg-text-1')).toHaveTextContent(MASKED_PHONE);
    });

    // 布局不变：条目数量一致，且仍是同一批 seq。
    const articlesAfter = document.querySelectorAll('article.msg');
    expect(articlesAfter.length).toBe(countBefore);
    const seqsBefore = Array.from(articlesBefore).map((el) => el.getAttribute('data-seq'));
    const seqsAfter = Array.from(articlesAfter).map((el) => el.getAttribute('data-seq'));
    expect(seqsAfter).toEqual(seqsBefore);

    // 顶部出现脱敏提示（共脱敏 N 处）。
    expect(screen.getByTestId('redaction-notice')).toHaveTextContent('当前为脱敏视图，共脱敏');
  });

  it('切换状态写入 URL 的 view 参数，可分享复现', async () => {
    const user = userEvent.setup();
    renderDetail();

    await screen.findByTestId('msg-text-1');
    expect(screen.getByTestId('location')).toHaveTextContent('view=raw');

    await user.click(screen.getByRole('button', { name: '脱敏文本' }));
    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('view=masked');
    });

    await user.click(screen.getByRole('button', { name: '原文' }));
    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('view=raw');
    });
  });

  it('脱敏视图把邮箱与身份证也按规则处理，原文不受影响', async () => {
    const user = userEvent.setup();
    renderDetail();

    await screen.findByTestId('msg-text-1');
    await user.click(screen.getByRole('button', { name: '脱敏文本' }));

    await waitFor(() => {
      const text = screen.getByTestId('msg-text-1').textContent ?? '';
      expect(text).toContain('s***@example.com');
      expect(text).toContain('310101********1234');
      expect(text).not.toContain('310101199001011234');
    });
  });
});
