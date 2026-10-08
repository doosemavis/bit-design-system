/** One icon: its bit name and the single SVG path Icon draws on Material's 960-unit grid. */
export interface IconData {
  /** The Material name with `_` → `-`, plus `-fill` for a fill icon: `keyboard-arrow-down`, `favorite-fill`. Its class is `bit-icon-{name}`. */
  readonly name: string;
  /** One path for `viewBox="0 -960 960 960"`. */
  readonly path: string;
}

/** An icon and its fill version. */
export interface IconPair {
  readonly regular: IconData;
  readonly fill: IconData;
}

/** One heading of the curated set, in the gallery's order. */
export interface IconGroup {
  readonly label: string;
  readonly icons: readonly IconPair[];
}
