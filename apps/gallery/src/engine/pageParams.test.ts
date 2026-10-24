import { describe, expect, it } from 'vitest';
import { DEFAULT_PASS, PAGE_PARAMS, parsePass, PASSES, withPageParams } from './pageParams';

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

  it('does not mutate its inputs', () => {
    const next = new URLSearchParams('variant=outline');
    const current = new URLSearchParams('pass=tokens');
    withPageParams(next, current);
    expect(next.toString()).toBe('variant=outline');
    expect(current.toString()).toBe('pass=tokens');
  });
});
