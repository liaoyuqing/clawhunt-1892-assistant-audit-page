/**
 * 测试工具：把单页包进 QueryClientProvider + MemoryRouter，
 * 并用 MSW server 接管 fetch，方便断言「审计接口零请求」。
 */
import type { ReactElement } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

export function makeTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export interface RenderPageOptions {
  path?: string;
  route?: string;
}

/** 记录当前 location，用于断言守卫跳转目标。 */
export function LocationProbe({ onChange }: { onChange: (path: string) => void }) {
  const location = useLocation();
  onChange(location.pathname);
  return null;
}

export function renderPage(
  element: ReactElement,
  { path = '/', route = '/' }: RenderPageOptions = {},
): RenderResult & { queryClient: QueryClient } {
  const queryClient = makeTestQueryClient();
  const result = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={element} />
          <Route path="/403" element={<div data-testid="forbidden-page">403 无权限</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...result, queryClient };
}
