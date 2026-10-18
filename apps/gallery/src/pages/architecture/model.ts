/**
 * bit's architecture as data: the layers top to bottom, the package box each sits in, and the edges between them with
 * the verb each is drawn with. The Architecture page draws its diagram from this, and architecture.test.ts parses the
 * Mermaid diagram in ARCHITECTURE.md and fails unless it has the same nodes, boxes and labelled edges, so the two
 * pictures can't drift apart. Change ARCHITECTURE.md and this together.
 */

/** A package box. `core` and `published` are the two Mermaid subgraphs; `app` is the consumer, outside both. */
export type Box = 'core' | 'published' | 'app';

export interface Layer {
  /** The Mermaid node id. */
  readonly id: 'theme' | 'tokens' | 'css' | 'components' | 'app';
  /** The level's title on the page, and the first line of the node's label in ARCHITECTURE.md. */
  readonly title: string;
  readonly box: Box;
}

export const LAYERS: readonly Layer[] = [
  { id: 'theme', title: 'Palette', box: 'core' },
  { id: 'tokens', title: 'Semantic tokens', box: 'core' },
  { id: 'css', title: 'Component CSS', box: 'core' },
  { id: 'components', title: 'Components', box: 'published' },
  { id: 'app', title: 'Your app', box: 'app' },
];

/**
 * The framework bit is designed for and doesn't build, fed by the core's CSS: a dashed node in ARCHITECTURE.md's
 * Mermaid diagram, which this model must match. The page doesn't draw it (owner, 2026-10-17).
 */
export const FUTURE = { id: 'angular', title: 'Future: @bit-ds/angular' } as const;

export interface Edge {
  readonly from: string;
  readonly to: string;
  /** The label on the arrow: how one layer feeds the next. */
  readonly verb: string;
  /** False for the dashed edge into the framework that isn't built. */
  readonly built: boolean;
}

export const EDGES: readonly Edge[] = [
  { from: 'theme', to: 'tokens', verb: 'maps onto', built: true },
  { from: 'tokens', to: 'css', verb: 'read by', built: true },
  { from: 'css', to: 'components', verb: 'styles the classes', built: true },
  { from: 'components', to: 'app', verb: 'imported by', built: true },
  { from: 'css', to: FUTURE.id, verb: 'would style', built: false },
];

/** The verb on the built edge from one layer to the next. Throws if the model has no such edge: a drawing bug. */
export function verbBetween(from: Layer['id'], to: Layer['id']): string {
  const edge = EDGES.find((candidate) => candidate.from === from && candidate.to === to && candidate.built);
  if (!edge) throw new Error(`[gallery] architecture model has no edge ${from} → ${to}`);
  return edge.verb;
}

/** The layers in one box, in order. */
export const layersIn = (box: Box): readonly Layer[] => LAYERS.filter((layer) => layer.box === box);
