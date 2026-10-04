import { BitLogo, Button, Heading, Stack, Text } from '@bit-ds/react';
import { Link } from 'react-router-dom';
import { NAV } from '../shell/Sidebar';
import { ComponentTiles } from './home/ComponentTiles';
import { GetStarted } from './home/GetStarted';
import { NamingRule } from './home/NamingRule';

/** Where "Browse components" goes: the first component in the sidebar, whatever that becomes. */
export const BROWSE_TARGET = NAV.find((item) => item.group === 'Components')!.to;

export function HomePage() {
  return (
    <Stack gap={48}>
      <Stack gap={16} align="start">
        <Heading level={1}>
          <BitLogo size="lg" />
        </Heading>
        <Text size={18}>
          A retro-game React design system for people new to design systems. The prop you type is the class it emits is
          the token it reads.
        </Text>
        <Stack direction="row" gap={12} wrap>
          <Button asChild size="lg">
            <Link to={BROWSE_TARGET}>
              Browse components <span aria-hidden="true">→</span>
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" color="neutral">
            <Link to="/tokens">See the tokens</Link>
          </Button>
        </Stack>
      </Stack>
      <ComponentTiles />
      <Stack gap={16}>
        <Heading level={2}>Get started</Heading>
        <GetStarted />
      </Stack>
      <Stack gap={16}>
        <Heading level={2}>The naming rule</Heading>
        <NamingRule />
      </Stack>
    </Stack>
  );
}
