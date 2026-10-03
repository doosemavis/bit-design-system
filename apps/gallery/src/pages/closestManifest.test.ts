import { describe, it, expect } from 'vitest';
import { closestManifest, editDistance } from './closestManifest';

describe('editDistance', () => {
  it.each([
    ['button', 'button', 0],
    ['buton', 'button', 1],
    ['butto', 'button', 1],
    ['bootn', 'button', 3],
    ['', 'box', 3],
    ['nope', 'code', 2],
    ['co', 'box', 2],
  ])('%s → %s is %i', (a, b, distance) => {
    expect(editDistance(a, b)).toBe(distance);
  });
});

describe('closestManifest', () => {
  it('suggests the nearest slug, ignoring case', () => {
    expect(closestManifest('buton')?.name).toBe('Button');
    expect(closestManifest('Button')?.name).toBe('Button');
    expect(closestManifest('segmentedcontrl')?.name).toBe('SegmentedControl');
  });

  it('suggests the logo for /components/logo, which lives under Brand', () => {
    expect(closestManifest('logo')?.name).toBe('BitLogo');
  });

  it('suggests nothing past three edits', () => {
    expect(closestManifest('accordion')).toBeUndefined();
    expect(closestManifest('zzzzzzzz')).toBeUndefined();
  });

  it('breaks a tie by sidebar order: "co" is 2 from both box and code, and Box comes first', () => {
    expect(closestManifest('co')?.name).toBe('Box');
  });
});
