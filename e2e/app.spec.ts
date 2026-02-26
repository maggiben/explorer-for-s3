import { test, expect } from './electron.fixture';

test.describe('S3 Explorer E2E', () => {
  test('app launches and opens a window', async ({ electronApp }) => {
    const window = await electronApp.firstWindow();
    await expect(window).toBeTruthy();
    // Window should eventually have a document (renderer loaded)
    await expect(window.locator('body')).toBeVisible({ timeout: 15_000 });
  });

  test('main process exposes app path via evaluate', async ({ electronApp }) => {
    const appPath = await electronApp.evaluate(async ({ app }) => {
      return app.getAppPath();
    });
    expect(appPath).toBeTruthy();
    expect(typeof appPath).toBe('string');
  });

  test('renderer loads and has root element', async ({ electronApp }) => {
    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
    const root = window.locator('#root');
    await expect(root).toBeVisible({ timeout: 10_000 });
  });
});
