/** The Arcade's games, in sidebar order. They are not pages: choosing one turns the sidebar into the game. */
export const GAMES = [
  { id: 'snake', label: 'Snake', blurb: 'Steer the snake to the food and grow. Don’t hit a wall or yourself.' },
  { id: 'cheese-run', label: 'Cheese Run', blurb: 'Run the rat through a new maze each level to the cheese, before the clock or the cat.' },
] as const;

export type GameId = (typeof GAMES)[number]['id'];

export const gameLabel = (id: GameId): string => GAMES.find((game) => game.id === id)!.label;
