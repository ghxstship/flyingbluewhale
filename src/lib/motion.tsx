/** Stub: motion — re-exports from framer-motion when available, otherwise no-ops */
'use client';

// Provide stub motion components that render plain HTML elements
// Replace with framer-motion re-exports when the dependency is added
function createMotionComponent(tag: string) {
  return function MotionComponent({ children, initial, animate, exit, transition, variants, whileHover, whileTap, layout, ...props }: any) {
    const Tag = tag as any;
    return <Tag {...props}>{children}</Tag>;
  };
}

export const motion = {
  div: createMotionComponent('div'),
  span: createMotionComponent('span'),
  p: createMotionComponent('p'),
  button: createMotionComponent('button'),
  a: createMotionComponent('a'),
  ul: createMotionComponent('ul'),
  li: createMotionComponent('li'),
  section: createMotionComponent('section'),
  article: createMotionComponent('article'),
  header: createMotionComponent('header'),
  footer: createMotionComponent('footer'),
  nav: createMotionComponent('nav'),
  main: createMotionComponent('main'),
  aside: createMotionComponent('aside'),
  form: createMotionComponent('form'),
  img: createMotionComponent('img'),
  h1: createMotionComponent('h1'),
  h2: createMotionComponent('h2'),
  h3: createMotionComponent('h3'),
};

export function AnimatePresence({ children }: any) { return <>{children}</>; }
export function useAnimation() { return { start: () => {}, set: () => {} }; }
export function useMotionValue(initial: any) { return { get: () => initial, set: () => {} }; }
export function useTransform(...args: any[]) { return args[0]; }

/** Shared framer-motion transition preset */
export const fmTransition = { type: 'spring' as const, stiffness: 300, damping: 30 };

export default motion;
