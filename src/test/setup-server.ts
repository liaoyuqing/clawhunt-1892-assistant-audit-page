/** 统一的 MSW server 生命周期；每个测试文件 import 一次。 */
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from '@/test/server';
import { resetMockState } from '@/mocks/state';
import { resetExportTasks } from '@/mocks/handlers';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  resetMockState();
  resetExportTasks();
});
afterAll(() => server.close());
