import { Badge, Button, Card, CardBody, Heading, Stack, Text } from '@bit-ds/react';
import { readBest } from '../../arcade/bestScore';
import { GAMES } from '../../arcade/games';
import type { GameId } from '../../arcade/games';
import { usePlayGame } from '../../shell/usePlayGame';
import { PageSection } from '../../ui/PageSection';

/** One game's card: its name (and best score, once there is one), its blurb, and a Play button on the card's floor. */
function GameCard({ id, label, blurb, onPlay }: { id: GameId; label: string; blurb: string; onPlay?: (game: GameId) => void }) {
  const best = readBest(id);
  return (
    <Card flat role="group" aria-label={label} className="gallery-home-arcade__card">
      <CardBody>
        <Stack gap={12} align="start" className="gallery-home-arcade__body">
          <Stack direction="row" gap={8} align="center" wrap>
            <Heading size={26}>{label}</Heading>
            {best > 0 ? <Badge variant="outline" color="neutral">{`Best ${best}`}</Badge> : null}
          </Stack>
          <Text>{blurb}</Text>
          <Button className="gallery-home-arcade__play" onClick={() => onPlay?.(id)}>{`Play ${label}`}</Button>
        </Stack>
      </CardBody>
    </Card>
  );
}

/**
 * The Arcade, up front: Snake and Cheese Run are real games built from bit, so they are the proof it builds
 * more than demos. Each card's Play button opens its game in the sidebar (the sheet on a phone), as the
 * sidebar's own Arcade items do; the best score is the one the game keeps.
 */
export function PressStart() {
  const play = usePlayGame();
  return (
    <PageSection id="home-arcade" title="Press start">
      <Text color="neutral">Real games, built from bit: Card cabinets, Badge scores, Button controls. Pick one and it plays in the sidebar.</Text>
      <div className="gallery-token-grid">
        {GAMES.map((game) => (
          <GameCard key={game.id} id={game.id} label={game.label} blurb={game.blurb} onPlay={play} />
        ))}
      </div>
    </PageSection>
  );
}
