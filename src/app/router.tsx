import { createBrowserRouter, Navigate } from 'react-router-dom';
import AssistantAuditListPage from '@/pages/workbench/audit/assistant';
import AssistantAuditDetailPage from '@/pages/workbench/audit/assistant/[sessionId]';
import ForbiddenPage from '@/pages/errors/forbidden';
import WorkbenchPage from '@/pages/workbench';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/workbench/audit/assistant" replace /> },
  { path: '/workbench', element: <WorkbenchPage /> },
  { path: '/workbench/audit/assistant', element: <AssistantAuditListPage /> },
  { path: '/workbench/audit/assistant/:sessionId', element: <AssistantAuditDetailPage /> },
  { path: '/403', element: <ForbiddenPage /> },
  { path: '*', element: <ForbiddenPage /> },
]);
