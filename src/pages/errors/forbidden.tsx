import { Link } from 'react-router-dom';
import { Button } from 'tdesign-react';
import { LockOnIcon } from 'tdesign-icons-react';

/** 无权限页：非审计角色访问审计路由时跳转到这里。 */
export default function ForbiddenPage() {
  return (
    <div className="page page--forbidden" data-testid="forbidden-page">
      <LockOnIcon className="forbidden__icon" />
      <h1 className="forbidden__code">403</h1>
      <h2 className="forbidden__title">无权限访问</h2>
      <p className="forbidden__desc">
        当前账号不在审计角色范围内，无法查看助手对话审计页面。如需开通，请联系本会员空间管理员申请
        <code> audit.assistant.read </code>权限。
      </p>
      <Link to="/workbench">
        <Button theme="primary" variant="outline">
          返回工作台
        </Button>
      </Link>
    </div>
  );
}
