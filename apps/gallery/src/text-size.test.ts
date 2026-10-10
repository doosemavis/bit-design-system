// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = fileURLToPath(new URL('.', import.meta.url));

/** Every gallery source file except tests. */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

/**
 * Reading text in the gallery is 16px or larger. 14px, the smallest step, is only for the uses listed here, each
 * with its reason. The old odd sizes (11, 13, 15) are deprecated and never written.
 */
const SMALL_TEXT_ALLOWED: Readonly<Record<string, readonly string[]>> = {
  // The Text sizes table's 14px row has to show 14px (the sample and its code); the font cards' group labels
  // (Sample, In use) are captions, and their "Used for" footer line is 14 so it fits on one line in the card.
  'pages/TypographyPage.tsx': ['size: 14', 'size={14', 'size={14', 'size={14', 'size={14'],
  // The Text page's "Hint or caption" example shows the 14px caption: the live sample and its code.
  'pages/text/TextExamples.tsx': ['size={14', 'size={14'],
  // The Accessibility page's "captions at 14" example shows a 14px caption: the live sample and its code.
  'pages/accessibility/a11yExamples.tsx': ['size={14', 'size={14'],
  // A token row's value: muted detail beside the token's name, at the caption size, so the longest (the inset
  // shadow) stays on one line on a phone.
  'pages/tokens/TokenRow.tsx': ['size={14'],
  // Pixel-face labels (sidebar groups, the preview and controls titles): uppercase display type, not
  // reading text, at the 14px floor.
  'shell/Sidebar.tsx': ['size={14'],
  'engine/Preview.tsx': ['size={14'],
  'engine/ControlsPanel.tsx': ['size={14'],
};

describe('gallery text size', () => {
  it.each(sourceFiles(SRC).map((path) => [relative(SRC, path), path]))('%s has no 14px text unless listed, and no old odd size', (name, path) => {
    const source = readFileSync(path, 'utf8');
    expect(source.match(/size(=\{|: )1[1345]\b/g) ?? []).toEqual(SMALL_TEXT_ALLOWED[name] ?? []);
  });
});
