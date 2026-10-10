import { BitLogo, Button, Heading, Stack, Text } from '@bit-ds/react';
import { Link } from 'react-router-dom';
import { NAV } from '../shell/Sidebar';
import { PageSection } from '../ui/PageSection';
import { ComponentTiles } from './home/ComponentTiles';
import { Facts, QuickStart, StartBuilding } from './home/HomeCards';
import { NamingRule } from './home/NamingRule';

/** Where "Browse components" goes: the first component in the sidebar, whatever that becomes. */
export const BROWSE_TARGET = NAV.find((item) => item.group === 'Components')!.to;

/**
 * The Overview: the logo, tagline, buttons and four facts beside a quick start card; every component as an
 * equal live tile; three ways to start building; and the naming rule. Every block is a bit Card, as on Tokens.
 */
export function HomePage() {
  return (
    <Stack gap={48}>
      <Stack gap={32}>
        <div className="gallery-hero">
          <Stack gap={16} align="start">
            <Heading size={40}>
              <BitLogo size="lg" />
            </Heading>
            <Text size={18}>A retro-styled React Design System for people who want a bit of nostalgia.</Text>
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
            <Facts />
          </Stack>
          <QuickStart />
        </div>
      </Stack>
      <ComponentTiles />
      <PageSection id="home-start" title="Start building">
        <Text color="neutral">Install it, see every token, and find an icon.</Text>
        <StartBuilding />
      </PageSection>
      {/* A plain heading, not a PageSection: the table itself is the region named "The naming rule". */}
      <Stack gap={12}>
        <Heading>The naming rule</Heading>
        <Text color="neutral">The prop you write is the class it emits is the token it reads, with a real Button in each row.</Text>
        <NamingRule />
      </Stack>
    </Stack>
  );
}
