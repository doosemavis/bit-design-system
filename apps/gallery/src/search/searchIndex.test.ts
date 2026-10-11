import { describe, expect, it } from 'vitest';
import { MANIFESTS, routeFor } from '../manifests';
import { NAV } from '../shell/Sidebar';
import { buildSearchIndex, groupResults, KIND_LABEL, searchEntries } from './searchIndex';
import { GAMES } from '../arcade/games';

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
      for (const entry of props) expect(entry.owner).toBe(manifest.name);
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
    expect(searchEntries(INDEX, 'size button')[0]?.owner).toBe('Button');
    expect(titles('icon button')).toContain('component:IconButton');
  });

  it('finds a prop by its name across components', () => {
    const sizes = searchEntries(INDEX, 'size').filter((entry) => entry.kind === 'prop' && entry.title === 'size');
    expect(sizes.length).toBeGreaterThan(5);
    expect(new Set(sizes.map((entry) => entry.to)).size).toBe(sizes.length);
  });

  it('returns nothing when nothing matches', () => {
    expect(searchEntries(INDEX, 'zzzz-no-such-thing')).toEqual([]);
    expect(searchEntries(INDEX, 'zzzqq')).toEqual([]);
  });

  it('ranks a title that starts with the query above a prop that only holds it ("sl": Slider and Select before dismissLabel)', () => {
    const found = titles('sl');
    expect(found[0]).toBe('component:Slider');
    expect(found.indexOf('component:Slider')).toBeLessThan(found.indexOf('prop:dismissLabel'));
    // Select holds "sl" only in its other text, so it ranks with the pages, above every prop.
    expect(found).toContain('component:Select');
    expect(found.indexOf('component:Select')).toBeLessThan(found.indexOf('prop:dismissLabel'));
  });

  it('ranks title starts, then word starts in titles, then prop starts, then props that hold the query ("but", "dis")', () => {
    const but = titles('but');
    expect(but.slice(0, 2)).toEqual(['component:Button', 'component:IconButton']);
    const dis = searchEntries(INDEX, 'dis');
    // No title starts with "dis", so a prop that does comes first, above Alert, which only mentions dismissing.
    expect(dis[0]).toMatchObject({ kind: 'prop', title: 'disabled' });
    expect(dis.findIndex((entry) => entry.title === 'Alert')).toBeGreaterThan(dis.findIndex((entry) => entry.title === 'onDismiss'));
    const props = dis.filter((entry) => entry.kind === 'prop').map((entry) => entry.title);
    // Prop names that start with "dis" (shorter first), then a camelCase word start (onDismiss).
    expect(props.slice(0, props.lastIndexOf('disabled') + 1).every((title) => title.startsWith('dis'))).toBe(true);
    expect(props.indexOf('dismissLabel')).toBeGreaterThan(props.lastIndexOf('disabled'));
    expect(props.indexOf('onDismiss')).toBeGreaterThan(props.indexOf('dismissLabel'));
  });

  it('breaks ties by shorter title, then alphabetically by title and component, so the order is stable', () => {
    const label = searchEntries(INDEX, 'label').filter((entry) => entry.kind === 'prop');
    expect(label[0]?.title).toBe('label');
    const owners = label.filter((entry) => entry.title === 'label').map((entry) => entry.owner!);
    expect(owners).toEqual([...owners].sort());
    const sizes = searchEntries(INDEX, 'size').filter((entry) => entry.title === 'size');
    expect(sizes.map((entry) => entry.owner)).toEqual(sizes.map((entry) => entry.owner).sort());
    expect(searchEntries(INDEX, 'sl')).toEqual(searchEntries(INDEX, 'SL '));
  });
  it('every entry is badged with its sidebar section; a prop takes its component\'s (Select props say Choice inputs)', () => {
    const groupOf = new Map(NAV.map((item) => [item.to, item.group]));
    for (const entry of INDEX) {
      const page = entry.to.split('#')[0]!;
      expect(entry.group, entry.id).toBe(groupOf.get(page));
    }
    expect(INDEX.find((entry) => entry.kind === 'prop' && entry.to.startsWith('/components/select#'))?.group).toBe('Choice inputs');
    expect(INDEX.find((entry) => entry.kind === 'page' && entry.title === 'Spacing')).toMatchObject({ group: 'Foundations', detail: 'In Foundations' });
  });
});

describe('KIND_LABEL', () => {
  it('names every kind for its chip', () => {
    expect(KIND_LABEL).toEqual({ page: 'Page', component: 'Component', prop: 'Prop', game: 'Game' });
  });
});

describe('groupResults', () => {
  it('groups results by kind, each group where its best result ranks, keeping rank order inside a group', () => {
    const results = searchEntries(INDEX, 'sl');
    const groups = groupResults(results);
    expect(groups.map((group) => group.label)).toEqual(['Components', 'Props']);
    expect(groups[0]!.entries.map((entry) => entry.title).slice(0, 1)).toEqual(['Slider']);
    expect(groups.flatMap((group) => group.entries)).toHaveLength(results.length);
    for (const group of groups) {
      expect(group.entries).toEqual(results.filter((entry) => group.entries.includes(entry)));
    }
  });

  it('lists the empty query as Pages, Components, then Games, each in sidebar order', () => {
    const withGames = buildSearchIndex(NAV, MANIFESTS, GAMES);
    const groups = groupResults(searchEntries(withGames, ''));
    expect(groups.map((group) => group.label)).toEqual(['Pages', 'Components', 'Games']);
    expect(groups[0]!.entries[0]?.title).toBe('Overview');
    expect(groups[1]!.entries.map((entry) => entry.title)).toEqual(withGames.filter((entry) => entry.kind === 'component').map((entry) => entry.title));
  });

  it('is empty for no results', () => {
    expect(groupResults([])).toEqual([]);
  });
});

describe('Arcade games in search', () => {
  const withGames = buildSearchIndex(NAV, MANIFESTS, GAMES);

  it('come after the pages and before the props, under Arcade, opening a game rather than a route', () => {
    const games = withGames.filter((entry) => entry.kind === 'game');
    expect(games.map((entry) => [entry.title, entry.group, entry.game, entry.to])).toEqual([
      ['Snake', 'Arcade', 'snake', ''],
      ['Cheese Run', 'Arcade', 'cheese-run', ''],
      ['Bit Blaster', 'Arcade', 'bit-blaster', ''],
    ]);
    const firstGame = withGames.indexOf(games[0]!);
    expect(withGames.slice(0, firstGame).every((entry) => entry.kind === 'page' || entry.kind === 'component')).toBe(true);
    expect(withGames.slice(firstGame + games.length).every((entry) => entry.kind === 'prop')).toBe(true);
  });

  it('are found by name, by "arcade" and "game", and listed with the pages on an empty query', () => {
    expect(searchEntries(withGames, 'snake')[0]).toMatchObject({ kind: 'game', title: 'Snake' });
    expect(searchEntries(withGames, 'arcade').map((entry) => entry.title)).toEqual(['Snake', 'Cheese Run', 'Bit Blaster']);
    expect(searchEntries(withGames, 'swarm').map((entry) => entry.title)).toEqual(['Bit Blaster']);
    expect(searchEntries(withGames, 'maze').map((entry) => entry.title)).toEqual(['Cheese Run']);
    expect(searchEntries(withGames, '').filter((entry) => entry.kind === 'game')).toHaveLength(3);
  });

  it('are left out when no games are given', () => {
    expect(INDEX.some((entry) => entry.kind === 'game')).toBe(false);
  });
});
