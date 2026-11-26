import type { ReactNode } from 'react';

export interface IconBadgeProps {
  icon: ReactNode;
  label: string;
  tone?: 'default' | 'user' | 'assistant' | 'tool' | 'intercept' | 'feedback';
}

/** 五类条目的图标 + 文字标签（不只靠颜色区分，满足可访问性）。 */
export function IconBadge({ icon, label, tone = 'default' }: IconBadgeProps) {
  return (
    <span className={`icon-badge icon-badge--${tone}`}>
      <span className="icon-badge__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="icon-badge__label">{label}</span>
    </span>
  );
}
