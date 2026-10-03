import axe from 'axe-core';
import { expect } from 'vitest';

/**
 * Same two rules disabled as packages/react/src/test/a11y.ts: jsdom has no layout engine
 * (contrast is verified numerically in @bit/core), and `region` is meaningless for a
 * fragment rendered outside the shell's landmarks.
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
