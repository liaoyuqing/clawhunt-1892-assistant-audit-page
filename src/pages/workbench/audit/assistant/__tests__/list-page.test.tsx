/**
 * 列表页：表格列、空结果状态、筛选写 URL。
 */
import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import AssistantAuditListPage from '@/pages/workbench/audit/assistant';
import { makeTestQueryClient } from '@/test/render-app';
import { mockState } from '@/mocks/state';
import '@/test/setup-server';

function LocationReporter() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}

function renderList() {
  mockState.role = 'auditor';
  const queryClient = makeTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/workbench/audit/assistant']}>
        <LocationReporter />
        <Routes>
          <Route path="/workbench/audit/assistant" element={<AssistantAuditListPage />} />
          <Route path="/403" element={<div data-testid="forbidden-page">403</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('审计列表页', () => {
  it('渲染表格七列与六条会话', async () => {
    renderList();

    expect(await screen.findByTestId('list-total')).toHaveTextContent('6');
    ['会话标题', '用户', '角色快照', '消息数', '工具调用数', '差评数', '最后时间'].forEach(
      (title) => {
        expect(screen.getAllByText(title).length).toBeGreaterThan(0);
      },
    );
  });

  it('空结果状态显示「没有符合条件的会话」并保留筛选区', async () => {
    mockState.listState = 'empty';
    renderList();

    await waitFor(() => {
      expect(screen.getByTestId('list-empty')).toBeInTheDocument();
    });
    expect(screen.getByTestId('list-empty')).toHaveTextContent('没有符合条件的会话');
    // 筛选区仍在
    expect(screen.getByTestId('audit-search')).toBeInTheDocument();
  });

  it('查询后把筛选条件写入 URL query', async () => {
    const user = userEvent.setup();
    renderList();

    await screen.findByTestId('list-total');

    const field = screen.getByTestId('filter-user-no');
    const userInput = field.tagName === 'INPUT' ? field : (field.querySelector('input') as HTMLInputElement);
    await user.type(userInput, 'S209');

    // 从工号候选里选一条（候选点击是同步 onChange，不受 200ms 防抖影响）。
    const option = await screen.findByRole('option', { name: /S2098 · 沈迟/ });
    await user.click(option);

    await user.click(screen.getByTestId('audit-search'));

    await waitFor(
      () => {
        expect(screen.getByTestId('location')).toHaveTextContent('user_no=S2098');
      },
      { timeout: 3000 },
    );
  });

  it('页面顶部固定提示「查看与导出行为本身会被记录」', async () => {
    renderList();
    expect(await screen.findByText('查看与导出行为本身会被记录')).toBeInTheDocument();
  });
});
