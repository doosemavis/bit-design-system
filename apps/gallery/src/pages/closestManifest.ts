import { MANIFESTS } from '../manifests';
import type { Manifest } from '../manifests';

/** Suggest a page only when the typo is this close: at most three letters added, dropped or changed. */
const MAX_SUGGESTION_DISTANCE = 3;

/** Levenshtein distance: the fewest single-letter inserts, deletes or swaps that turn a into b. */
export function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const swap = previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1);
      current.push(Math.min(previous[j]! + 1, current[j - 1]! + 1, swap));
    }
    previous = current;
  }
  return previous[b.length]!;
}

/**
 * The manifest whose slug is nearest the slug someone typed, ignoring case, if it is within
 * MAX_SUGGESTION_DISTANCE. Ties go to the earlier manifest, which is sidebar order.
 */
export function closestManifest(slug: string, manifests: readonly Manifest[] = MANIFESTS): Manifest | undefined {
  const typed = slug.toLowerCase();
  let best: { manifest: Manifest; distance: number } | undefined;
  for (const manifest of manifests) {
    const distance = editDistance(typed, manifest.slug);
    if (distance <= MAX_SUGGESTION_DISTANCE && (best === undefined || distance < best.distance)) {
      best = { manifest, distance };
    }
  }
  return best?.manifest;
}
