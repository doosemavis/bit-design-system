// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { MANIFESTS } from '../../manifests';
import { AXES, parseAxes, REPO_FILES, splitLinks } from './architectureDoc';
import { missingRepoLink } from '../../test/repoLinks';
import { AXIS_ICONS } from './KindTable';
import { EDGES, FUTURE, LAYERS } from './model';
import { ARCHITECTURE_FACTS, paletteNames, parseLayerOrder, runtimeDependencies } from './facts';
import { DECORATOR_SNIPPET } from './LayerStack';

/**
 * Drift tests. The base spec drifted because nothing checked it, so the Architecture page and ARCHITECTURE.md are
 * checked here against the files they describe. A failure means the docs went stale: fix the docs, not this test.
 */
const repo = (path: string) => readFileSync(new URL(`../../../../../${path}`, import.meta.url), 'utf8');

// The page reads the theme the gallery ships; here that is the source file it is built from.
vi.mock('./themeSource', async () => {
  const { readFileSync: read } = await import('node:fs');
  return { THEME_CSS: read(new URL('../../../../../packages/core/src/themes/power-up.css', import.meta.url), 'utf8') };
});

const architectureMd = repo('ARCHITECTURE.md');
const readme = repo('README.md');
const theme = repo('packages/core/src/themes/power-up.css');
const reactPackage = JSON.parse(repo('packages/react/package.json')) as { name: string; version: string; dependencies?: Record<string, string> };

