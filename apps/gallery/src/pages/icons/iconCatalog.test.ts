import { describe, expect, it } from 'vitest';
import * as lib from '@bit-ds/react';
import { ICON_GROUPS, iconArrowBack, iconFavorite } from '@bit-ds/react';
import { PLAYGROUND_ICONS, copyText, exportNameFor, filterGroups, findIcon, iconHtml, normalizeQuery } from './iconCatalog';

describe('iconCatalog', () => {
  it('every icon in ICON_GROUPS is the library export exportNameFor names', () => {
    for (const icon of ICON_GROUPS.flatMap((g) => g.icons)) {
      expect((lib as Record<string, unknown>)[exportNameFor(icon.name)]).toBe(icon);
    }
  });

  it('findIcon returns the icon, and throws on a name the set does not have', () => {
    expect(findIcon('favorite')).toBe(iconFavorite);
    expect(() => findIcon('nope')).toThrow('bit gallery: no icon named "nope"');
  });

  it('React copy is the import line, a blank line and the element; HTML copy is the class form', () => {
    expect(copyText(iconFavorite, 'react')).toBe("import { Icon, iconFavorite } from '@bit-ds/react';\n\n<Icon icon={iconFavorite} />");
    expect(copyText(iconFavorite, 'react', true)).toBe("import { Icon, iconFavorite } from '@bit-ds/react';\n\n<Icon icon={iconFavorite} iconFilled />");
    expect(copyText(iconFavorite, 'html')).toBe('<span class="bit-icon bit-icon-favorite" aria-hidden="true"></span>');
    expect(copyText(iconFavorite, 'html', true)).toBe('<span class="bit-icon bit-icon-favorite bit-iconFilled" aria-hidden="true"></span>');
  });

  it('iconHtml adds colour and size classes, and a label as role img with an escaped aria-label', () => {
    expect(iconHtml(iconFavorite, { color: 'danger', size: 'lg' })).toBe('<span class="bit-icon bit-icon-favorite bit-danger bit-lg" aria-hidden="true"></span>');
    expect(iconHtml(iconFavorite, { color: 'danger', size: 'lg', filled: true })).toBe(
      '<span class="bit-icon bit-icon-favorite bit-iconFilled bit-danger bit-lg" aria-hidden="true"></span>',
    );
    expect(iconHtml(iconFavorite, { size: 'md', label: 'Say "hi" & go' })).toBe(
      '<span class="bit-icon bit-icon-favorite bit-md" role="img" aria-label="Say &quot;hi&quot; &amp; go"></span>',
    );
  });

  it.each([['Arrow Back'], ['arrow_back'], ['  arrow-back '], ['ARROW   BACK']])('"%s" finds arrow-back', (query) => {
    expect(normalizeQuery(query)).toBe('arrow-back');
    const names = filterGroups(ICON_GROUPS, query).flatMap((g) => g.icons.map((i) => i.name));
    expect(names).toContain(iconArrowBack.name);
  });

  it('search matches icon names only, drops empty groups, and an empty query keeps everything', () => {
    expect(filterGroups(ICON_GROUPS, '')).toEqual(ICON_GROUPS);
    expect(filterGroups(ICON_GROUPS, 'navigation')).toEqual([]); // a group label is not an icon name
    expect(filterGroups(ICON_GROUPS, 'mail').map((g) => g.label)).toEqual(['Communication & people']);
    expect(filterGroups(ICON_GROUPS, 'zzzz')).toEqual([]);
  });

  it('every playground icon exists', () => {
    expect(PLAYGROUND_ICONS).toHaveLength(12);
    for (const name of PLAYGROUND_ICONS) expect(findIcon(name).name).toBe(name);
  });
});
