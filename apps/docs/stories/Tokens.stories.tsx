import type { Meta, StoryObj } from '@storybook/react-vite';
import { SEMANTIC_TOKENS, TONES } from '@bit/core/tokens';

function Swatches() {
  const style = getComputedStyle(document.documentElement);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
      {TONES.map((tone) => (
        <div
          key={tone}
          style={{
            border: 'var(--bit-border-width) solid var(--bit-color-ink)',
            borderRadius: 'var(--bit-radius-md)',
            boxShadow: 'var(--bit-shadow-md)',
            overflow: 'hidden',
            background: 'var(--bit-color-surface)',
          }}
        >
          <div style={{ background: `var(--bit-color-${tone})`, color: `var(--bit-color-${tone}-contrast)`, padding: 16, fontWeight: 800 }}>
            {tone}
            <div style={{ fontSize: 12, fontWeight: 600 }}>{style.getPropertyValue(`--bit-color-${tone}`).trim()}</div>
          </div>
          <div style={{ background: `var(--bit-color-${tone}-hover)`, color: `var(--bit-color-${tone}-contrast)`, padding: '6px 16px', fontSize: 12 }}>hover</div>
          <div style={{ background: `var(--bit-color-${tone}-soft)`, padding: '6px 16px', fontSize: 12 }}>soft</div>
        </div>
      ))}
    </div>
  );
}

function TokenTable() {
  const style = getComputedStyle(document.documentElement);
  return (
    <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '4px 12px 4px 0' }}>Token</th>
          <th style={{ textAlign: 'left', padding: '4px 0' }}>Value in current theme</th>
        </tr>
      </thead>
      <tbody>
        {SEMANTIC_TOKENS.map((name) => (
          <tr key={name} style={{ borderTop: '1px solid var(--bit-color-neutral-soft)' }}>
            <td style={{ padding: '4px 12px 4px 0' }}><code>{name}</code></td>
            <td style={{ padding: '4px 0', color: 'var(--bit-color-text-muted)' }}>{style.getPropertyValue(name).trim()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const meta: Meta = { title: 'Foundations/Tokens' };
export default meta;

export const Colors: StoryObj = { render: () => <Swatches /> };
export const AllTokens: StoryObj = { render: () => <TokenTable /> };
