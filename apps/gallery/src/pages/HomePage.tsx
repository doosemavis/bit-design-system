import { BitLogo, Button, Heading, Stack, Text } from '@bit-ds/react';
import { Link } from 'react-router-dom';
import { NAV } from '../shell/Sidebar';
import { useDocumentTitle } from '../shell/useDocumentTitle';
import { PageSection } from '../ui/PageSection';
import { ComponentTiles } from './home/ComponentTiles';
import { Facts, QuickStart, StartBuilding } from './home/HomeCards';
import { NamingRule } from './home/NamingRule';
import { PressStart } from './home/PressStart';
import { COMPONENT_GROUPS } from '../shell/navGroups';

/** Where "Browse components" goes: the first component of the first sidebar group (Button, under Actions). */
export const BROWSE_TARGET = NAV.find((item) => item.group === COMPONENT_GROUPS[0].label)!.to;

/**
 * The Overview: the logo, tagline, buttons and four facts beside the quick start code; the Arcade's two games;
 * every component as an equal live tile, grouped as the sidebar groups them; three ways to start building; and
 * the naming rule. Only what you press keeps the hard shadow (the tiles, the buttons); the rest is flat.
 */
export function HomePage() {
  useDocumentTitle(null);
  return (
    <Stack gap={64}>
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
      <PressStart />
      <ComponentTiles />
      <PageSection id="home-start" title="Start building">
        <Text color="neutral">Install it, see every token, and find an icon.</Text>
        <StartBuilding />
      </PageSection>
      {/* Not a landmark: the table itself is the region named "The naming rule". */}
      <PageSection id="home-naming-rule" title="The naming rule" landmark={false}>
        <Text color="neutral">The prop you write is the class it emits is the token it reads, with a real Button in each row.</Text>
        <NamingRule />
      </PageSection>
    </Stack>
  );
}
