import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { tooltip } from './tooltip';
import { findManifest, routeFor } from './index';
import { defaultState } from '../engine/state';
import { renderManifest } from '../engine/renderManifest';
import { toJsx } from '../code/toJsx';
import { CODE_FORMATS } from '../code/codeFormats';

describe('Tooltip manifest', () => {
  it('is routed at /components/tooltip', () => {
    expect(findManifest('tooltip')).toBe(tooltip);
    expect(routeFor(tooltip)).toBe('/components/tooltip');
  });

  it('prints the content and the trigger Button', () => {
    expect(toJsx(tooltip, defaultState(tooltip))).toBe(
      "import { Button, Tooltip } from '@bit-ds/react';\n\n<Tooltip content=\"Copy link\">\n  <Button variant=\"outline\" color=\"neutral\">Hover or focus me</Button>\n</Tooltip>",
    );
  });

  it('Keep open prints open={true}; describe off prints describe={false}', () => {
    expect(toJsx(tooltip, { ...defaultState(tooltip), pinned: true })).toContain('open={true}');
    expect(toJsx(tooltip, { ...defaultState(tooltip), describe: false })).toContain('describe={false}');
  });

  it('has no HTML tab', () => {
    expect(CODE_FORMATS.filter((f) => f.available(tooltip, defaultState(tooltip))).map((f) => f.id)).not.toContain('html');
  });

  it('shows a visible tooltip when pinned', () => {
    render(renderManifest(tooltip, { ...defaultState(tooltip), pinned: true }));
    expect(screen.getByRole('tooltip')).toBeVisible();
  });
});
