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
 * Reading text in the gallery is 15px or larger: 13px is too small for many readers. Nothing is ever under 13px.
 * The only 13px text left is listed here, each with its reason.
 */
const SMALL_TEXT_ALLOWED: Readonly<Record<string, readonly string[]>> = {
  // The type scale's 13px row has to show 13px: its props, and the code sample that documents them.
  'pages/TypographyPage.tsx': ['size: 13', 'size={13'],
  // Pixel-face labels (eyebrows, sidebar groups, the preview title): uppercase display type, not reading text,
  // at the 13px floor.
  'ui/PageHeader.tsx': ['size={13'],
  'shell/Sidebar.tsx': ['size={13'],
  'engine/Preview.tsx': ['size={13'],
};

describe('gallery text size', () => {
  it.each(sourceFiles(SRC).map((path) => [relative(SRC, path), path]))('%s has no 13px or 11px text unless listed', (name, path) => {
    const source = readFileSync(path, 'utf8');
    expect(source.match(/size(=\{|: )1[13]\b/g) ?? []).toEqual(SMALL_TEXT_ALLOWED[name] ?? []);
  });
});
