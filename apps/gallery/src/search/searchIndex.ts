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
  /** The line under it: a docs page's sidebar section, a component's description, a prop's type and description. */
  detail: string;
  /** The component a prop belongs to, shown beside its name ("dismissLabel · Alert"). Props only. */
  owner?: string;
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
      detail: `In ${link.group}`,
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
    detail: prop.description ? `${prop.type} · ${prop.description}` : prop.type,
    owner: manifest.name,
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

/** The words of a title, split at spaces, punctuation and camelCase humps: "dismissLabel" → dismiss, label. */
function wordsOf(title: string): string[] {
  return title
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * Rank tiers, best first. A page (docs page, component or game) whose title starts with the query, then one with
 * a word that does; a prop whose name starts with it, then one with a word that does (or whose component's name
 * does, so "slider" lists Slider's props); then titles that only hold the query, pages before props; then
 * entries that hold it only in their other text (a description, a type).
 */
const TIER = { pageStart: 0, pageWord: 1, propStart: 2, propWord: 3, pageInside: 4, pageText: 5, propInside: 6, propText: 7 } as const;

/** The best tier `term` earns against an entry's title (and a prop's component). */
function tierFor(entry: SearchEntry, term: string): number {
  const prop = entry.kind === 'prop';
  const name = entry.title.toLowerCase();
  if (name.startsWith(term)) return prop ? TIER.propStart : TIER.pageStart;
  if (wordsOf(entry.title).some((word) => word.startsWith(term))) return prop ? TIER.propWord : TIER.pageWord;
  if (prop && entry.owner?.toLowerCase().startsWith(term)) return TIER.propWord;
  if (name.includes(term)) return prop ? TIER.propInside : TIER.pageInside;
  return prop ? TIER.propText : TIER.pageText;
}

/** How many of the query's words start the title, one of its words, or a prop's component: "size button" → Button's size. */
function coverage(entry: SearchEntry, words: readonly string[]): number {
  const targets = [...wordsOf(entry.title), entry.title.toLowerCase(), ...(entry.owner ? [entry.owner.toLowerCase()] : [])];
  return words.filter((word) => targets.some((target) => target.startsWith(word))).length;
}

/** Pages, components and games rank above props on a tie, so "button" finds the Button page first. */
const KIND_RANK: Record<SearchKind, number> = { component: 0, page: 0, game: 0, prop: 1 };

/** The default list with no query: every page and game, in sidebar order. */
export const EMPTY_QUERY_KINDS: readonly SearchKind[] = ['page', 'component', 'game'];

/** Plain code-unit order, so the ranking is the same in every locale. */
const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

interface Ranked {
  entry: SearchEntry;
  order: number;
  covered: number;
  tier: number;
}

function compareRanked(a: Ranked, b: Ranked): number {
  return (
    b.covered - a.covered ||
    a.tier - b.tier ||
    KIND_RANK[a.entry.kind] - KIND_RANK[b.entry.kind] ||
    a.entry.title.length - b.entry.title.length ||
    compareText(a.entry.title.toLowerCase(), b.entry.title.toLowerCase()) ||
    compareText(a.entry.owner ?? '', b.entry.owner ?? '') ||
    a.order - b.order
  );
}

/**
 * The entries that hold every word of the query (in any order, anywhere in their text), best first. A query of
 * several words ranks first the entries whose title or component starts with more of them ("icon button" →
 * IconButton). Then by tier (see TIER), with the whole query run together counting as well as its best word;
 * ties go to pages before props, then shorter titles, then alphabetical order. An empty query lists the pages
 * in sidebar order.
 */
export function searchEntries(index: readonly SearchEntry[], query: string): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (q === '') return index.filter((entry) => EMPTY_QUERY_KINDS.includes(entry.kind));
  const words = q.split(/\s+/);
  const terms = words.length > 1 ? [words.join(''), ...words] : words;
  return index
    .filter((entry) => words.every((word) => entry.text.includes(word)))
    .map((entry, order): Ranked => ({
      entry,
      order,
      covered: words.length > 1 ? coverage(entry, words) : 0,
      tier: Math.min(...terms.map((term) => tierFor(entry, term))),
    }))
    .sort(compareRanked)
    .map(({ entry }) => entry);
}

/** What a result's chip says. */
export const KIND_LABEL: Readonly<Record<SearchKind, string>> = { page: 'Page', component: 'Component', prop: 'Prop', game: 'Game' };

/** The heading over each kind's results. */
const GROUP_LABEL: Readonly<Record<SearchKind, string>> = { page: 'Pages', component: 'Components', prop: 'Props', game: 'Games' };

export interface ResultGroup {
  kind: SearchKind;
  /** The group's heading: Pages, Components, Games or Props. */
  label: string;
  entries: SearchEntry[];
}

/**
 * Results under one heading per kind. A group sits where its best result ranks, so the top result still comes
 * first, and keeps rank order inside. Reading the groups in order gives the order the arrow keys move in.
 */
export function groupResults(results: readonly SearchEntry[]): ResultGroup[] {
  const groups = new Map<SearchKind, SearchEntry[]>();
  for (const entry of results) groups.set(entry.kind, [...(groups.get(entry.kind) ?? []), entry]);
  return [...groups].map(([kind, entries]) => ({ kind, label: GROUP_LABEL[kind], entries }));
}
