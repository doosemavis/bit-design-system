import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { iconButton } from './iconButton';
import { findManifest, routeFor } from './index';
import { defaultState } from '../engine/state';
import { renderManifest } from '../engine/renderManifest';
import { toJsx } from '../code/toJsx';
import { CODE_FORMATS } from '../code/codeFormats';
import { variantAxes } from '../engine/VariantsTable';

const html = CODE_FORMATS.find((f) => f.id === 'html')!;

describe('IconButton manifest', () => {
  it('is routed at /components/iconbutton', () => {
    expect(findManifest('iconbutton')).toBe(iconButton);
    expect(routeFor(iconButton)).toBe('/components/iconbutton');
  });

  it('prints the icon import and label; tooltip only when set', () => {
    expect(toJsx(iconButton, defaultState(iconButton))).toBe(
      "import { IconButton, iconDelete } from '@bit-ds/react';\n\n<IconButton icon={iconDelete} label=\"Delete\" />",
    );
    expect(toJsx(iconButton, { ...defaultState(iconButton), tooltip: 'Delete' })).toContain('tooltip="Delete"');
  });

  it('the HTML tab prints the class form with a note', () => {
    const out = html.code(iconButton, defaultState(iconButton));
    expect(out).toContain("<!-- Needs import '@bit-ds/react/icons.css' as well as styles.css. A tooltip needs React. -->");
    expect(out).toContain('<button type="button" class="bit-iconButton bit-neutral bit-outline bit-md bit-button" aria-label="Delete">');
    expect(out).toContain('  <span class="bit-icon bit-icon-delete bit-md" aria-hidden="true"></span>');
    expect(out.trimEnd().endsWith('</button>')).toBe(true);
  });

  it('variants are color x variant', () => {
    const axes = variantAxes(iconButton)!;
    expect(axes.row?.prop).toBe('color');
    expect(axes.column.prop).toBe('variant');
  });

  it('the preview button has bit-iconButton and the aria-label', () => {
    render(renderManifest(iconButton, defaultState(iconButton)));
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('bit-iconButton');
  });
});
