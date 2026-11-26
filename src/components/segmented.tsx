/**
 * 轻量 Segmented 控件（TDesign React 未提供 Segmented，这里按其视觉规范实现）。
 * AC3 要求：切换只影响文本节点、不改变布局，控件带 aria-pressed 且切换后焦点留在控件上。
 */
import { useRef } from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedProps<T extends string> {
  options: Array<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelect = (next: T) => {
    if (next === value) return;
    onChange(next);
    // 焦点保持在控件上：切换后不丢失键盘焦点。
    requestAnimationFrame(() => {
      const active = containerRef.current?.querySelector<HTMLButtonElement>(
        `[data-value="${next}"]`,
      );
      active?.focus();
    });
  };

  return (
    <div className="segmented" role="group" aria-label={ariaLabel} ref={containerRef}>
      {options.map((option) => {
        const pressed = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            data-value={option.value}
            className={`segmented__item${pressed ? ' segmented__item--active' : ''}`}
            aria-pressed={pressed}
            onClick={() => handleSelect(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
