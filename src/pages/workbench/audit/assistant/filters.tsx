/**
 * 列表页筛选区。
 * 90 天限制（AC2）：跨度 > 90 天时「查询」按钮 disabled，并给出红字提示。
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, DateRangePicker, Input, Select } from 'tdesign-react';
import { SearchIcon } from 'tdesign-icons-react';
import type { AuditFilters } from '@/schemas/audit';
import { RANGE_EXCEEDED_HINT, clampRange, isRangeExceeded, spanDays } from '@/utils/range';

export interface UserCandidate {
  name: string;
  employee_no: string;
}

export interface AuditFiltersPanelProps {
  value: AuditFilters;
  onChange: (next: AuditFilters) => void;
  onSearch: () => void;
  loading?: boolean;
  candidates?: UserCandidate[];
  toolOptions?: string[];
}

const BAD_OPTIONS = [
  { label: '不限', value: 'all' },
  { label: '有差评', value: 'yes' },
  { label: '无差评', value: 'no' },
];

const INTERCEPT_OPTIONS = [
  { label: '不限', value: 'all' },
  { label: '被关停拦截', value: 'yes' },
  { label: '未被拦截', value: 'no' },
];

const OVERREACH_OPTIONS = [
  { label: '不限', value: 'all' },
  { label: '含越权反馈', value: 'yes' },
  { label: '无越权反馈', value: 'no' },
];

function triToBool(value: string): boolean | null {
  if (value === 'yes') return true;
  if (value === 'no') return false;
  return null;
}

function boolToTri(value: boolean | null): string {
  if (value === true) return 'yes';
  if (value === false) return 'no';
  return 'all';
}

/** 工号搜索：200ms 防抖 + 下拉候选。 */
function UserPicker({
  value,
  candidates,
  onChange,
}: {
  value: string;
  candidates: UserCandidate[];
  onChange: (next: string) => void;
}) {
  const [keyword, setKeyword] = useState(value);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    setKeyword(value);
    setDebounced(value);
  }, [value]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const handleInput = (next: string) => {
    setKeyword(next);
    setOpen(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setDebounced(next);
      onChange(next);
    }, 200);
  };

  const options = useMemo(() => {
    const query = debounced.trim().toLowerCase();
    const pool = query
      ? candidates.filter(
          (item) =>
            item.employee_no.toLowerCase().includes(query) || item.name.includes(debounced.trim()),
        )
      : candidates;
    return pool.slice(0, 8).map((item) => ({
      label: `${item.employee_no} · ${item.name}`,
      value: item.employee_no,
    }));
  }, [candidates, debounced]);

  return (
    <div className="filter-field filter-field--user">
      <label className="filter-label" htmlFor="audit-user-no">
        用户（工号）
      </label>
      <Input
        name="audit-user-no"
        data-testid="filter-user-no"
        placeholder="输入工号，如 S2098"
        value={keyword}
        clearable
        onFocus={() => setOpen(true)}
        onChange={(next: string | number | undefined) => handleInput(String(next ?? ''))}
      />
      {open && options.length > 0 ? (
        <ul className="candidate-list" role="listbox" aria-label="工号候选">
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === keyword}
                onClick={() => {
                  setKeyword(option.value);
                  setDebounced(option.value);
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function AuditFiltersPanel({
  value,
  onChange,
  onSearch,
  loading = false,
  candidates = [],
  toolOptions = [],
}: AuditFiltersPanelProps) {
  const exceeded = isRangeExceeded(value);
  const days = value.from && value.to ? spanDays(value.from, value.to) : 0;

  const patch = (next: Partial<AuditFilters>) => onChange({ ...value, ...next });

  return (
    <section className="filters" aria-label="会话筛选">
      <div className="filters__row">
        <UserPicker
          value={value.user_no}
          candidates={candidates}
          onChange={(userNo) => patch({ user_no: userNo })}
        />

        <div className="filter-field filter-field--range">
          <span className="filter-label">时间范围</span>
          <DateRangePicker
            data-testid="filter-range"
            allowInput
            clearable
            format="YYYY-MM-DD"
            placeholder={['开始日期', '结束日期']}
            value={[value.from ?? '', value.to ?? '']}
            onChange={(next: Array<string | number | Date>) =>
              patch({
                from: (next?.[0] as string | null) ?? null,
                to: (next?.[1] as string | null) ?? null,
              })
            }
          />
          <span className="filter-hint" data-testid="range-days">
            {days > 0 ? `已选 ${days} 天（上限 90 天）` : '最长 90 天'}
          </span>
        </div>

        <div className="filter-field">
          <span className="filter-label">工具名</span>
          <Select
            data-testid="filter-tools"
            multiple
            clearable
            placeholder="不限"
            value={value.tools}
            options={toolOptions.map((tool) => ({ label: tool, value: tool }))}
            onChange={(next) => patch({ tools: (next as string[]) ?? [] })}
          />
        </div>

        <div className="filter-field">
          <span className="filter-label">是否差评</span>
          <Select
            data-testid="filter-bad"
            value={boolToTri(value.has_bad)}
            options={BAD_OPTIONS}
            onChange={(next) => patch({ has_bad: triToBool(String(next)) })}
          />
        </div>

        <div className="filter-field">
          <span className="filter-label">是否被关停拦截</span>
          <Select
            data-testid="filter-intercepted"
            value={boolToTri(value.intercepted)}
            options={INTERCEPT_OPTIONS}
            onChange={(next) => patch({ intercepted: triToBool(String(next)) })}
          />
        </div>

        <div className="filter-field">
          <span className="filter-label">是否含越权反馈</span>
          <Select
            data-testid="filter-overreach"
            value={boolToTri(value.overreach)}
            options={OVERREACH_OPTIONS}
            onChange={(next) => patch({ overreach: triToBool(String(next)) })}
          />
        </div>

        <div className="filters__actions">
          <Button
            data-testid="audit-search"
            tag="button"
            theme="primary"
            icon={<SearchIcon />}
            disabled={exceeded}
            loading={loading}
            title={exceeded ? RANGE_EXCEEDED_HINT : '按当前条件查询'}
            onClick={onSearch}
          >
            查询
          </Button>
        </div>
      </div>

      {exceeded ? (
        <p className="filters__error" role="alert" data-testid="range-error">
          {RANGE_EXCEEDED_HINT}
          <Button
            size="small"
            variant="text"
            theme="primary"
            data-testid="range-clamp"
            onClick={() => onChange({ ...value, ...clampRange(value) })}
          >
            自动调整为 90 天
          </Button>
        </p>
      ) : null}
    </section>
  );
}
