import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageSection, SECTION_CLASS, SECTION_TITLE_CLASS } from './PageSection';

const css = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../gallery.css'), 'utf8');

describe('PageSection', () => {
  it('is a section named by its h2, which carries the title class for the accent bar', () => {
    render(
      <PageSection id="s1" title="Usage">
        <p>Body</p>
      </PageSection>,
    );
    const region = screen.getByRole('region', { name: 'Usage' });
    expect(region).toHaveClass(SECTION_CLASS);
    expect(screen.getByRole('heading', { level: 2, name: 'Usage' })).toHaveClass(SECTION_TITLE_CLASS);
  });

  it('landmark={false} renders a plain div with the same classes, for a section whose table already names the region', () => {
    const { container } = render(
      <PageSection id="s2" title="Headings" landmark={false}>
        <p>Body</p>
      </PageSection>,
    );
    expect(screen.queryByRole('region')).toBeNull();
    expect(container.firstElementChild!.tagName).toBe('DIV');
    expect(container.firstElementChild).toHaveClass(SECTION_CLASS);
  });

  // Owner pick, 2026-10-10: 64px, a rule, 64px between sections, and an accent bar under each title.
  it('gallery.css draws the break: a rule and 64px on every section after the first, and the accent bar', () => {
    expect(css).toMatch(/\.gallery-section \+ \.gallery-section \{\s*padding-top: var\(--bit-space-64px\);\s*border-top: 2px solid var\(--bit-color-line\);\s*\}/);
    expect(css).toMatch(/\.gallery-section-title::after \{[^}]*width: var\(--bit-space-48px\);[^}]*background: var\(--bit-color-accent\);/);
  });
});
