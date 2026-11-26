/**
 * Playwright 截图：打开真实构建产物（dist），逐状态截屏到 docs/screenshots/。
 * 四张覆盖 AC3/AC4，另附列表空结果与 403 无权限页，共 7 张。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createStaticServer, listen } from './static-server.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
const distDir = path.join(projectRoot, 'dist');
const outDir = path.join(projectRoot, 'docs', 'screenshots');
const PORT = 4180;
const BASE = `http://127.0.0.1:${PORT}`;

const LIST = '/workbench/audit/assistant';
const DETAIL = '/workbench/audit/assistant/ses_20261120_0001';

function ensureDist() {
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    throw new Error('dist/index.html 不存在，请先运行 npm run build');
  }
  fs.mkdirSync(outDir, { recursive: true });
}

async function settle(page, ms = 700) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(ms);
}

async function main() {
  ensureDist();
  const server = createStaticServer(distDir);
  await listen(server, PORT);

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const shots = [];

  /** 详情页时间线是内层滚动容器，截图前把视口拉高，保证整段会话可见。 */
  async function useTallViewport() {
    await page.setViewportSize({ width: 1440, height: 2200 });
  }

  async function useNormalViewport() {
    await page.setViewportSize({ width: 1440, height: 960 });
  }

  async function shot(name, note) {
    const file = path.join(outDir, name);
    await page.screenshot({ path: file, fullPage: true });
    shots.push({ name, note });
    return file;
  }

  try {
    // 1. 有数据的列表页
    await page.goto(`${BASE}${LIST}?state=data`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="list-total"]');
    await settle(page);
    await shot('01-list-data.png', '有数据的会话列表（6 条会话，表格七列）');

    // 2. 空结果状态
    await page.goto(`${BASE}${LIST}?state=empty`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="list-empty"]');
    await settle(page);
    await shot('02-list-empty.png', '空结果状态：没有符合条件的会话，筛选区保留');

    // 3. 详情回放 · 原文视图（含拦截事件与引用上标）
    await useTallViewport();
    await page.goto(`${BASE}${DETAIL}?view=raw`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="msg-assistant-2"]');
    await page.click('[data-testid="citation-button-2-1"]');
    await settle(page);
    await shot('03-detail-raw.png', '详情回放原文视图：引用上标已展开来源标题，含拦截事件与反馈');

    // 4. 详情回放 · 脱敏视图（同一会话同屏）
    await page.goto(`${BASE}${DETAIL}?view=masked`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="redaction-notice"]');
    await settle(page);
    await shot('04-detail-masked.png', '详情回放脱敏视图：手机号 138****1234、邮箱 s***@example.com，顶部显示共脱敏 N 处');

    // 5. 导出中（进度条）
    await useNormalViewport();
    await page.goto(`${BASE}${LIST}?state=data&export=slow`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="export-button"]');
    await page.click('[data-testid="export-button"]');
    await page.waitForSelector('[data-testid="export-progress"]');
    await settle(page, 1200);
    await shot('05-export-running.png', '导出中：进度条 + 已生成 N / 共 M 条，每 3 秒轮询');

    // 6. 导出失败
    await page.goto(`${BASE}${LIST}?state=data&export=fail`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="export-button"]');
    await page.click('[data-testid="export-button"]');
    await page.waitForSelector('[data-testid="export-failed"]', { timeout: 30000 });
    await settle(page, 800);
    await shot('06-export-failed.png', '导出失败：失败提示与「重试」按钮');

    // 7. 90 天限制：查询按钮禁用 + 红字提示（AC2 的界面证据）
    await page.goto(
      `${BASE}${LIST}?state=data&draft_from=2026-08-01&draft_to=2026-10-30`,
      { waitUntil: 'domcontentloaded' },
    );
    await page.waitForSelector('[data-testid="list-total"]');
    await page.waitForSelector('[data-testid="range-error"]');
    await settle(page);
    await shot('07-range-exceeded.png', '91 天跨度：查询按钮禁用 + 红字提示「审计查询时间跨度不能超过 90 天，请缩小范围」');

    // 8. 非审计角色 → 无权限页
    await page.goto(`${BASE}${LIST}?as=viewer`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="forbidden-page"]');
    await settle(page);
    await shot('08-forbidden.png', '非审计角色访问审计路由被重定向到 403 无权限页');

    fs.writeFileSync(
      path.join(outDir, 'index.json'),
      JSON.stringify({ generatedAt: new Date().toISOString(), base: BASE, shots }, null, 2),
    );

    console.log(`截图完成 ${shots.length} 张：`);
    shots.forEach((item) => console.log(`  ${item.name} — ${item.note}`));
  } finally {
    await context.close();
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
