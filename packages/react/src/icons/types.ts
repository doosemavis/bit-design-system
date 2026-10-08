/** One icon: its bit name and the single SVG path Icon draws on Material's 960-unit grid. */
export interface IconData {
  /** The Material name with `_` → `-`: `keyboard-arrow-down`. Its class is `bit-icon-{name}`. */
  readonly name: string;
  /** One path for `viewBox="0 -960 960 960"`. */
  readonly path: string;
  /** The filled version's path, drawn with iconFilled. */
  readonly fillPath: string;
}

/** One heading of the curated set, in the gallery's order. */
export interface IconGroup {
  readonly label: string;
  readonly icons: readonly IconData[];
}
