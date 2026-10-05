import { TEXT_SIZES } from '@bit-ds/react';

/** The Text sizes the gallery shows: all of TEXT_SIZES but 11, which is deprecated (under the 13px floor). */
export const SUPPORTED_TEXT_SIZES = TEXT_SIZES.filter((size) => size !== 11);
