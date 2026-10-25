import { describe, expect, it } from 'vitest';
import { button } from '../../../manifests/button';
import type { AnatomyPart } from '../../../manifests/types';
import { applyOverrides } from './overrides';

const parts = button.anatomy!.parts;

function makeWrapper(): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = '<span class="inner"></span>';
  return wrapper;
}

describe('applyOverrides', () => {
  it('sets the off tokens of parts not yet landed, and undo restores a clean style', () => {
    const wrapper = makeWrapper();
    const undo = applyOverrides(wrapper, parts, ['Edge']);
    expect(wrapper.style.getPropertyValue('--bit-color-primary')).toBe('transparent');
    expect(wrapper.style.getPropertyValue('--bit-shadow-md')).toBe('none');
    expect(wrapper.style.getPropertyValue('--bit-border-width')).toBe('');
    undo();
    expect(wrapper.style.cssText).toBe('');
  });

  it('sets nothing for a measure step with no off', () => {
    const wrapper = makeWrapper();
    const size = parts.filter((p) => p.label === 'Size');
    applyOverrides(wrapper, size, []);
    expect(wrapper.style.cssText).toBe('');
  });

  it('honors a part step shared by several parts', () => {
    const wrapper = makeWrapper();
    const shared: AnatomyPart[] = parts.map((p) => ({ ...p, step: 'One' }));
    applyOverrides(wrapper, shared, ['One']);
    expect(wrapper.style.cssText).toBe('');
  });

  it('sets a part-scoped override on the matched element, not the wrapper', () => {
    const wrapper = makeWrapper();
    const part: AnatomyPart = { ...parts[0]!, selector: '.inner', offOn: 'part', off: { '--bit-border-width': '0px' } };
    const undo = applyOverrides(wrapper, [part], []);
    const inner = wrapper.querySelector<HTMLElement>('.inner')!;
    expect(inner.style.getPropertyValue('--bit-border-width')).toBe('0px');
    expect(wrapper.style.cssText).toBe('');
    undo();
    expect(inner.style.cssText).toBe('');
  });

  it('leaves no property behind when two parts override the same token and undo runs at once', () => {
    const wrapper = makeWrapper();
    const twice: AnatomyPart[] = [
      { ...parts[0]!, step: 'A', off: { '--bit-border-width': '0px' } },
      { ...parts[0]!, step: 'B', off: { '--bit-border-width': '0px' } },
    ];
    applyOverrides(wrapper, twice, [])();
    expect(wrapper.style.cssText).toBe('');
  });
});
