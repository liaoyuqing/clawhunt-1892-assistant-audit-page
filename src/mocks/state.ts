/**
 * mock 的可切换状态。浏览器里由 URL 参数覆盖，测试里直接改字段。
 * 支持的状态：有数据 / 空结果 / 导出中 / 导出失败（工单 1892 要求覆盖的四态）。
 */

export type MockListState = 'data' | 'empty';
export type MockExportMode = 'success' | 'slow' | 'fail';
export type MockRole = 'auditor' | 'viewer';

export interface MockState {
  role: MockRole;
  listState: MockListState;
  exportMode: MockExportMode;
}

export const mockState: MockState = {
  role: 'auditor',
  listState: 'data',
  exportMode: 'success',
};

export function resetMockState(): void {
  mockState.role = 'auditor';
  mockState.listState = 'data';
  mockState.exportMode = 'success';
}

/** 把 URL query 映射成 mock 状态，截图脚本据此切换四态。 */
export function applyUrlOverrides(search: string): void {
  const params = new URLSearchParams(search);
  const role = params.get('as');
  if (role === 'viewer' || role === 'auditor') mockState.role = role;

  const state = params.get('state');
  if (state === 'empty') mockState.listState = 'empty';
  if (state === 'data') mockState.listState = 'data';

  const exportMode = params.get('export');
  if (exportMode === 'fail' || exportMode === 'slow' || exportMode === 'success') {
    mockState.exportMode = exportMode;
  }
}
