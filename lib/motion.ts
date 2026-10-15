// One motion language for the whole site, carried over from the vanilla build.
export const SPRING = { type: 'spring', stiffness: 90, damping: 18, mass: 0.8 } as const
export const SNAP = { type: 'spring', stiffness: 520, damping: 26, mass: 0.6 } as const
export const EASE = [0.16, 1, 0.3, 1] as const
export const STAGGER = 0.08
export const LEAD_IN = 0.15
