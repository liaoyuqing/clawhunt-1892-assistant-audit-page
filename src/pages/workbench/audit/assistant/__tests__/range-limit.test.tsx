/**
 * AC2：时间范围超过 90 天时查询按钮禁用并提示（组件测试）。
 * 直接构造 91 天跨度。
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { AuditFiltersPanel } from '@/pages/workbench/audit/assistant/filters';
import { DEFAULT_FILTERS, type AuditFilters } from '@/schemas/audit';
import { RANGE_EXCEEDED_HINT, spanDays } from '@/utils/range';
import '@/test/setup-server';

function Harness({ initial }: { initial: AuditFilters }) {
  const [value, setValue] = useState(initial);
  return <AuditFiltersPanel value={value} onChange={setValue} onSearch={() => {}} />;
}

describe('AC2 90 天时间跨度限制', () => {
  it('跨度 91 天时查询按钮禁用，并出现红字提示', () => {
    const initial: AuditFilters = { ...DEFAULT_FILTERS, from: '2026-08-01', to: '2026-10-30' };
    expect(spanDays('2026-08-01', '2026-10-30')).toBe(91);

    render(<Harness initial={initial} />);

    const button = screen.getByTestId('audit-search');
    expect(button).toBeDisabled();
    expect(screen.getByTestId('range-error')).toHaveTextContent(RANGE_EXCEEDED_HINT);
    expect(screen.getByTestId('range-error')).toHaveTextContent('不能超过 90 天');
  });

  it('跨度恰好 90 天时按钮可用、无提示（边界）', () => {
    const initial: AuditFilters = { ...DEFAULT_FILTERS, from: '2026-08-01', to: '2026-10-29' };
    expect(spanDays('2026-08-01', '2026-10-29')).toBe(90);

    render(<Harness initial={initial} />);

    expect(screen.getByTestId('audit-search')).not.toBeDisabled();
    expect(screen.queryByTestId('range-error')).not.toBeInTheDocument();
  });

  it('点击「自动调整为 90 天」后按钮恢复可用', async () => {
    const user = userEvent.setup();
    const initial: AuditFilters = { ...DEFAULT_FILTERS, from: '2026-08-01', to: '2026-10-30' };

    render(<Harness initial={initial} />);
    expect(screen.getByTestId('audit-search')).toBeDisabled();

    await user.click(screen.getByTestId('range-clamp'));

    expect(screen.getByTestId('audit-search')).not.toBeDisabled();
    expect(screen.queryByTestId('range-error')).not.toBeInTheDocument();
  });
});
