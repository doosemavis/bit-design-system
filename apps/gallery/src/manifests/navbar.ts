import { createElement } from 'react';
import type { ReactElement } from 'react';
import { Button, Navbar } from '@bit-ds/react';
import type { NavbarProps } from '@bit-ds/react';
import type { ChildSpec, ControlState, Manifest } from './types';
import { NavbarDemo } from '../demos/NavbarDemo';
import { NavbarExamples } from '../pages/navbar/NavbarExamples';

/** The bar's purple takes an outline Button (the surface reads on it); the pill's surface takes the solid one. */
const onBar = (state: ControlState) => state.variant === 'bar';
const actionsJsx = (state: ControlState) =>
  onBar(state) ? '<Button variant="outline" color="neutral" size="sm">Sign in</Button>' : '<Button size="sm">Sign in</Button>';

const LINKS: readonly ChildSpec[] = [
  { component: 'NavbarLink', props: { href: '/games', current: true }, children: 'Games' },
  { component: 'NavbarLink', props: { href: '/scores' }, children: 'Scores' },
  { component: 'NavbarLink', props: { href: '/shop' }, children: 'Shop' },
];

export const navbar: Manifest = {
  name: 'Navbar',
  slug: 'navbar',
  group: 'components',
  related: ['menu', 'link', 'modetoggle'],
  component: Navbar,
  description:
    "An app's top bar: brand, links with the current page marked, and actions. Narrow, the links fold into a Menu.",
  controls: [
    { kind: 'axis', prop: 'variant', values: ['pill', 'bar'], default: 'pill' },
    { kind: 'axis', prop: 'size', values: ['sm', 'md'], default: 'md' },
    { kind: 'select', prop: 'collapse', values: ['auto', 'always', 'never'], default: 'auto' },
    { kind: 'text', prop: 'label', default: 'Main' },
  ],
  fixedProps: { brand: 'Arcade' },
  children: LINKS,
  parts: ['NavbarLink'],
  variantsLayout: 'stack',
  elementProps: (state) => [
    {
      prop: 'actions',
      value: onBar(state)
        ? createElement(Button, { variant: 'outline', color: 'neutral', size: 'sm' }, 'Sign in')
        : createElement(Button, { size: 'sm' }, 'Sign in'),
      jsx: actionsJsx(state),
      imports: ['Button'],
    },
  ],
  // Only for the live samples: keeps the links on this page, and names each sample's nav apart.
  demo: {
    render: (element) => createElement(NavbarDemo, { navbar: element as ReactElement<NavbarProps> }),
    code: { reactImports: [], bitImports: [], setup: [], props: [], wrap: (jsx) => jsx },
  },
  // The row of links is plain HTML and CSS; folding them into a Menu needs React.
  interactive: (state) => state.collapse !== 'never',
  extraSection: { id: 'section-examples', title: 'Examples', Component: NavbarExamples },
  presets: [
    { label: 'Purple bar', state: { variant: 'bar' } },
    { label: 'Folded', state: { collapse: 'always' } },
    { label: 'Small', state: { size: 'sm' } },
  ],
  docs: {
    badges: ['<nav> landmark', 'aria-current', 'Same height in both looks'],
    usage: {
      do: [
        'Use one Navbar at the top of an app, for its main pages, with the page you are on marked current.',
        'Pass your router’s link with NavbarLink asChild, so links navigate inside the app.',
        'Pick pill or bar freely: both are exactly the same height, so switching moves nothing else on the page.',
        'Keep the actions to one or two: a Sign in Button, a ModeToggle iconOnly.',
      ],
      dont: [
        'Put more than five or six links in it. Group the rest on their pages, or in a Menu.',
        'Use it for steps or tabs inside a page. Use Tabs.',
        'Expect it to stick to the top by itself, or to be the page header. Put it in your <header>, with position: sticky there.',
      ],
    },
    props: [
      {
        name: 'variant',
        className: 'bit-{variant}',
        type: "'pill' | 'bar'",
        default: "'pill'",
        description: 'pill: a surface bar with the links in one outlined pill. bar: the whole bar in primary, links in the pixel font. The same height.',
      },
      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md'", default: "'md'", description: 'Bar height: 62 or 70px, in both variants.' },
      {
        name: 'collapse',
        type: "'auto' | 'always' | 'never'",
        default: "'auto'",
        description: "When the links fold into a Menu: auto below 40rem of the Navbar's own width (a container query), always, or never. Rendered as data-collapse.",
      },
      { name: 'label', type: 'string', default: "'Main'", description: 'Names the <nav> landmark, so screen readers can tell it from other navigation.' },
      { name: 'brand', type: 'ReactNode', description: 'The start of the bar: your name or logo, often a link home.' },
      { name: 'actions', type: 'ReactNode', description: 'The end of the bar: a Button, an IconButton, a ModeToggle. They stay when the links fold.' },
      { name: 'menuLabel', type: 'string', default: "'Menu'", description: 'The words on the button the links fold into, and the title of its Menu.' },
      { name: 'children', type: 'ReactNode', description: 'NavbarLink, one per page.' },
      {
        name: 'NavbarLink',
        type: 'NavbarLinkProps',
        description: 'One link: href, current (aria-current="page"), and asChild for a router link. Folded, it becomes an item of the Menu.',
      },
      { name: 'ref', type: 'Ref<HTMLDivElement>', description: 'Goes to the root <div> (class bit-navbar), which takes className and every other prop.' },
    ],
    a11y: [
      'A <nav> landmark named by label (default "Main"), so screen readers list it among the landmarks. The root is a <div>: put the Navbar in your page’s <header> for the banner landmark (a header can’t hold another).',
      'The links are a list, and the current one has aria-current="page", read as "current page".',
      'Folded, a Menu button (aria-haspopup="menu") opens the links as a Menu: the arrow keys move, Enter follows a link, Esc closes. Its tap target is at least 44px tall.',
      'Rings on the purple bar take its contrast color, so they stay visible; the current chip keeps the theme ring.',
      'In forced-colors mode (Windows high contrast) the current link takes the system highlight.',
    ],
  },
};
