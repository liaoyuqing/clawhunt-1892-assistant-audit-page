import { Link } from 'react-router-dom';

/** 工作台占位页：给出进入审计页的入口，便于演示与截图。 */
export default function WorkbenchPage() {
  return (
    <div className="page">
      <h1 className="page__title">工作台</h1>
      <p className="page__subtitle">员工 AI 助手入口 · 会员空间平台</p>
      <ul className="entry-list">
        <li>
          <Link to="/workbench/audit/assistant">助手对话审计</Link>
          <span>需要审计角色（audit.assistant.read）</span>
        </li>
      </ul>
    </div>
  );
}
