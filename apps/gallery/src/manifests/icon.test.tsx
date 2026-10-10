import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { iconHome } from '@bit-ds/react';
import { icon } from './icon';
import { findManifest, routeFor } from './index';
import { defaultState } from '../engine/state';
import { renderManifest } from '../engine/renderManifest';
import { toJsx } from '../code/toJsx';
import { CODE_FORMATS } from '../code/codeFormats';
import { componentSections } from '../pages/component/sections';

const html = CODE_FORMATS.find((f) => f.id === 'html')!;

describe('Icon manifest', () => {
  it('is routed at /components/icon in the components group', () => {
    expect(findManifest('icon')).toBe(icon);
    expect(routeFor(icon)).toBe('/components/icon');
  });

  it('prints the icon by export name and imports it; color, size and label only when set', () => {
    expect(toJsx(icon, defaultState(icon))).toBe("import { Icon, iconFavorite } from '@bit-ds/react';\n\n<Icon icon={iconFavorite} />");
    expect(toJsx(icon, { ...defaultState(icon), iconName: 'delete', iconFilled: true, color: 'danger', size: 'lg', label: 'Delete' })).toBe(
      "import { Icon, iconDelete } from '@bit-ds/react';\n\n<Icon icon={iconDelete} iconFilled color=\"danger\" size=\"lg\" label=\"Delete\" />",
    );
    expect(toJsx(icon, { ...defaultState(icon), color: 'danger', size: 'lg' }, { decorators: 'className' })).toContain(
      '<Icon icon={iconFavorite} className="bit-danger bit-lg" />',
    );
  });

  it('the preview draws the chosen icon, with no color class at none', () => {
    const { container } = render(renderManifest(icon, { ...defaultState(icon), iconName: 'home', iconFilled: true }));
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveClass('bit-icon', 'bit-icon-home', 'bit-iconFilled', 'bit-md');
    expect(svg.querySelector('path')).toHaveAttribute('d', iconHome.fillPath);
    expect(svg.getAttribute('class')).not.toMatch(/bit-(primary|neutral|success|warning|danger)/);
  });

  it('the HTML tab prints the class form, with a note to import icons.css', () => {
    expect(html.code(icon, { ...defaultState(icon), color: 'danger' })).toBe(
      "<!-- Needs import '@bit-ds/react/icons.css' as well as styles.css -->\n<span class=\"bit-icon bit-icon-favorite bit-danger bit-md\" aria-hidden=\"true\"></span>",
    );
  });

  it('the HTML for a filled icon adds bit-iconFilled after the note line', () => {
    expect(html.code(icon, { ...defaultState(icon), iconName: 'home', iconFilled: true })).toBe(
      "<!-- Needs import '@bit-ds/react/icons.css' as well as styles.css -->\n<span class=\"bit-icon bit-icon-home bit-iconFilled bit-md\" aria-hidden=\"true\"></span>",
    );
  });

  it('has the All icons section after Variants', () => {
    expect(componentSections(icon).map((s) => s.title)).toEqual(['Playground', 'Variants', 'All icons', 'Usage', 'Props', 'Accessibility', 'Related']);
  });
});
