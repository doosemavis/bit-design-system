import type { Decorator, Preview } from '@storybook/react-vite';
import '@bit/core/styles.css';
import '@bit/core/themes/power-up.css';

/** Add a theme here after adding its CSS import above. */
export const THEMES = ['power-up'] as const;

const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme as string | undefined) ?? THEMES[0];
  document.documentElement.dataset.theme = theme;
  return Story();
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'bit theme',
      toolbar: { title: 'Theme', icon: 'paintbrush', items: [...THEMES], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: THEMES[0] },
  decorators: [withTheme],
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export default preview;
