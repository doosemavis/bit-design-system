// How a Material Symbols file name becomes bit's icon name, React export and class. One place, used by the
// generator and by the package's export checks, so they cannot disagree.

/** `keyboard_arrow_down` → `keyboard-arrow-down`; a `-fill` suffix is kept. */
export const iconName = (material) => material.replace(/_/g, '-');

/** `keyboard_arrow_down` → `iconKeyboardArrowDown`; `favorite-fill` → `iconFavoriteFill`. */
export const iconExportName = (material) =>
  `icon${iconName(material)
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')}`;

/** `arrow_back` → `bit-icon-arrow-back`. */
export const iconClassName = (material) => `bit-icon-${iconName(material)}`;
