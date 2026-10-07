// jsdom has no AnimationEvent. React then listens for `webkitAnimationEnd` instead of `animationend`
// (it decides once, at load, from `'AnimationEvent' in window`), so tests could not drive onAnimationEnd.
// This file runs before vitest.setup.ts, which imports Testing Library and so React DOM.
if (typeof window !== 'undefined' && typeof window.AnimationEvent === 'undefined') {
  class AnimationEventStandIn extends Event {
    animationName: string;
    constructor(type: string, init: EventInit & { animationName?: string } = {}) {
      super(type, init);
      this.animationName = init.animationName ?? '';
    }
  }
  Object.defineProperty(window, 'AnimationEvent', { value: AnimationEventStandIn, configurable: true, writable: true });
}
