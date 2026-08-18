import type { Page } from './sdk';

export type TransitionPhase = {
  keyframes: Keyframe[] | PropertyIndexedKeyframes;
  easing?: string;
  duration?: number;
  delay?: number;
};

export type DocTransition = {
  duration: number;
  easing?: string;
  enter?: TransitionPhase;
  exit?: TransitionPhase;
  morph?: boolean | MorphTransition;
};

export type MorphTransition = {
  duration?: number;
  easing?: string;
  delay?: number;
};

export function resolveTransition(
  pages: Page[],
  index: number,
  moduleDefault?: DocTransition,
): DocTransition | undefined {
  return pages[index]?.transition ?? moduleDefault;
}
