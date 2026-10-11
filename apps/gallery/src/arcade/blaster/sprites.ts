/**
 * Bit Blaster's pixel art, drawn for bit (original patterns). Each string is a row; '#' is the sprite's own color,
 * '.' is space showing through. The aliens are 8x8 with two frames, flipped every march step.
 */

/** The top row's alien: a saucer with two eyes, its feet stepping in and out. */
const SAUCER: readonly (readonly string[])[] = [
  ['........', '..####..', '.#.##.#.', '########', '#.#.#.#.', '.######.', '..#..#..', '.#....#.'],
  ['........', '..####..', '.#.##.#.', '########', '.#.#.#.#', '.######.', '..#..#..', '..#..#..'],
];

/** The middle rows' alien: a round head with an antenna and a wide visor, its legs swinging. */
const SKULL: readonly (readonly string[])[] = [
  ['...##...', '.######.', '########', '#..##..#', '########', '..#..#..', '.#.##.#.', '#.#..#.#'],
  ['...##...', '.######.', '########', '#..##..#', '########', '..#..#..', '.#....#.', '..#..#..'],
];

/** The bottom rows' alien: a squat bug with a split brow, its claws opening and closing. */
const BUG: readonly (readonly string[])[] = [
  ['..####..', '.######.', '##.##.##', '########', '.#.##.#.', '#......#', '.#....#.', '........'],
  ['..####..', '.######.', '##.##.##', '########', '.#.##.#.', '.#....#.', '#......#', '........'],
];

/** The sprite for each swarm row, top first. */
export const ALIEN_ROWS: readonly (readonly (readonly string[])[])[] = [SAUCER, SKULL, SKULL, BUG, BUG];

/** The ship, 9 by 6: a nose, a cockpit, wings and two exhausts. */
export const SHIP: readonly string[] = ['....#....', '...###...', '...###...', '.#######.', '#########', '##.###.##'];

/** A burst, for an alien that's hit and for the ship. */
export const BOOM: readonly string[] = ['#..#..#.', '.#.#.#..', '..#.#..#', '##.#.##.', '..#.#...', '.#.#.#.#', '#..#..#.', '........'];
