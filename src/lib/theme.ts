// Semantic design tokens. UI code consumes ONLY this module — never
// `./theme/palette`. Swapping the palette = changing the import below
// (or editing values in palette.ts). No UI files should need to
// change when colours move.
//
// Status tokens are intentionally generic (success/warning/info/
// neutral). Trip-domain mapping lives in `consensusColorByStatus` so
// the theme stays reusable for non-trip UI.

import { defaultPalette, type Palette } from "./theme/palette";

const p: Palette = defaultPalette;

export const colors = {
  brand: {
    primary:      p.accent500,
    primaryHover: p.accent600,
    onPrimary:    p.onAccent,
  },
  surface: {
    light: { bg: p.neutral50,  card: p.neutral0,   border: p.neutral200, divider: p.neutral100 },
    dark:  { bg: p.neutral950, card: p.neutral900, border: p.neutral800, divider: p.neutral800 },
  },
  text: {
    light: { primary: p.neutral950, secondary: p.neutral600, muted: p.neutral400 },
    dark:  { primary: p.neutral50,  secondary: p.neutral200, muted: p.neutral400 },
  },
  status: {
    success: { fg: p.green900, bg: p.green100 },
    warning: { fg: p.amber900, bg: p.amber100 },
    info:    { fg: p.blue900,  bg: p.blue100  },
    neutral: { fg: p.gray700,  bg: p.gray100  },
  },
  feedback: {
    success: p.success,
    warning: p.warning,
    danger:  p.danger,
    info:    p.info,
  },
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32, "3xl": 48,
} as const;

export const radii = {
  sm: 6, md: 10, lg: 16, xl: 22, full: 9999,
} as const;

export const typography = {
  display:  { size: 32, weight: "700" },
  headingL: { size: 24, weight: "700" },
  headingM: { size: 20, weight: "600" },
  headingS: { size: 16, weight: "600" },
  body:     { size: 14, weight: "400" },
  caption:  { size: 12, weight: "400" },
  overline: { size: 11, weight: "600", letterSpacing: 1 },
} as const;

// Domain mapping for consensus pills. Edit here to re-skin consensus
// without touching either palette.ts or any UI screen.
export const consensusColorByStatus = {
  top_pick:    colors.status.success,
  split_vote:  colors.status.warning,
  needs_votes: colors.status.info,
} as const;

export type { Palette } from "./theme/palette";
