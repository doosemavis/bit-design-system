/**
 * The Arcade's pixel art, drawn for bit (original patterns, 8x8). Each string is a row; '.' is transparent,
 * '#' the sprite's own color, 'o' the board color showing through (eyes, holes, shine), 'k' the line color
 * (an outline, so a yellow sprite still stands out on a white board).
 */

/** The rat, side on, facing right: ear, eye, nose at the front, feet, and a curl of tail behind. */
export const RAT: readonly string[] = [
  '........',
  '....##..',
  '..#####.',
  '.####o##',
  '.#######',
  '#.#####.',
  '#..#..#.',
  '.#......',
];

/** A wedge of cheese with holes, outlined. */
export const CHEESE: readonly string[] = [
  '......kk',
  '....kk#k',
  '..kk###k',
  'kk##o##k',
  'k######k',
  'k#o####k',
  'k####o#k',
  'kkkkkkkk',
];

/** The cat, face on: two ears, two eyes, a mouth and its paws. */
export const CAT: readonly string[] = [
  '##....##',
  '###..###',
  '########',
  '#o####o#',
  '########',
  '###oo###',
  '.######.',
  '..#..#..',
];

/** The snake's food: a little gem with a glint, outlined. */
export const GEM: readonly string[] = [
  '...kk...',
  '..k##k..',
  '.k####k.',
  'k#o####k',
  'k######k',
  '.k####k.',
  '..k##k..',
  '...kk...',
];

export const SPRITES = { RAT, CHEESE, CAT, GEM } as const;
