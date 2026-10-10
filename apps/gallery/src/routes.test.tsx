import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { MANIFESTS, routeFor } from './manifests';
import type { Manifest } from './manifests';
import { renderAt } from './test/renderRoute';
import { expectNoA11yViolations } from './test/a11y';
import { PAGE_ROUTES } from './test/smokeRoutes';
import { chooseOption } from './test/select';

/** The Playground's code panel: the CodeBlock whose code region is "Example code". */
function reactPanel(): HTMLElement {
  return screen.getByRole('region', { name: 'Example code' }).closest<HTMLElement>('.bit-code__block')!;
}

/**
 * Pages too slow for Vitest's 5s default, each with its own limit. Icon renders 300 icons and runs axe over them:
 * about 0.9s alone, but 5.6s once on a busy CI runner. TODOS.md, "Tests: Icon route smoke under 5s".
 */
const SLOW_PAGES: Readonly<Record<string, number>> = { icon: 15_000 };

/** The five sections, live preview, controls and code of one component page, with no axe violations. */
async function checkComponentPage(manifest: Manifest) {
  const { container } = renderAt(routeFor(manifest));
  expect(await screen.findByRole('heading', { level: 1, name: manifest.name })).toBeInTheDocument();
  const preview = screen.getByRole('region', { name: `${manifest.name} preview` });
  expect(preview.querySelector('[class*="bit-"]')).not.toBeNull();
  expect(screen.getByRole('region', { name: 'Controls' })).toBeInTheDocument();
  for (const name of ['Playground', 'Usage', 'Props', 'Accessibility']) {
    expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument();
  }
  expect(reactPanel()).toHaveAttribute('data-language', 'jsx');
  // Full file is the default: the component import (plus React's, when a demo needs state), any hoisted consts, then (for a demo) its state inside Example, then an Example component returning it.
  expect(reactPanel().querySelector('pre')!.textContent).toMatch(
    /^(?:import \{ .+ \} from 'react';\n)?import \{ .+ \} from '@bit-ds\/react';\n\n(?:const \w+ = [\s\S]*?;\n\n)*export function Example\(\) \{\n(?: {2}const \[[\w, ]+\] = .+;\n\n)? {2}return \(\n/,
  );
  // Nothing in the gallery is drawn at the deprecated 11px size.
  expect(container.querySelector('[data-size="11"]')).toBeNull();
  await expectNoA11yViolations(container);
}

describe('component routes (route smoke, D14)', () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = 'power-up';
  });

  const PAGE_TITLE = '%s: heading, the five sections, live preview, controls and code, with no axe violations';
  it.each(MANIFESTS.filter((m) => !(m.slug in SLOW_PAGES)).map((m) => [m.name, m] as const))(PAGE_TITLE, (_name, manifest) =>
    checkComponentPage(manifest),
  );
  for (const manifest of MANIFESTS.filter((m) => m.slug in SLOW_PAGES)) {
    it(PAGE_TITLE.replace('%s', manifest.name), () => checkComponentPage(manifest), SLOW_PAGES[manifest.slug]);
  }

  it.each(PAGE_ROUTES)('%s: its heading, with no axe violations', async (path, heading) => {
    const { container } = renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    expect(container.querySelector('[data-size="11"]')).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('a control change updates the preview, the code, and the URL', async () => {
    const { router } = renderAt('/components/button');
    await screen.findByRole('heading', { level: 1, name: 'Button' });
    await chooseOption(userEvent.setup(), screen.getByRole('combobox', { name: 'color' }), 'danger');
    const preview = screen.getByRole('region', { name: 'Button preview' });
    expect(within(preview).getByRole('button', { name: 'Save' })).toHaveClass('bit-danger');
    expect(reactPanel().querySelector('pre')!.textContent).toContain('<Button color="danger">Save</Button>');
    expect(router.state.location.search).toBe('?color=danger');
  });

  it('the CodeBlock page names its two jsx regions apart: the preview and the "Example code" panel', async () => {
    const { container } = renderAt('/components/codeblock');
    await screen.findByRole('heading', { level: 1, name: 'CodeBlock' });
    const preview = screen.getByRole('region', { name: 'CodeBlock preview' });
    expect(within(preview).getByRole('region', { name: 'jsx code' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Example code' })).toBe(reactPanel().querySelector('pre'));
    await expectNoA11yViolations(container);
  });

  it('old shared links fall back to defaults: ?gap=3 (the pre-px step) renders the 12px default', async () => {
    renderAt('/components/stack?gap=3');
    await screen.findByRole('heading', { level: 1, name: 'Stack' });
    const preview = screen.getByRole('region', { name: 'Stack preview' });
    expect(preview.querySelector('.bit-stack')).toHaveAttribute('data-gap', '12');
  });

  it("the Box page's dashed outline selector matches: the previewed Box is the stage's direct child", async () => {
    const { container } = renderAt('/components/box');
    await screen.findByRole('heading', { level: 1, name: 'Box' });
    expect(container.querySelector('.gallery-preview__stage > .bit-box')).not.toBeNull();
  });

  it('the Stack page draws the same dashed outline: its Stack sits in a Box that is the stage child, so stretch shows its edge', async () => {
    const { container } = renderAt('/components/stack');
    await screen.findByRole('heading', { level: 1, name: 'Stack' });
    expect(container.querySelector('.gallery-preview__stage > .bit-box > .bit-stack')).not.toBeNull();
  });

  it.each([
    ['/components/nope', 'nope', 'Go to Code', '/components/code'],
    ['/components/buton', 'buton', 'Go to Button', '/components/button'],
    ['/components/logo', 'logo', 'Go to BitLogo', '/brand/logo'],
  ])('%s names the typo and suggests the closest component', async (path, slug, suggestion, href) => {
    const { container } = renderAt(path);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(`No component called “${slug}”`);
    expect(screen.getByRole('link', { name: suggestion })).toHaveAttribute('href', href);
    await expectNoA11yViolations(container);
  });

  it('an unknown slug with nothing close lists every component as a Link, and suggests none', async () => {
    renderAt('/components/accordion');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('No component called “accordion”');
    expect(screen.queryByRole('link', { name: /^Go to / })).toBeNull();
    const list = screen.getByRole('heading', { level: 2, name: 'Every component' }).parentElement!;
    expect(within(list).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(MANIFESTS.map(routeFor));
  });

  it('a slug that looks like markup is shown as text', async () => {
    renderAt('/components/%3Cimg%20src%3Dx%3E');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('No component called “<img src=x>”');
    expect(document.querySelector('main img')).toBeNull();
  });

  it('bad shared values reset to their defaults and the URL is rewritten with replace (§E)', async () => {
    const { router } = renderAt('/components/button?color=purple&size=lg');
    await screen.findByRole('heading', { level: 1, name: 'Button' });
    const preview = screen.getByRole('region', { name: 'Button preview' });
    expect(within(preview).getByRole('button', { name: 'Save' })).toHaveClass('bit-primary', 'bit-lg');
    await waitFor(() => expect(router.state.location.search).toBe('?size=lg'));
    expect(router.state.historyAction).toBe('REPLACE');
  });

  it('sidebar links reach component pages', async () => {
    renderAt('/');
    await screen.findByRole('heading', { level: 1 });
    await userEvent.click(within(screen.getByRole('navigation', { name: 'Gallery' })).getByRole('link', { name: 'Badge' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Badge' })).toBeInTheDocument();
  });
});
