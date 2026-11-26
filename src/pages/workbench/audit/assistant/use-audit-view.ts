/** 把 view=raw|masked 与 URL query 双向绑定。 */
import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { AuditView } from '@/schemas/audit';

export function useAuditView(): [AuditView, (next: AuditView) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get('view');
  const view: AuditView = raw === 'masked' ? 'masked' : 'raw';

  // 首次进入把 view=raw 写进 URL，保证链接可分享复现当前视图。
  useEffect(() => {
    if (!raw) {
      const copy = new URLSearchParams(params);
      copy.set('view', 'raw');
      setParams(copy, { replace: true });
    }
  }, [raw, params, setParams]);

  const setView = useCallback(
    (next: AuditView) => {
      const copy = new URLSearchParams(params);
      copy.set('view', next);
      setParams(copy, { replace: true });
    },
    [params, setParams],
  );

  return [view, setView];
}
