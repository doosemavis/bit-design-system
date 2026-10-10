import { routeFor } from '../manifests';
import type { Manifest } from '../manifests';
import { SECTIONS } from '../pages/component/sections';
import type { GameId } from '../arcade/games';

/** What a result is: a docs page, a component page, one prop on a component page, or an Arcade game. */
export type SearchKind = 'page' | 'component' | 'prop' | 'game';

export interface SearchEntry {
  /** Unique across the index, so a result can be an option id. */
  id: string;
  kind: SearchKind;
  /** The sidebar section it sits under (Start here, Foundations, Components, Forms, Brand); a prop takes its component's. */
  group: string;
  /** The line a result shows: the page or component name, or the prop name. */
  title: string;
  /** The line under it: "Page" for a docs page, a component's description, a prop's component and type. */
  detail: string;
  /** Where Enter goes: the page, or a component's Props section for a prop. Empty for a game. */
  to: string;
  /** A game opens in the sidebar instead of going anywhere. */
  game?: GameId;
  /** Lower-cased text the query is matched against. */
  text: string;
}

/** One sidebar link, as NAV lists it. */
interface PageLink {
  group: string;
  label: string;
  to: string;
}

const lower = (...parts: readonly string[]) => parts.join(' ').toLowerCase();

/** A safe, unique option id from any text. */
const idFor = (...parts: readonly string[]) => `search-${parts.join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

function pageEntry(link: PageLink, manifest: Manifest | undefined): SearchEntry {
  if (!manifest) {
    return {
      id: idFor('page', link.to),
      kind: 'page',
      group: link.group,
      title: link.label,
      detail: 'Page',
      to: link.to,
      text: lower(link.label, link.group),
    };
  }
  return {
    id: idFor('component', manifest.slug),
    kind: 'component',
    group: link.group,
    title: link.label,
    detail: manifest.description,
    to: link.to,
    text: lower(link.label, manifest.name, link.group, manifest.description, ...manifest.docs.badges),
  };
}

function propEntries(manifest: Manifest, group: string): SearchEntry[] {
  const to = `${routeFor(manifest)}#${SECTIONS.props.id}`;
  return manifest.docs.props.map((prop) => ({
    id: idFor('prop', manifest.slug, prop.name),
    kind: 'prop' as const,
    group,
    title: prop.name,
    detail: `${manifest.name} prop · ${prop.type}`,
    to,
    text: lower(prop.name, manifest.name, prop.type, prop.description),
  }));
}

/** One Arcade game, as GAMES lists it. */
interface GameLink {
  id: GameId;
  label: string;
  blurb: string;
}

function gameEntry(game: GameLink): SearchEntry {
  return {
    id: idFor('game', game.id),
    kind: 'game',
    group: 'Arcade',
    title: game.label,
    detail: `Game · ${game.blurb}`,
    to: '',
    game: game.id,
    text: lower(game.label, 'arcade game play', game.blurb),
  };
}

/**
 * Every page in sidebar order (Start here, Foundations, the components, Brand), then the Arcade's games, then
 * every component's props in the same order. A page whose route is a manifest's is a component entry, described
 * by its manifest.
 */
export function buildSearchIndex(nav: readonly PageLink[], manifests: readonly Manifest[], games: readonly GameLink[] = []): SearchEntry[] {
  const byRoute = new Map(manifests.map((manifest) => [routeFor(manifest), manifest]));
  const pages = nav.map((link) => pageEntry(link, byRoute.get(link.to)));
  const props = nav.flatMap((link) => {
    const manifest = byRoute.get(link.to);
    return manifest ? propEntries(manifest, link.group) : [];
  });
  return [...pages, ...games.map(gameEntry), ...props];
}

/** How well an entry's title meets the query: whole, its start, a word's start, anywhere, or only its other text. */
function titleScore(title: string, query: string): number {
  const name = title.toLowerCase();
  if (name === query) return 4;
  if (name.startsWith(query)) return 3;
  if (name.split(/[^a-z0-9]+/).some((word) => word.startsWith(query))) return 2;
  return name.includes(query) ? 1 : 0;
}

/** Pages and components rank above props when they match as well, so "button" finds the Button page first. */
const KIND_RANK: Record<SearchKind, number> = { component: 0, page: 0, game: 0, prop: 1 };

/** The default list with no query: every page and game, in sidebar order. */
export const EMPTY_QUERY_KINDS: readonly SearchKind[] = ['page', 'component', 'game'];

/**
 * The entries that hold every word of the query (in any order, anywhere in their text), best first: by how well
 * the title meets the query and its words, then pages before props, then index order. An empty query lists the pages.
 */
export function searchEntries(index: readonly SearchEntry[], query: string): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (q === '') return index.filter((entry) => EMPTY_QUERY_KINDS.includes(entry.kind));
  const words = q.split(/\s+/);
  // The whole query counts most ("icon button" → IconButton); a word of it counts too ("button size" → size).
  const score = (title: string) => 10 * titleScore(title, q) + Math.max(...words.map((word) => titleScore(title, word)));
  return index
    .map((entry, order) => ({ entry, order, score: score(entry.title) }))
    .filter(({ entry }) => words.every((word) => entry.text.includes(word)))
    .sort((a, b) => b.score - a.score || KIND_RANK[a.entry.kind] - KIND_RANK[b.entry.kind] || a.order - b.order)
    .map(({ entry }) => entry);
}
