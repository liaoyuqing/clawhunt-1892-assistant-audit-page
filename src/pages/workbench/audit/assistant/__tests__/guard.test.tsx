/**
 * AC1：非审计角色访问该路由时跳转无权限页（测试）。
 * 断言：跳转 /403 一次；审计数据接口 fetch 次数为 0。
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AssistantAuditListPage from '@/pages/workbench/audit/assistant';
import { makeTestQueryClient } from '@/test/render-app';
import { mockState } from '@/mocks/state';
import '@/test/setup-server';

function renderWithForbiddenRoute() {
  const queryClient = makeTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/workbench/audit/assistant']}>
        <Routes>
          <Route path="/workbench/audit/assistant" element={<AssistantAuditListPage />} />
          <Route path="/403" element={<div data-testid="forbidden-page">403 无权限访问</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AC1 审计角色守卫', () => {
  beforeEach(() => {
    mockState.role = 'viewer';
    vi.restoreAllMocks();
  });

  it('非审计角色进入审计路由时跳转无权限页，且不发起任何审计数据请求', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    renderWithForbiddenRoute();

    await waitFor(() => {
      expect(screen.getByTestId('forbidden-page')).toBeInTheDocument();
    });

    // 断言：跳转目标为无权限页，且页面骨架不渲染。
    expect(screen.getByText('403 无权限访问')).toBeInTheDocument();
    expect(screen.queryByText('助手对话审计')).not.toBeInTheDocument();

    // 断言：只发生了权限查询，审计数据接口调用次数为 0。
    const urls = fetchSpy.mock.calls.map((call) => String(call[0]));
    const auditCalls = urls.filter((url) => url.includes('/api/audit/'));
    expect(auditCalls).toHaveLength(0);
    expect(urls.filter((url) => url.includes('/api/iam/me/permissions'))).toHaveLength(1);
  });

  it('审计角色可以正常渲染列表页（对照组）', async () => {
    mockState.role = 'auditor';
    renderWithForbiddenRoute();

    await waitFor(() => {
      expect(screen.getByText('助手对话审计')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('forbidden-page')).not.toBeInTheDocument();
    expect(await screen.findByTestId('list-total')).toHaveTextContent('6');
  });
});
