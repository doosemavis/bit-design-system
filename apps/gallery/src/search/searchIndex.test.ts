import { describe, expect, it } from 'vitest';
import { MANIFESTS, routeFor } from '../manifests';
import { NAV } from '../shell/Sidebar';
import { buildSearchIndex, searchEntries } from './searchIndex';

const INDEX = buildSearchIndex(NAV, MANIFESTS);
const titles = (query: string) => searchEntries(INDEX, query).map((entry) => `${entry.kind}:${entry.title}`);

describe('buildSearchIndex', () => {
  it('has every sidebar page, in sidebar order, before any prop', () => {
    const pages = INDEX.filter((entry) => entry.kind !== 'prop');
    expect(pages.map((entry) => entry.to)).toEqual(NAV.map((item) => item.to));
    expect(pages.map((entry) => entry.title)).toEqual(NAV.map((item) => item.label));
    expect(INDEX.slice(0, pages.length)).toEqual(pages);
  });

  it('covers Start here, Foundations and every component', () => {
    const byTo = new Map(INDEX.map((entry) => [entry.to, entry]));
    for (const to of ['/', '/getting-started', '/versions', '/accessibility', '/release-notes', '/tokens', '/typography', '/spacing']) {
      expect(byTo.get(to)?.kind, to).toBe('page');
    }
    for (const manifest of MANIFESTS) {
      const entry = byTo.get(routeFor(manifest));
      expect(entry?.kind, manifest.name).toBe('component');
      expect(entry?.detail).toBe(manifest.description);
    }
  });

  it("indexes every documented prop of every component, pointing at that page's Props section", () => {
    for (const manifest of MANIFESTS) {
      const props = INDEX.filter((entry) => entry.kind === 'prop' && entry.to === `${routeFor(manifest)}#section-props`);
      expect(props.map((entry) => entry.title), manifest.name).toEqual(manifest.docs.props.map((prop) => prop.name));
      for (const entry of props) expect(entry.detail).toMatch(new RegExp(`^${manifest.name} prop · `));
    }
  });

  it('gives every entry a unique id that is safe as an element id', () => {
    const ids = INDEX.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^search-[a-z0-9-]+$/);
  });
});

describe('searchEntries', () => {
  it('lists the pages, not the props, for an empty or blank query', () => {
    expect(searchEntries(INDEX, '')).toEqual(INDEX.filter((entry) => entry.kind !== 'prop'));
    expect(searchEntries(INDEX, '   ')).toHaveLength(NAV.length);
  });

  it('puts the exact name first, and a page before a prop that matches as well', () => {
    expect(titles('button')[0]).toBe('component:Button');
    expect(titles('Typography')[0]).toBe('page:Typography');
    expect(titles('versions')[0]).toBe('page:Versions');
  });

  it('ignores case and word order, and needs every word somewhere in the entry', () => {
    expect(titles('SIZE button')[0]).toBe('prop:size');
    expect(searchEntries(INDEX, 'size button')[0]?.detail).toMatch(/^Button prop/);
    expect(titles('icon button')).toContain('component:IconButton');
  });

  it('finds a prop by its name across components', () => {
    const sizes = searchEntries(INDEX, 'size').filter((entry) => entry.kind === 'prop' && entry.title === 'size');
    expect(sizes.length).toBeGreaterThan(5);
    expect(new Set(sizes.map((entry) => entry.to)).size).toBe(sizes.length);
  });

  it('returns nothing when nothing matches', () => {
    expect(searchEntries(INDEX, 'zzzz-no-such-thing')).toEqual([]);
  });
  it('every entry is badged with its sidebar section; a prop takes its component\'s (Select props say Forms)', () => {
    const groupOf = new Map(NAV.map((item) => [item.to, item.group]));
    for (const entry of INDEX) {
      const page = entry.to.split('#')[0]!;
      expect(entry.group, entry.id).toBe(groupOf.get(page));
    }
    expect(INDEX.find((entry) => entry.kind === 'prop' && entry.to.startsWith('/components/select#'))?.group).toBe('Forms');
    expect(INDEX.find((entry) => entry.kind === 'page' && entry.title === 'Spacing')).toMatchObject({ group: 'Foundations', detail: 'Page' });
  });
});
