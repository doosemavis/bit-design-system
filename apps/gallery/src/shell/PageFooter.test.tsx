import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { findManifest, MANIFESTS, relatedManifests, routeFor } from '../manifests';
import { renderAt } from '../test/renderRoute';
import { expectNoA11yViolations } from '../test/a11y';
import { neighbors } from './PageFooter';
import { NAV } from './Sidebar';

const pager = () => screen.queryByRole('navigation', { name: 'Previous and next page' });

async function openAt(path: string, h1: string) {
  const utils = renderAt(path);
  await screen.findByRole('heading', { level: 1, name: h1 });
  return utils;
}

describe('neighbors', () => {
  it('walks the sidebar order: every page links to the ones beside it', () => {
    NAV.forEach((item, i) => {
      const around = neighbors(NAV, item.to)!;
      expect(around.prev).toBe(NAV[i - 1]);
      expect(around.next).toBe(NAV[i + 1]);
    });
  });

  it('is null off the sidebar (a 404, a mistyped component)', () => {
    expect(neighbors(NAV, '/nope')).toBeNull();
    expect(neighbors(NAV, '/components/buton')).toBeNull();
  });
});

describe('previous and next', () => {
  it('a component page links back and on, named for screen readers, and has no axe violations', async () => {
    const { container } = await openAt('/components/button', 'Button');
    const nav = pager()!;
    const i = NAV.findIndex((item) => item.to === '/components/button');
    const prev = within(nav).getByRole('link', { name: `Previous: ${NAV[i - 1]!.label}` });
    const next = within(nav).getByRole('link', { name: `Next: ${NAV[i + 1]!.label}` });
    expect(prev).toHaveAttribute('href', NAV[i - 1]!.to);
    expect(prev).toHaveAttribute('rel', 'prev');
    expect(next).toHaveAttribute('href', NAV[i + 1]!.to);
    expect(next).toHaveAttribute('rel', 'next');
    await expectNoA11yViolations(container);
  });

  it('the first page has only Next', async () => {
    await openAt('/', 'bit Design System');
    expect(within(pager()!).getAllByRole('link').map((a) => a.getAttribute('aria-label'))).toEqual([`Next: ${NAV[1]!.label}`]);
  });

  it('the last page has only Previous', async () => {
    const last = NAV[NAV.length - 1]!;
    await openAt(last.to, findManifest('logo')!.name);
    expect(within(pager()!).getAllByRole('link').map((a) => a.getAttribute('aria-label'))).toEqual([`Previous: ${NAV[NAV.length - 2]!.label}`]);
  });

  it('a 404 has none', async () => {
    await openAt('/nope', 'Page not found');
    expect(pager()).toBeNull();
  });

  it('following Next goes there', async () => {
    const { router } = await openAt('/tokens', 'Tokens');
    const i = NAV.findIndex((item) => item.to === '/tokens');
    await userEvent.click(within(pager()!).getByRole('link', { name: `Next: ${NAV[i + 1]!.label}` }));
    expect(router.state.location.pathname).toBe(NAV[i + 1]!.to);
  });
});

describe('related', () => {
  it('every related slug is a real page, never the page itself, listed once', () => {
    for (const manifest of MANIFESTS) {
      const slugs = manifest.related ?? [];
      expect(new Set(slugs).size, manifest.name).toBe(slugs.length);
      expect(slugs, manifest.name).not.toContain(manifest.slug);
      for (const slug of slugs) expect(findManifest(slug), `${manifest.name} → ${slug}`).toBeDefined();
      expect(relatedManifests(manifest).map((m) => m.slug)).toEqual(slugs);
    }
  });

  it('every component page but the logo suggests at least one other', () => {
    for (const manifest of MANIFESTS.filter((m) => m.group !== 'brand')) {
      expect(relatedManifests(manifest).length, manifest.name).toBeGreaterThan(0);
    }
  });

  it('relatedManifests drops unknown slugs, itself and repeats', () => {
    const button = findManifest('button')!;
    expect(relatedManifests({ ...button, related: ['link', 'nope', 'button', 'link'] }).map((m) => m.slug)).toEqual(['link']);
    expect(relatedManifests({ ...button, related: undefined })).toEqual([]);
  });

  it('a component page ends with a Related section of link cards, listed in its section bar', async () => {
    await openAt('/components/button', 'Button');
    const section = screen.getByRole('region', { name: 'Related' });
    const expected = relatedManifests(findManifest('button')!);
    expect(within(section).getAllByRole('link').filter((a) => a.classList.contains('gallery-link-card__link')).map((a) => [a.textContent, a.getAttribute('href')])).toEqual(
      expected.map((m) => [m.name, routeFor(m)]),
    );
    expect(within(screen.getByRole('navigation', { name: 'On this page' })).getByRole('link', { name: 'Related' })).toHaveAttribute(
      'href',
      '#section-related',
    );
  });

  it('the logo page has no Related section', async () => {
    await openAt('/brand/logo', findManifest('logo')!.name);
    expect(screen.queryByRole('region', { name: 'Related' })).toBeNull();
  });
});
