import { describe, expect, it } from 'vitest';
import * as lib from '@bit-ds/react';
import { ICON_GROUPS, iconArrowBack, iconFavorite, iconFavoriteFill } from '@bit-ds/react';
import { copyText, exportNameFor, filterGroups, findIcon, iconHtml, normalizeQuery } from './iconCatalog';

describe('iconCatalog', () => {
  it('every icon in ICON_GROUPS is the library export exportNameFor names', () => {
    for (const { regular, fill } of ICON_GROUPS.flatMap((g) => g.icons)) {
      expect((lib as Record<string, unknown>)[exportNameFor(regular.name)]).toBe(regular);
      expect((lib as Record<string, unknown>)[exportNameFor(fill.name)]).toBe(fill);
    }
  });

  it('findIcon returns the pair, and throws on a name the set does not have', () => {
    expect(findIcon('favorite')).toEqual({ regular: iconFavorite, fill: iconFavoriteFill });
    expect(() => findIcon('nope')).toThrow('bit gallery: no icon named "nope"');
  });

  it('React copy is the import line, a blank line and the element; HTML copy is the class form', () => {
    expect(copyText(iconFavorite, 'react')).toBe("import { Icon, iconFavorite } from '@bit-ds/react';\n\n<Icon icon={iconFavorite} />");
    expect(copyText(iconFavoriteFill, 'html')).toBe('<span class="bit-icon bit-icon-favorite-fill" aria-hidden="true"></span>');
  });

  it('iconHtml adds colour and size classes, and a label as role img with an escaped aria-label', () => {
    expect(iconHtml(iconFavorite, { color: 'danger', size: 'lg' })).toBe('<span class="bit-icon bit-icon-favorite bit-danger bit-lg" aria-hidden="true"></span>');
    expect(iconHtml(iconFavorite, { size: 'md', label: 'Say "hi" & go' })).toBe(
      '<span class="bit-icon bit-icon-favorite bit-md" role="img" aria-label="Say &quot;hi&quot; &amp; go"></span>',
    );
  });

  it.each([['Arrow Back'], ['arrow_back'], ['  arrow-back '], ['ARROW   BACK']])('"%s" finds arrow-back', (query) => {
    expect(normalizeQuery(query)).toBe('arrow-back');
    const names = filterGroups(ICON_GROUPS, query).flatMap((g) => g.icons.map((p) => p.regular.name));
    expect(names).toContain(iconArrowBack.name);
  });

  it('search matches icon names only, drops empty groups, and an empty query keeps everything', () => {
    expect(filterGroups(ICON_GROUPS, '')).toEqual(ICON_GROUPS);
    expect(filterGroups(ICON_GROUPS, 'navigation')).toEqual([]); // a group label is not an icon name
    expect(filterGroups(ICON_GROUPS, 'mail').map((g) => g.label)).toEqual(['Communication & people']);
    expect(filterGroups(ICON_GROUPS, 'zzzz')).toEqual([]);
  });
});
