import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { seedColorMode } from './mode';
import { ROUTES } from './routes';

// The build's Content-Security-Policy <meta> (apps/gallery/csp.ts) must block nothing the site
// itself loads: the inline color-mode script, the app's chunks and CSS, fonts, versions.json.

/** Records every CSP violation (event and console message) from before the page's first script. */
async function watchViolations(page: Page): Promise<string[]> {
  const seen: string[] = [];
  page.on('console', (message) => {
    if (/Content Security Policy/i.test(message.text())) seen.push(`console: ${message.text()}`);
  });
  await page.exposeFunction('__bitCspViolation', (text: string) => seen.push(text));
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) => {
      const report = (window as unknown as { __bitCspViolation: (t: string) => void }).__bitCspViolation;
      report(`${event.violatedDirective} blocked ${event.blockedURI || 'inline'} (${event.sourceFile}:${event.lineNumber})`);
    });
  });
  return seen;
}

test('the served page carries the CSP meta, with a script hash and no unsafe-inline script', async ({ page }) => {
  await page.goto('');
  const policy = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(policy).toMatch(/script-src 'self' 'sha256-[A-Za-z0-9+/]+=*';/);
  expect(policy).not.toMatch(/script-src[^;]*'unsafe-inline'/);
});

test('the inline saved-choice script still runs under the policy, before the app loads', async ({ page }) => {
  const violations = await watchViolations(page);
  await seedColorMode(page, 'dark');
  // With the app's scripts blocked, only the hashed inline script can set data-mode.
  await page.route('**/*.js', (route) => route.abort());
  await page.goto('#/tokens');
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');
  expect(violations).toEqual([]);
});

test('no page breaks the policy', async ({ page }) => {
  const violations = await watchViolations(page);
  for (const route of ROUTES) {
    await page.goto(route.hash);
    await expect(page.locator('main h1').first()).toBeVisible();
  }
  // Fonts load lazily; wait for them so a blocked font would show up here.
  await page.evaluate(() => document.fonts.ready);
  expect(violations).toEqual([]);
});
