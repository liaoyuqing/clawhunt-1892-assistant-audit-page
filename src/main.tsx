import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import 'tdesign-react/es/style/index.css';
import './styles/global.css';
import { AppProviders } from '@/app/providers';
import { router } from '@/app/router';

async function bootstrap() {
  // 全部接口走 MSW，前端独立可跑，不需要后端 / 数据库 / 密钥。
  const { worker } = await import('@/mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  });

  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </React.StrictMode>,
  );
}

void bootstrap();
