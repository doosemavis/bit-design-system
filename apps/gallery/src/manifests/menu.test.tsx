import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { menu } from './menu';
import { navbar } from './navbar';
import { findManifest, relatedManifests, routeFor } from './index';
import { defaultState } from '../engine/state';
import { renderManifest } from '../engine/renderManifest';
import { toJsx } from '../code/toJsx';

describe('Menu manifest', () => {
  it('is routed at /components/menu and suggests Select, Dialog and IconButton', () => {
    expect(findManifest('menu')).toBe(menu);
    expect(routeFor(menu)).toBe('/components/menu');
    expect(relatedManifests(menu).map((m) => m.name)).toEqual(['Select', 'Dialog', 'IconButton']);
  });

  it('prints the trigger Button as JSX and imports it, then the items', () => {
    const code = toJsx(menu, defaultState(menu));
    expect(code).toContain("import { Button, Menu, MenuItem, MenuSeparator } from '@bit-ds/react';");
    expect(code).toContain('<Menu trigger={<Button variant="outline" color="neutral">File</Button>} title="File">');
    expect(code).toContain('<MenuItem shortcut="⌘N">New game</MenuItem>');
    expect(code).toContain('<MenuItem danger={true}>Delete save</MenuItem>');
  });

  it('the preview opens on a click of its trigger, titled from the title control', async () => {
    const user = userEvent.setup();
    render(renderManifest(menu, { ...defaultState(menu), title: 'Game' }, { sample: true }));
    await user.click(screen.getByRole('button', { name: 'Game' }));
    expect(screen.getByRole('menu', { name: 'Game' })).toBeVisible();
  });
});

describe('Navbar manifest', () => {
  it('is routed at /components/navbar, suggests Menu, Link and ModeToggle, and stacks its Variants', () => {
    expect(findManifest('navbar')).toBe(navbar);
    expect(relatedManifests(navbar).map((m) => m.name)).toEqual(['Menu', 'Link', 'ModeToggle']);
    expect(navbar.variantsLayout).toBe('stack');
  });

  it('prints its actions as JSX: a solid Button on the pill, an outline one on the bar', () => {
    expect(toJsx(navbar, defaultState(navbar))).toContain('actions={<Button size="sm">Sign in</Button>}');
    expect(toJsx(navbar, { ...defaultState(navbar), variant: 'bar' })).toContain(
      'actions={<Button variant="outline" color="neutral" size="sm">Sign in</Button>}',
    );
  });

  it('a click on a sample link stays on this page, and each sample names its nav apart', async () => {
    const user = userEvent.setup();
    render(
      <>
        {renderManifest(navbar, { ...defaultState(navbar), collapse: 'never' }, { sample: true })}
        {renderManifest(navbar, { ...defaultState(navbar), collapse: 'never' }, { sample: true })}
      </>,
    );
    const navs = screen.getAllByRole('navigation');
    expect(new Set(navs.map((nav) => nav.getAttribute('aria-label'))).size).toBe(2);
    expect(navs[0]!.getAttribute('aria-label')).toMatch(/^Main, sample \d+$/);
    const before = window.location.href;
    await user.click(screen.getAllByRole('link', { name: 'Scores' })[0]!);
    expect(window.location.href).toBe(before);
  });
});
