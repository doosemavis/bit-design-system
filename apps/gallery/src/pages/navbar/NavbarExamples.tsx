import { BitTheme, Box, Button, ModeToggle, Navbar, NavbarLink } from '@bit-ds/react';
import type { NavbarProps } from '@bit-ds/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { ExampleList } from '../../ui/ExampleCard';
import type { Example } from '../../ui/ExampleCard';

/** Three of this site's own pages, so the links really go somewhere. */
const PAGES = [
  { to: '/components/menu', label: 'Menu' },
  { to: '/components/navbar', label: 'Navbar' },
  { to: '/components/link', label: 'Link' },
] as const;

/** The site's pages as router links; the one you're on is current. */
function DocsLinks() {
  const { pathname } = useLocation();
  return PAGES.map((page) => (
    <NavbarLink key={page.to} asChild current={pathname === page.to}>
      <RouterLink to={page.to}>{page.label}</RouterLink>
    </NavbarLink>
  ));
}

function DocsNavbar(props: Partial<NavbarProps>) {
  return (
    <Navbar label="Docs" brand={<RouterLink to="/">bit docs</RouterLink>} {...props}>
      <DocsLinks />
    </Navbar>
  );
}

const EXAMPLES: readonly Example[] = [
  {
    title: 'App header with router links',
    when: "Your router's link goes in NavbarLink asChild: it keeps its own navigation, and gets the Navbar's look and aria-current.",
    sample: <DocsNavbar actions={<ModeToggle iconOnly size="sm" />} />,
    wide: true,
    code: `import { Link as RouterLink, useLocation } from 'react-router-dom';

const { pathname } = useLocation();

<Navbar
  label="Docs"
  brand={<RouterLink to="/">bit docs</RouterLink>}
  actions={<ModeToggle iconOnly size="sm" />}
>
  {pages.map((page) => (
    <NavbarLink key={page.to} asChild current={pathname === page.to}>
      <RouterLink to={page.to}>{page.label}</RouterLink>
    </NavbarLink>
  ))}
</Navbar>`,
    note: 'Navbar is not the page header and does not stick by itself: put it in your <header>, and give that header position: sticky; top: 0. Its root is a <div>, because a <header> can’t hold another.',
  },
  {
    title: 'The bar in a dark subtree',
    when: 'BitTheme mode="dark" around the Navbar (or on the page) gives it the dark tokens; both looks follow, and an outline Button stays legible on the purple bar.',
    sample: (
      <BitTheme mode="dark">
        <Box padding={16}>
          <DocsNavbar variant="bar" label="Docs, dark" actions={<Button variant="outline" color="neutral" size="sm">Sign in</Button>} />
        </Box>
      </BitTheme>
    ),
    wide: true,
    code: `<BitTheme mode="dark">
  <Navbar
    variant="bar"
    label="Docs, dark"
    brand={<RouterLink to="/">bit docs</RouterLink>}
    actions={<Button variant="outline" color="neutral" size="sm">Sign in</Button>}
  >
    {links}
  </Navbar>
</BitTheme>`,
  },
  {
    title: 'On a phone, the links fold into a Menu',
    when: 'Below 40rem of its own width the Navbar shows a Menu button instead of the links; the brand and actions stay. The Menu is the retro window, with the current page filled.',
    sample: (
      <Box className="gallery-narrow">
        <DocsNavbar label="Docs, phone" actions={<Button size="sm">Sign in</Button>} />
      </Box>
    ),
    wide: true,
    code: `<div style={{ maxWidth: 360 }}>
  <Navbar label="Docs, phone" brand={brand} actions={<Button size="sm">Sign in</Button>}>
    {links}
  </Navbar>
</div>`,
    note: 'It folds by a container query on the Navbar’s own width, not the window’s, so a Navbar in a narrow column folds too. collapse="always" or "never" fixes it either way.',
  },
];

/** The Navbar page's Examples: router links, the bar in a dark subtree, and the phone fold. */
export function NavbarExamples() {
  return <ExampleList examples={EXAMPLES} />;
}
