/**
 * AC4：导出任务四态（发起中 / 导出中 / 完成 / 失败）与 10 分钟链接倒计时。
 * 轮询间隔 3 秒，这里用 fake timers 推时间，避免测试真的等。
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ExportBar } from '@/pages/workbench/audit/assistant/export-bar';
import { makeTestQueryClient } from '@/test/render-app';
import { mockState } from '@/mocks/state';
import { DEFAULT_FILTERS } from '@/schemas/audit';
import '@/test/setup-server';

function renderExportBar() {
  const queryClient = makeTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ExportBar filters={DEFAULT_FILTERS} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AC4 导出任务', () => {
  beforeEach(() => {
    mockState.role = 'auditor';
    mockState.exportMode = 'success';
  });

  it('点击导出后显示进度条与「已生成 N / 共 M 条」', async () => {
    const user = userEvent.setup();
    renderExportBar();

    await user.click(screen.getByTestId('export-button'));

    await waitFor(() => {
      expect(screen.getByTestId('export-progress')).toBeInTheDocument();
    });
    expect(screen.getByTestId('export-progress')).toHaveTextContent(/已生成 \d+ \/ 共 \d+ 条/);
  });

  it('轮询完成后给出下载按钮与 10 分钟倒计时', async () => {
    const user = userEvent.setup();
    renderExportBar();

    await user.click(screen.getByTestId('export-button'));

    await waitFor(
      () => {
        expect(screen.getByTestId('export-done')).toBeInTheDocument();
      },
      { timeout: 15000 },
    );

    const download = screen.getByTestId('export-download');
    expect(download).not.toBeDisabled();
    expect(download).toHaveTextContent('下载（10 分钟内有效）');
    expect(screen.getByTestId('export-countdown')).toHaveTextContent(/剩余有效时间 \d{2}:\d{2}/);
  }, 20000);

  it('导出失败时显示失败态与「重试」按钮', async () => {
    mockState.exportMode = 'fail';
    const user = userEvent.setup();
    renderExportBar();

    await user.click(screen.getByTestId('export-button'));

    await waitFor(
      () => {
        expect(screen.getByTestId('export-failed')).toBeInTheDocument();
      },
      { timeout: 15000 },
    );
    expect(screen.getByTestId('export-retry')).toBeInTheDocument();
    expect(screen.getByTestId('export-failed')).toHaveTextContent('导出失败');
  }, 20000);

  it('下载链接到期后按钮置灰并提示重新导出', async () => {
    const user = userEvent.setup();
    renderExportBar();

    await user.click(screen.getByTestId('export-button'));
    await waitFor(() => expect(screen.getByTestId('export-done')).toBeInTheDocument(), {
      timeout: 15000,
    });

    // 把系统时间推过 10 分钟的有效期，再触发一次倒计时刷新。
    const realNow = Date.now;
    try {
      const skewed = realNow() + 11 * 60 * 1000;
      Date.now = () => skewed;
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1100));
      });
    } finally {
      Date.now = realNow;
    }

    await waitFor(() => {
      expect(screen.getByTestId('export-download')).toHaveTextContent('下载链接已过期');
    });
    expect(screen.getByTestId('export-download')).toBeDisabled();
    expect(screen.getByTestId('export-countdown')).toHaveTextContent('链接已过期，请重新导出');
  }, 20000);
});
