/**
 * The two stylesheet imports every app adds once, theme first: the theme's Google Fonts `@import` must stay
 * at the top when a bundler joins the CSS. The gallery's own entry (main.tsx), the component pages' full
 * file and Home's "Add the styles once" step all use exactly this text.
 */
export const STYLE_IMPORTS = "import '@bit-ds/react/themes/power-up.css';\nimport '@bit-ds/react/styles.css';";