describe('Architecture: the facts the page states match their sources', () => {
  it('the cascade layers are the order styles.css declares, the theme repeats, and ARCHITECTURE.md quotes', () => {
    const declared = parseLayerOrder(repo('packages/core/src/index.css'));
    expect(declared).toEqual(['bit.reset', 'bit.tokens', 'bit.components']);
    expect(ARCHITECTURE_FACTS.layers).toEqual(declared);
    expect(architectureMd).toContain(`@layer ${declared.join(', ')};`);
  });

  it('the component count is one per manifest, and ARCHITECTURE.md and the README say the same number', () => {
    expect(ARCHITECTURE_FACTS.components).toBe(MANIFESTS.length);
    expect(architectureMd).toContain(`bit has ${MANIFESTS.length} components`);
    expect(readme).toContain(`all ${MANIFESTS.length} components`);
  });

  it('the package name and version are packages/react/package.json’s, and it has no runtime dependencies', () => {
    expect(ARCHITECTURE_FACTS.packageName).toBe(reactPackage.name);
    expect(ARCHITECTURE_FACTS.version).toBe(reactPackage.version);
    expect(reactPackage.dependencies).toBeUndefined();
    expect(ARCHITECTURE_FACTS.runtimeDependencies).toBe(0);
    expect(architectureMd).toContain('no runtime dependencies');
  });

  it('the token tiers: tier 1 is the theme’s palette, and the token lists ARCHITECTURE.md names exist', () => {
    expect(ARCHITECTURE_FACTS.paletteColors).toBe(paletteNames(theme).length);
    expect(ARCHITECTURE_FACTS.paletteColors).toBeGreaterThan(0);
    const tokens = repo('packages/core/src/tokens.ts');
    for (const name of ['SEMANTIC_TOKENS', 'MODE_TOKENS']) {
      expect(architectureMd).toContain(`\`${name}\``);
      expect(tokens).toContain(`export const ${name}`);
    }
  });

  it('each rule in the decorator snippet is a real rule of its file: its selector, with that declaration inside it', () => {
    /** The body of the first top-level rule with exactly this selector, or undefined. */
    const ruleBody = (css: string, selector: string) => {
      const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(?:^|\\n)${escaped} \\{([^}]*)\\}`).exec(css)?.[1];
    };
    const rules = [...DECORATOR_SNIPPET.matchAll(/^(\S[^{\n]*) \{\n\s+([^\n]+)\n\}/gm)].map((m) => [m[1]!, m[2]!] as const);
    expect(rules).toEqual([
      ['.bit-primary', '--_bit-color: var(--bit-color-primary);'],
      ['.bit-button.bit-solid', 'background: var(--_bit-color);'],
    ]);
    expect(ruleBody(repo('packages/core/src/system/colors.css'), rules[0]![0])).toContain(rules[0]![1]);
    expect(ruleBody(repo('packages/core/src/components/button.css'), rules[1]![0])).toContain(rules[1]![1]);
  });

  it('the page reads all six axes from ARCHITECTURE.md §4, every cell filled, and has an icon for each', () => {
    expect(AXES.map((row) => row.axis)).toEqual(['Implementation model', 'Distribution', 'Tokens', 'Styling', 'Component API', 'Governance']);
    for (const row of AXES) {
      expect(row.choice && row.why && row.cost && row.revisit, row.axis).toBeTruthy();
      expect(row.over.length, row.axis).toBeGreaterThan(0);
      expect(AXIS_ICONS[row.axis], row.axis).toBeDefined();
    }
  });
});

describe('Architecture: the parsers', () => {
  it('parseLayerOrder reads the first layer statement and ignores layer blocks', () => {
    expect(parseLayerOrder('@layer a.b, c ;\n@layer d { x { color: red } }')).toEqual(['a.b', 'c']);
    expect(parseLayerOrder('@layer d { x { color: red } }')).toEqual([]);
    expect(parseLayerOrder('')).toEqual([]);
  });

  it('paletteNames lists each declared palette name once, not the ones only read', () => {
    expect(paletteNames('--bit-palette-red: #f00; a { color: var(--bit-palette-blue); } --bit-palette-red: #e00;')).toEqual(['red']);
  });

  it('runtimeDependencies is the keys of dependencies, and none when the field is missing', () => {
    expect(runtimeDependencies({ dependencies: { a: '1', b: '2' } })).toEqual(['a', 'b']);
    expect(runtimeDependencies({ name: 'x' })).toEqual([]);
  });
});

describe('Architecture: the naming chain’s theme lines', () => {
  it('sit inside a selector the theme really declares them under, light and dark', async () => {
    const { themeLines } = await import('./NamingChain');
    const fill = { token: '--bit-color-danger', palette: 'red', hex: '#D91A1A' };
    expect(themeLines(fill, 'light')).toBe('.bit-theme-power-up {\n  --bit-palette-red: #D91A1A;\n  --bit-color-danger: var(--bit-palette-red);\n}');
    expect(themeLines(fill, 'dark').split('\n')[0]).toBe('.bit-theme-power-up.bit-dark {');
    // Both selectors are in the theme's own lists: the class, and the class with a mode on the same element.
    expect(theme).toContain(':is(.bit-theme-power-up, [data-theme="power-up"]),');
    expect(theme).toMatch(/:is\(\.bit-theme-power-up, \[data-theme="power-up"\]\):is\(\.bit-dark, \[data-mode="dark"\]\)/);
  });
});

/** The first Mermaid block in a Markdown file, parsed: its nodes (id → first label line), subgraphs (id → node ids)
 * and labelled edges ("from -->|verb| to", dashed for a future edge). Enough Mermaid for ARCHITECTURE.md's diagram. */
function parseMermaid(md: string) {
  const block = /```mermaid\n([\s\S]*?)```/.exec(md)![1]!;
  const nodes = new Map<string, string>();
  const boxes = new Map<string, string[]>();
  const edges: { from: string; to: string; verb: string; built: boolean }[] = [];
  let box: string | null = null;
  for (const raw of block.split('\n')) {
    const line = raw.trim();
    const subgraph = /^subgraph (\w+)\[/.exec(line);
    if (subgraph) {
      box = subgraph[1]!;
      boxes.set(box, []);
      continue;
    }
    if (line === 'end') {
      box = null;
      continue;
    }
    const edge = /^(\w+) (-->|-\.->)\|([^|]+)\| (\w+)$/.exec(line);
    if (edge) {
      edges.push({ from: edge[1]!, to: edge[4]!, verb: edge[3]!, built: edge[2] === '-->' });
      continue;
    }
    const node = /^(\w+)\["([^"<]+)/.exec(line);
    if (node && !line.startsWith('subgraph')) {
      nodes.set(node[1]!, node[2]!);
      if (box) boxes.get(box)!.push(node[1]!);
    }
  }
  return { nodes, boxes, edges };
}

describe('Architecture: the page’s diagram and ARCHITECTURE.md’s Mermaid diagram are one graph', () => {
  const graph = parseMermaid(architectureMd);

  it('the same nodes, each titled as the page titles its level', () => {
    expect([...graph.nodes.keys()].sort()).toEqual([...LAYERS.map((layer) => layer.id), FUTURE.id].sort());
    for (const layer of LAYERS) expect(graph.nodes.get(layer.id), layer.id).toBe(layer.title);
    expect(graph.nodes.get(FUTURE.id)).toBe(FUTURE.title);
  });

  it('the same package boxes: core holds the first three levels, published holds Components, the app is outside both', () => {
    expect(graph.boxes.get('core')).toEqual(LAYERS.filter((layer) => layer.box === 'core').map((layer) => layer.id));
    expect(graph.boxes.get('published')).toEqual(LAYERS.filter((layer) => layer.box === 'published').map((layer) => layer.id));
    expect([...graph.boxes.keys()].sort()).toEqual(['core', 'published']);
  });

  it('the same edges with the same verbs, the future one dashed', () => {
    const key = (edge: { from: string; to: string; verb: string; built: boolean }) => `${edge.from} ${edge.built ? '-->' : '-.->'} ${edge.to}: ${edge.verb}`;
    expect(graph.edges.map(key).sort()).toEqual(EDGES.map(key).sort());
  });
});

describe('Architecture: parseAxes', () => {
  it('splits the rejected alternatives at semicolons, and throws on a row with the wrong number of cells', () => {
    const md = '## 4. What kind of design system this is\n| **A** | one | x; y | why | cost | later |\n\n## 5. Next';
    expect(parseAxes(md)).toEqual([{ axis: 'A', choice: 'one', over: ['x', 'y'], why: 'why', cost: 'cost', revisit: 'later' }]);
    expect(() => parseAxes('## 4. What kind of design system this is\n| **A** | one | two |\n## 5.')).toThrow(/has 3 cells, not 6/);
  });
});

describe('Architecture: §4 citations are links that land', () => {
  it('splitLinks cuts a cell into text and links, resolving a relative href against the repo\'s files', () => {
    expect(splitLinks('see [`a.mjs`](scripts/a.mjs) and [b](https://example.com/b).')).toEqual([
      { text: 'see ' },
      { text: '`a.mjs`', href: `${REPO_FILES}scripts/a.mjs` },
      { text: ' and ' },
      { text: 'b', href: 'https://example.com/b' },
      { text: '.' },
    ]);
    expect(splitLinks('no links, only `code`')).toEqual([{ text: 'no links, only `code`' }]);
    expect(splitLinks('[only](x.md#y)')).toEqual([{ text: 'only', href: `${REPO_FILES}x.md#y` }]);
  });

  it('every link in the six rows names a file the repo has and a heading in it, or this repo on GitHub', () => {
    const hrefs = AXES.flatMap((row) => [row.choice, ...row.over, row.why, row.cost].flatMap(splitLinks)).flatMap((span) => (span.href ? [span.href] : []));
    // The citations the design review found looking like links: spec §12 and §2, the commit, the CHANGELOG, three scripts.
    expect(hrefs.length).toBeGreaterThanOrEqual(8);
    expect(hrefs.map(missingRepoLink).filter(Boolean)).toEqual([]);
  });

  it('missingRepoLink says why a link would not land', () => {
    expect(missingRepoLink(`${REPO_FILES}README.md#components`)).toBeNull();
    expect(missingRepoLink(`${REPO_FILES}README.md#no-such-heading`)).toBe('README.md has no heading #no-such-heading');
    expect(missingRepoLink(`${REPO_FILES}NOPE.md`)).toBe('NOPE.md is not a file in the repo');
    expect(missingRepoLink('https://example.com/')).toBe('https://example.com/ is not a page of this repo');
  });
});
