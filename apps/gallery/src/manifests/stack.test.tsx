import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { renderManifest } from '../engine/renderManifest';
import { buildProps } from '../engine/buildProps';
import { defaultState } from '../engine/state';
import { toJsx } from '../code/toJsx';
import { toHtml } from '../code/toHtml';
import { stack } from './stack';

const BADGES = '  <Stack>\n    <Badge color="primary">One</Badge>\n    <Badge color="success">Two</Badge>\n    <Badge color="danger">Three</Badge>\n  </Stack>';

describe('Stack page: the Stack sits in a Box whose width the visitor picks', () => {
  it('a container width control: 160, 240, 360 or 100%, 240 by default, never a Stack prop', () => {
    const control = stack.controls.find((c) => c.prop === 'containerWidth');
    expect(control).toMatchObject({ kind: 'select', values: ['160', '240', '360', '100%'], default: '240', label: 'container width', virtual: true });
    expect(buildProps(stack, defaultState(stack))).not.toHaveProperty('containerWidth');
  });

  it('the preview wraps the Stack in a Box at that width, padded 4px all round, so stretch has a real edge to fill to', () => {
    const { container, rerender } = render(renderManifest(stack, defaultState(stack)));
    const box = container.firstElementChild as HTMLElement;
    expect(box).toHaveClass('bit-box');
    expect(box.style.width).toBe('240px');
    expect(box).toHaveAttribute('data-p', '4');
    expect(box.firstElementChild).toHaveClass('bit-stack');
    rerender(renderManifest(stack, { ...defaultState(stack), containerWidth: '100%' }));
    expect((container.firstElementChild as HTMLElement).style.width).toBe('100%');
  });

  it('the code prints the same Box around the Stack: a px number, or 100% as a string', () => {
    expect(toJsx(stack, defaultState(stack))).toBe(
      `import { Badge, Box, Stack } from '@bit-ds/react';\n\n<Box padding={4} style={{ width: 240 }}>\n${BADGES}\n</Box>`,
    );
    expect(toJsx(stack, { ...defaultState(stack), containerWidth: '100%' })).toContain("<Box padding={4} style={{ width: '100%' }}>");
  });

  it('a container height control: auto, 80, 120 or 200, auto by default, never a Stack prop', () => {
    const control = stack.controls.find((c) => c.prop === 'containerHeight');
    expect(control).toMatchObject({ kind: 'select', values: ['auto', '80', '120', '200'], default: 'auto', label: 'container height', virtual: true });
    expect(buildProps(stack, defaultState(stack))).not.toHaveProperty('containerHeight');
  });

  it('a set height goes on the Box, and the Stack fills it, so stretch in a row and justify in a column show', () => {
    const { container, rerender } = render(renderManifest(stack, { ...defaultState(stack), containerHeight: '80' }));
    const box = container.firstElementChild as HTMLElement;
    expect(box.style.height).toBe('80px');
    expect((box.firstElementChild as HTMLElement).style.height).toBe('100%');
    rerender(renderManifest(stack, defaultState(stack)));
    expect(box.style.height).toBe('');
    expect((box.firstElementChild as HTMLElement).style.height).toBe('');
  });

  it('the code prints the height on the Box and height 100% on the Stack, only when a height is set', () => {
    expect(toJsx(stack, { ...defaultState(stack), containerHeight: '80', direction: 'row' })).toBe(
      `import { Badge, Box, Stack } from '@bit-ds/react';\n\n<Box padding={4} style={{ width: 240, height: 80 }}>\n  <Stack style={{ height: '100%' }} direction="row">\n    <Badge color="primary">One</Badge>\n    <Badge color="success">Two</Badge>\n    <Badge color="danger">Three</Badge>\n  </Stack>\n</Box>`,
    );
    expect(toJsx(stack, defaultState(stack))).not.toContain('height');
  });

  it('the HTML matches: the Box div with its width, the Stack inside', () => {
    const html = toHtml(renderManifest(stack, defaultState(stack)));
    expect(html).toMatch(/^<div class="bit-box" data-p="4" style="width:240px">\n {2}<div class="bit-stack"/);
  });
});
