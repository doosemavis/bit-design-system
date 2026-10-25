import { describe, expect, it } from 'vitest';
import { alert } from '../manifests/alert';
import { button } from '../manifests/button';
import { withoutAnatomy } from '../test/fixtures';
import { DEFAULT_PASS, PAGE_PARAMS, parsePass, PASSES, setPageParam, withPageParams } from './pageParams';

describe('parsePass', () => {
  it.each(PASSES)('keeps %s', (pass) => expect(parsePass(pass)).toBe(pass));
  it.each([null, '', 'xray', 'TOKENS'])('reads %j as the default', (raw) => expect(parsePass(raw)).toBe(DEFAULT_PASS));
});

describe('PAGE_PARAMS.pass', () => {
  it('drops the default and unknown values, keeps the rest', () => {
    expect(PAGE_PARAMS.pass!.parse('wireframe')).toBeUndefined();
    expect(PAGE_PARAMS.pass!.parse('xray')).toBeUndefined();
    expect(PAGE_PARAMS.pass!.parse('final')).toBe('final');
  });
});

describe('withPageParams', () => {
  it('puts control keys first, then page keys that parse', () => {
    const next = new URLSearchParams('variant=outline');
    const current = new URLSearchParams('pass=tokens&color=danger');
    expect(withPageParams(next, current).toString()).toBe('variant=outline&pass=tokens');
  });

  it('drops a page key that does not parse', () => {
    expect(withPageParams(new URLSearchParams(), new URLSearchParams('pass=wireframe')).toString()).toBe('');
    expect(withPageParams(new URLSearchParams(), new URLSearchParams('pass=xray')).toString()).toBe('');
  });

  it('ignores a page key in next (current is the source of truth for page keys)', () => {
    expect(withPageParams(new URLSearchParams('pass=final'), new URLSearchParams()).toString()).toBe('');
  });

  it('drops pass on a manifest without anatomy, keeps it on Button', () => {
    const current = new URLSearchParams('pass=tokens');
    expect(withPageParams(new URLSearchParams(), current, withoutAnatomy(alert)).toString()).toBe('');
    expect(withPageParams(new URLSearchParams(), current, button).toString()).toBe('pass=tokens');
  });

  it('does not mutate its inputs', () => {
    const next = new URLSearchParams('variant=outline');
    const current = new URLSearchParams('pass=tokens');
    withPageParams(next, current);
    expect(next.toString()).toBe('variant=outline');
    expect(current.toString()).toBe('pass=tokens');
  });
});

describe('setPageParam', () => {
  it('sets a page key after the control keys', () => {
    expect(setPageParam(new URLSearchParams('variant=outline&size=lg'), 'pass', 'tokens').toString()).toBe(
      'variant=outline&size=lg&pass=tokens',
    );
  });

  it('replaces the key, and moves it after control keys that follow it', () => {
    expect(setPageParam(new URLSearchParams('pass=tokens&variant=outline'), 'pass', 'final').toString()).toBe(
      'variant=outline&pass=final',
    );
  });

  it.each([undefined, DEFAULT_PASS, 'xray'])('removes the key for %j (undefined, the default, or a value it does not know)', (value) => {
    expect(setPageParam(new URLSearchParams('variant=outline&pass=tokens'), 'pass', value).toString()).toBe('variant=outline');
  });

  it('refuses a key that is not a page key', () => {
    expect(() => setPageParam(new URLSearchParams(), 'variant', 'outline')).toThrow('variant is not a page key');
  });

  it.each(['constructor', 'toString', '__proto__'])('refuses the prototype name %s', (key) => {
    expect(() => setPageParam(new URLSearchParams(), key, 'x')).toThrow(`${key} is not a page key`);
  });

  it('does not mutate its input', () => {
    const current = new URLSearchParams('pass=tokens&variant=outline');
    setPageParam(current, 'pass', 'final');
    expect(current.toString()).toBe('pass=tokens&variant=outline');
  });
});
