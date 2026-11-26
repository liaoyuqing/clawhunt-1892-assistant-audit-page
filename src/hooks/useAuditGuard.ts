/**
 * 角色守卫（AC1）。
 * 判定依据：GET /api/iam/me/permissions 返回的 permissions 是否含 audit.assistant.read。
 * 不通过时立即 navigate('/403', {replace:true})，且页面子树不渲染 —— 因此审计接口零请求。
 */
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchPermissions } from '@/services/audit';
import { AUDIT_READ_PERMISSION } from '@/schemas/audit';

export type GuardStatus = 'checking' | 'allowed' | 'denied';

export interface GuardResult {
  status: GuardStatus;
  can: (permission: string) => boolean;
}

export function useAuditGuard(permission: string = AUDIT_READ_PERMISSION): GuardResult {
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ['iam', 'permissions'],
    queryFn: fetchPermissions,
    staleTime: 60_000,
    retry: false,
  });

  const can = (target: string): boolean => {
    const data = query.data;
    if (!data) return false;
    return data.permissions.includes(target) || data.roles.includes('auditor');
  };

  const allowed = query.isSuccess ? can(permission) : false;

  useEffect(() => {
    if (query.isSuccess && !allowed) {
      navigate('/403', { replace: true });
    }
  }, [query.isSuccess, allowed, navigate]);

  if (query.isError) {
    return { status: 'denied', can };
  }
  if (query.isSuccess) {
    return { status: allowed ? 'allowed' : 'denied', can };
  }
  return { status: 'checking', can };
}
