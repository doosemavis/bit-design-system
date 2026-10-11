/**
 * The Arcade's games, in sidebar order. They are not pages. A sidebar game turns the sidebar into the game; a stage
 * game takes over the main area (black, the game centered), leaving the header and the sidebar as they are.
 */
export const GAMES = [
  { id: 'snake', label: 'Snake', blurb: 'Steer the snake to the food and grow. Don’t hit a wall or yourself.', place: 'sidebar' },
  { id: 'cheese-run', label: 'Cheese Run', blurb: 'Run the rat through a new maze each level to the cheese, before the clock or the cat.', place: 'sidebar' },
  { id: 'bit-blaster', label: 'Bit Blaster', blurb: 'Hold off the swarm from your ship: dodge the bombs, duck behind the shields, clear the wave.', place: 'stage' },
] as const;

type Game = (typeof GAMES)[number];
export type GameId = Game['id'];
/** A game that plays in the sidebar (the phone sheet on a phone). */
export type SidebarGameId = Extract<Game, { place: 'sidebar' }>['id'];
/** A game that plays in the main area. */
export type StageGameId = Extract<Game, { place: 'stage' }>['id'];

export const gameLabel = (id: GameId): string => GAMES.find((game) => game.id === id)!.label;

/** True for a stage game's id, and false for anything else (a sidebar game, or junk from history state). */
export const isStageGame = (id: unknown): id is StageGameId => GAMES.some((game) => game.id === id && game.place === 'stage');
