import { describe, it, expect } from 'vitest';
import { listCss, readCss, styleRules, themeModes } from './css';

type Row = readonly [file: string, selector: string, property: string, light: string, dark: string];

/** Every `var(--bit-…)` in a value, replaced by what it resolves to, until none is left. */
function expand(map: ReadonlyMap<string, string>, value: string, depth = 0): string {
  if (depth > 10) throw new Error(`Circular var() chain in ${value}`);
  const next = value.replace(/var\((--bit-[a-zA-Z0-9_-]+)\)/g, (_, name: string) => {
    const found = map.get(name);
    if (found === undefined) throw new Error(`Token ${name} is not declared`);
    return found;
  });
  return next === value ? value : expand(map, next, depth + 1);
}

const { light, dark: darkOverrides } = themeModes(readCss('themes/power-up.css'));
const dark = new Map([...light, ...darkOverrides]);

/** Each component and system declaration that reads a corner or shadow token, resolved in light and dark. */
function current(): Row[] {
  const rows: Row[] = [];
  for (const dir of ['components', 'system']) {
    for (const file of listCss(dir)) {
      for (const rule of styleRules(readCss(`${dir}/${file}`))) {
        const selector = rule.media === null ? rule.selector : `@media ${rule.media} { ${rule.selector} }`;
        for (const declaration of rule.body.split(';')) {
          const colon = declaration.indexOf(':');
          if (colon === -1) continue;
          const property = declaration.slice(0, colon).trim();
          const value = declaration.slice(colon + 1).trim();
          if (!/var\(--bit-(radius|shadow)-/.test(value)) continue;
          rows.push([`${dir}/${file}`, selector, property, expand(light, value), expand(dark, value)]);
        }
      }
    }
  }
  return rows;
}

/**
 * Role-token contract (PR C): moving component CSS onto role tokens changes names, never a rendered corner or
 * shadow. Frozen 2026-10-26 from power-up before the switch. Never edit a row to make a test pass; a failing row
 * means a corner or shadow really changed.
 */
const FROZEN_SHAPES: readonly Row[] = [
  ['components/alert.css', '.bit-alert', 'border-radius', '10px', '10px'],
  ['components/alert.css', '.bit-alert.bit-solid', 'box-shadow', '4px 4px 0 #151515', '4px 4px 0 #464658'],
  ['components/avatar.css', '.bit-avatar', 'border-radius', '999px', '999px'],
  ['components/avatar.css', '.bit-avatar', 'box-shadow', '2px 2px 0 #151515', '2px 2px 0 #464658'],
  ['components/avatar.css', '.bit-avatar[data-shape="square"]', 'border-radius', '6px', '6px'],
  ['components/badge.css', '.bit-badge', 'border-radius', '999px', '999px'],
  ['components/badge.css', '.bit-badge', 'box-shadow', '2px 2px 0 #151515', '2px 2px 0 #464658'],
  ['components/badge.css', '.bit-badge[data-shape="square"]', 'border-radius', '6px', '6px'],
  ['components/button.css', '.bit-button', 'border-radius', '10px', '10px'],
  ['components/button.css', '.bit-button', 'box-shadow', '4px 4px 0 #151515', '4px 4px 0 #464658'],
  ['components/button.css', '.bit-button.bit-solid', 'box-shadow', '4px 4px 0 #151515', '4px 4px 0 #464658'],
  ['components/button.css', '.bit-button.bit-solid:hover:not(:disabled):not([aria-disabled="true"])', 'box-shadow', '2px 2px 0 #151515', '2px 2px 0 #464658'],
  ['components/button.css', '.bit-button', '--_bit-lift', '4px 4px 0 #151515', '4px 4px 0 #464658'],
  ['components/button.css', '.bit-button', '--_bit-lift-radius', '10px', '10px'],
  ['components/button.css', '.bit-button.bit-solid:hover:not(:disabled):not([aria-disabled="true"])', '--_bit-lift', '2px 2px 0 #151515', '2px 2px 0 #464658'],
  ['components/button.css', '.bit-button[data-loading]::before', 'border-radius', '999px', '999px'],
  ['components/card.css', '.bit-card', 'border-radius', '14px', '14px'],
  ['components/card.css', '.bit-card.bit-solid', 'box-shadow', '6px 6px 0 #151515', '6px 6px 0 #464658'],
  ['components/checkbox.css', '.bit-checkbox__box', 'border-radius', '6px', '6px'],
  ['components/checkbox.css', '.bit-checkbox__box', 'box-shadow', '2px 2px 0 #151515', '2px 2px 0 #464658'],
  ['components/checkbox.css', '.bit-checkbox__box', '--_bit-lift', '2px 2px 0 #151515', '2px 2px 0 #464658'],
  ['components/checkbox.css', '.bit-checkbox__box', '--_bit-lift-radius', '6px', '6px'],
  ['components/code-block.css', '.bit-code__block', 'border-radius', '10px', '10px'],
  ['components/code-block.css', '.bit-code__block', 'box-shadow', '4px 4px 0 #151515', '4px 4px 0 #464658'],
  ['components/code-block.css', '.bit-code__copy', 'border-radius', '6px', '6px'],
  ['components/code.css', '.bit-code', 'border-radius', '6px', '6px'],
  ['components/dialog.css', '.bit-dialog', 'border-radius', '10px', '10px'],
  ['components/dialog.css', '.bit-dialog', 'box-shadow', '6px 6px 0 #151515', '6px 6px 0 #464658'],
  ['components/input.css', '.bit-input', 'border-radius', '10px', '10px'],
  ['components/input.css', '.bit-input', 'box-shadow', 'inset 3px 3px 0 rgba(21, 21, 21, 0.12)', 'inset 3px 3px 0 rgba(0, 0, 0, 0.4)'],
  ['components/menu.css', '.bit-menu', 'border-radius', '10px', '10px'],
  ['components/menu.css', '.bit-menu', 'box-shadow', '4px 4px 0 #151515', '4px 4px 0 #464658'],
  ['components/menu.css', '.bit-menu__item', 'border-radius', '6px', '6px'],
  ['components/mode-toggle.css', '.bit-mode-toggle', 'border-radius', '999px', '999px'],
  ['components/mode-toggle.css', '.bit-mode-toggle', 'box-shadow', '2px 2px 0 #151515', '2px 2px 0 #464658'],
  ['components/mode-toggle.css', '.bit-mode-toggle__option', 'border-radius', '999px', '999px'],
  ['components/navbar.css', '.bit-navbar', 'border-radius', '10px', '10px'],
  ['components/navbar.css', '.bit-navbar', 'box-shadow', '4px 4px 0 #151515', '4px 4px 0 #464658'],
  ['components/navbar.css', '.bit-navbar__link', 'border-radius', '999px', '999px'],
  ['components/navbar.css', '.bit-navbar.bit-pill .bit-navbar__links', 'border-radius', '999px', '999px'],
  ['components/navbar.css', '.bit-navbar.bit-bar .bit-navbar__link', 'border-radius', '6px', '6px'],
  ['components/navbar.css', '.bit-navbar.bit-bar .bit-navbar__link[aria-current="page"]', 'box-shadow', '2px 2px 0 #151515', '2px 2px 0 #464658'],
  ['components/radio.css', '.bit-radio__dot', 'border-radius', '999px', '999px'],
  ['components/radio.css', '.bit-radio__dot', 'box-shadow', '2px 2px 0 #151515', '2px 2px 0 #464658'],
  ['components/radio.css', '.bit-radio__dot', '--_bit-lift', '2px 2px 0 #151515', '2px 2px 0 #464658'],
  ['components/radio.css', '.bit-radio__dot', '--_bit-lift-radius', '999px', '999px'],
  ['components/radio.css', '.bit-radio__input:checked + .bit-radio__dot::before', 'border-radius', '999px', '999px'],
  ['components/segmented-control.css', '.bit-segmented-control__options', 'border-radius', '10px', '10px'],
  ['components/segmented-control.css', '.bit-segmented-control__options', 'box-shadow', '4px 4px 0 #151515', '4px 4px 0 #464658'],
  ['components/select.css', '.bit-select__control', 'border-radius', '10px', '10px'],
  ['components/select.css', '.bit-select__control', 'box-shadow', 'inset 3px 3px 0 rgba(21, 21, 21, 0.12)', 'inset 3px 3px 0 rgba(0, 0, 0, 0.4)'],
  ['components/select.css', '.bit-select__list', 'border-radius', '10px', '10px'],
  ['components/select.css', '.bit-select__list', 'box-shadow', '4px 4px 0 #151515', '4px 4px 0 #464658'],
  ['components/select.css', '.bit-select__option', 'border-radius', '6px', '6px'],
  ['components/select.css', '.bit-select__count', 'border-radius', '999px', '999px'],
  ['components/select.css', '.bit-select__list[aria-multiselectable="true"] .bit-select__option::before', 'border-radius', '6px', '6px'],
  ['components/slider.css', '.bit-slider__track, .bit-slider__fill', 'border-radius', '999px', '999px'],
  ['components/slider.css', '.bit-slider__thumb', 'border-radius', '6px', '6px'],
  ['components/slider.css', '.bit-slider__thumb', 'box-shadow', '2px 2px 0 #151515', '2px 2px 0 #464658'],
  ['components/slider.css', '.bit-slider__thumb', '--_bit-lift', '2px 2px 0 #151515', '2px 2px 0 #464658'],
  ['components/slider.css', '.bit-slider__thumb', '--_bit-lift-radius', '6px', '6px'],
  ['components/slider.css', '.bit-slider.bit-round .bit-slider__thumb', 'border-radius', '999px', '999px'],
  ['components/slider.css', '.bit-slider.bit-round .bit-slider__thumb', '--_bit-lift-radius', '999px', '999px'],
  ['components/slider.css', '.bit-slider__bubble', 'border-radius', '6px', '6px'],
  ['components/slider.css', '.bit-slider__steps', 'border-start-end-radius', 'calc(10px - 3px)', 'calc(10px - 3px)'],
  ['components/slider.css', '.bit-slider__steps', 'border-end-end-radius', 'calc(10px - 3px)', 'calc(10px - 3px)'],
  ['components/slider.css', '.bit-slider__unit', 'border-radius', '10px', '10px'],
  ['components/slider.css', '.bit-slider__blocks', 'border-radius', '6px', '6px'],
  ['components/slider.css', '.bit-slider__blocks', 'box-shadow', '2px 2px 0 #151515', '2px 2px 0 #464658'],
  ['components/slider.css', '.bit-slider__blocks', '--_bit-lift', '2px 2px 0 #151515', '2px 2px 0 #464658'],
  ['components/slider.css', '.bit-slider__blocks', '--_bit-lift-radius', '6px', '6px'],
  ['components/spinner.css', '.bit-spinner', 'border-radius', '999px', '999px'],
  ['components/switch.css', '.bit-switch__track', 'border-radius', '999px', '999px'],
  ['components/switch.css', '.bit-switch__track', 'box-shadow', '2px 2px 0 #151515', '2px 2px 0 #464658'],
  ['components/switch.css', '.bit-switch__track', '--_bit-lift', '2px 2px 0 #151515', '2px 2px 0 #464658'],
  ['components/switch.css', '.bit-switch__track', '--_bit-lift-radius', '999px', '999px'],
  ['components/switch.css', '.bit-switch__thumb', 'border-radius', '999px', '999px'],
  ['components/table.css', '.bit-table', 'border-radius', '10px', '10px'],
  ['components/table.css', '.bit-table', 'box-shadow', '4px 4px 0 #151515', '4px 4px 0 #464658'],
  ['components/tabs.css', '.bit-tabs__tab', 'border-radius', '6px 6px 0 0', '6px 6px 0 0'],
  ['components/tabs.css', '.bit-tabs__label', 'border-radius', '6px', '6px'],
  ['components/tabs.css', '.bit-tabs__slot', 'border-radius', '10px 10px 0 0', '10px 10px 0 0'],
  ['components/tabs.css', '.bit-tabs__slot', 'box-shadow', '4px 4px 0 #151515', '4px 4px 0 #464658'],
  ['components/tabs.css', '.bit-tabs__panel', 'border-radius', '0 0 10px 10px', '0 0 10px 10px'],
  ['components/tabs.css', '.bit-tabs__panel', 'box-shadow', '4px 4px 0 #151515', '4px 4px 0 #464658'],
  ['components/textarea.css', '.bit-textarea', 'border-radius', '10px', '10px'],
  ['components/textarea.css', '.bit-textarea', 'box-shadow', 'inset 3px 3px 0 rgba(21, 21, 21, 0.12)', 'inset 3px 3px 0 rgba(0, 0, 0, 0.4)'],
  ['components/tooltip.css', '.bit-tooltip', 'border-radius', '6px', '6px'],
  ['system/scrollbar.css', '@media not (forced-colors: active) { .bit-textarea::-webkit-scrollbar-track }', 'border-radius', 'calc(10px - 3px)', 'calc(10px - 3px)'],
  ['system/scrollbar.css', '@media not (forced-colors: active) { .bit-code__pre::-webkit-scrollbar-thumb, .bit-table::-webkit-scrollbar-thumb, .bit-select__list::-webkit-scrollbar-thumb, .bit-tabs__list::-webkit-scrollbar-thumb, .bit-textarea::-webkit-scrollbar-thumb }', 'border-radius', '10px', '10px'],
];

describe('corner and shadow values (frozen before the role-token switch)', () => {
  it('every declaration that reads a corner or shadow token resolves as it did before', () => {
    expect(current()).toEqual(FROZEN_SHAPES);
    expect(FROZEN_SHAPES).toHaveLength(90);
  });
});
