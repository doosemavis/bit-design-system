import axe from 'axe-core';
import { expect } from 'vitest';

/**
 * Fail the test if axe finds any violation inside `container`.
 * `color-contrast` is disabled because jsdom has no layout engine; contrast is
 * verified numerically in packages/core/src/__tests__/contrast.test.ts.
 * `region` is disabled because components render outside any landmark in tests.
 */
export async function expectNoA11yViolations(container: Element): Promise<void> {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  const summary = results.violations.map(
    (v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  );
  expect(summary).toEqual([]);
}
