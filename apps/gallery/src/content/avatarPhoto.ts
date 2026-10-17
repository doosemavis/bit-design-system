/**
 * The Avatar page's sample photo: a 16×16 pixel portrait, drawn here so the gallery loads no image from
 * another host (its CSP allows `'self' data:` images only). One rect per run of pixels, crisp at any size.
 */
const PIXELS: readonly (readonly [x: number, y: number, w: number, h: number, fill: string])[] = [
  [0, 0, 16, 16, '#B9A8F5'], // lilac backdrop
  [4, 2, 8, 2, '#3A2416'], // hair
  [3, 4, 2, 4, '#3A2416'],
  [11, 4, 2, 4, '#3A2416'],
  [5, 4, 6, 6, '#E8B48A'], // face
  [6, 6, 1, 1, '#1F1F2E'], // eyes
  [9, 6, 1, 1, '#1F1F2E'],
  [7, 8, 2, 1, '#B5533C'], // smile
  [7, 10, 2, 1, '#E8B48A'], // neck
  [3, 11, 10, 5, '#6D3FE0'], // violet sweater
  [7, 11, 2, 2, '#F4F1EA'], // collar
];

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">${PIXELS.map(
  ([x, y, w, h, fill]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`,
).join('')}</svg>`;

/** The portrait, as a data: URI. */
export const AVATAR_PHOTO = `data:image/svg+xml,${encodeURIComponent(SVG)}`;

/** An image that can't be decoded: it fails at once, with no network request, so the page shows the fallback. */
export const BROKEN_PHOTO = 'data:image/png;base64,AAAA';

/** What the page's code shows for each, in place of the long data: URIs: an ordinary app's paths. */
export const PRINTED_PHOTO = '/photos/ada.png';
export const PRINTED_BROKEN = '/photos/missing.png';
