/** The text a dark rule's selectors carry, inside :where() or :is(). */
export declare const DARK: string;
/** What the system copy carries instead. */
export declare const SYSTEM: string;
/** The query the system copy sits behind. */
export declare const DARK_OS: string;
/** The theme with a dark-OS copy of each dark rule for data-mode="system". Throws when there is none to copy. */
export declare function withSystemMode(css: string): string;
