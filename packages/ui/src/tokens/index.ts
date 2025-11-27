/**
 * MADFAM Design Tokens
 *
 * Golden ratio-based design tokens for consistent, harmonious UI.
 */

// Golden ratio primitives and calculations
export {
  PHI,
  PHI_INVERSE,
  goldenSpacing,
  goldenTypography,
  goldenBorderRadius,
  goldenSizing,
  goldenShadows,
  goldenDurations,
  goldenGrid,
  goldenRatioTailwindExtend,
  goldenCSSVariables,
  default as goldenRatio,
} from './golden-ratio';

// Tailwind preset
export { madfamPreset, default as tailwindPreset } from './tailwind-preset';
