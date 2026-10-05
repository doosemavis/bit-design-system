/** Keys already warned about this page session, so a deprecated value used many times warns once. */
const warned = new Set<string>();

/** A development-only console warning, once per key. Silent in production. */
export function warnDeprecated(key: string, message: string): void {
  if (process.env.NODE_ENV === 'production' || warned.has(key)) return;
  warned.add(key);
  console.warn(`[bit] ${message}`);
}

/** Tests only: forget which keys have warned. */
export function resetDeprecationWarnings(): void {
  warned.clear();
}
