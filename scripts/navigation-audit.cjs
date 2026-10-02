/* Run against a local dev server. Uses isolated, synthetic auth and read-only API fixtures. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const baseURL = process.env.AUDIT_URL || 'http://127.0.0.1:3000';
const businessAudit = process.env.AUDIT_WORKSPACE === 'business';
const businessQuery = '?businessId=audit-business';
const initialPath = businessAudit ? `/dashboard/businessAdmin/categories${businessQuery}` : '/dashboard/superAdmin';
const routes = businessAudit ? [
  ['Categories', `/dashboard/businessAdmin/categories${businessQuery}`],
  ['Products', `/dashboard/businessAdmin/products${businessQuery}`],
  ['Dashboard', `/dashboard/businessAdmin${businessQuery}`],
] : [
  ['Businesses', '/dashboard/superAdmin/businesses'],
  ['Subscriptions', '/dashboard/superAdmin/subscriptions'],
  ['Dashboard', '/dashboard/superAdmin'],
];

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.AUDIT_BROWSER_CHANNEL || undefined });
  try {
    for (const width of [375, 768, 1024, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      await context.addInitScript(() => {
        localStorage.setItem('auth_token', 'navigation-audit-fixture');
        localStorage.setItem('roleName', 'super_admin');
      });
      await context.route('**/*', async route => {
        const request = route.request();
        const url = new URL(request.url());
        if ((url.origin === baseURL && !url.pathname.startsWith('/backend')) || !['fetch', 'xhr'].includes(request.resourceType())) {
          return route.continue();
        }
        if (url.pathname.endsWith('/business/audit-business')) {
          return route.fulfill({ json: { data: {
            id: 'audit-business', businessName: 'Audit business', status: 'active',
            templateConfig: null, websiteEnabled: true, softwareEnabled: true, portalEnabled: true,
          } } });
        }
        return route.fulfill({ json: { data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } } });
      });
      const page = await context.newPage();
      page.setDefaultTimeout(90000);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${baseURL}${initialPath}`, { timeout: 180000 });
      await page.locator('.admin-shell-header').waitFor();
      await page.evaluate(() => {
        window.__navigationAudit = 'same-document';
      });
      const mobile = width < 1280;
      const trigger = page.getByRole('button', { name: 'Open navigation menu' });
      if (mobile) {
        await trigger.click();
        await page.getByRole('dialog').waitFor();
        await page.keyboard.press('Tab');
        assert(await page.getByRole('dialog').evaluate(el => el.contains(document.activeElement)), 'Keyboard focus must remain in the drawer');
        await page.keyboard.press('Escape');
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        assert(await trigger.evaluate(el => el === document.activeElement), 'Focus must return to menu trigger');
        await trigger.click();
        await page.mouse.click(width - 2, 850);
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
      } else {
        await page.getByRole('button', { name: 'Collapse sidebar', exact: true }).click();
        await page.getByRole('button', { name: 'Expand sidebar', exact: true }).waitFor();
      }
      for (const [label, path] of routes) {
        if (mobile) await trigger.click();
        const nav = page.locator(mobile ? '.admin-shell-mobile nav' : '.admin-shell-aside nav');
        await nav.getByRole('link', { name: label, exact: true }).click();
        await page.waitForURL(`${baseURL}${path}`);
        await page.locator('.admin-shell-header').waitFor();
        await page.waitForFunction(() => getComputedStyle(document.body).pointerEvents !== 'none');
        if (mobile) await page.getByRole('dialog').waitFor({ state: 'hidden' });
        assert.equal(await page.evaluate(() => window.__navigationAudit), 'same-document', 'Navigation must not reload');
        const active = page.locator('.admin-shell-aside a[aria-current="page"]');
        assert.equal(await active.getAttribute('aria-label'), label, 'URL and selected navigation must match');
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Overflow at ${width}: ${path}`);
        console.log(`Checked ${width}px ${path}`);
      }
      await page.goBack();
      await page.waitForURL(`${baseURL}${routes[1][1]}`);
      await page.waitForFunction(label => document.querySelector('.admin-shell-aside a[aria-current="page"]')?.getAttribute('aria-label') === label, routes[1][0]);
      await page.goForward();
      await page.waitForURL(`${baseURL}${routes[2][1]}`);
      if (mobile) {
        await trigger.click();
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        await page.waitForFunction(() => getComputedStyle(document.body).pointerEvents !== 'none');
        await page.setViewportSize({ width, height: 900 });
        assert.equal(await trigger.getAttribute('aria-expanded'), 'false', 'Drawer must stay closed after resize');
      }
      assert.deepEqual(errors, [], 'No uncaught browser errors');
      console.log(`PASS ${width}px: client routing, selection, history, drawer, focus, resize, overflow`);
      await context.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
