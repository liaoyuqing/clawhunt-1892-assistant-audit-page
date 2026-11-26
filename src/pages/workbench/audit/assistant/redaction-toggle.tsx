/**
 * 原文 / 脱敏视图切换（AC3）。
 * 切换只改文本节点，不改布局；状态写进 URL 的 view=raw|masked，便于分享复现。
 */
import { Segmented } from '@/components/segmented';
import type { AuditView } from '@/schemas/audit';

export interface RedactionToggleProps {
  view: AuditView;
  onChange: (next: AuditView) => void;
}

const OPTIONS = [
  { value: 'raw' as AuditView, label: '原文' },
  { value: 'masked' as AuditView, label: '脱敏文本' },
];

export function RedactionToggle({ view, onChange }: RedactionToggleProps) {
  return (
    <div className="redaction-toggle">
      <span className="redaction-toggle__label">查看方式</span>
      <Segmented
        options={OPTIONS}
        value={view}
        onChange={onChange}
        ariaLabel="原文与脱敏文本切换"
      />
    </div>
  );
}
