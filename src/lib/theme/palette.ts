// Raw colour palette — the swappable layer.
//
// UI code MUST NOT import from this file directly. Consume semantic
// tokens from ../theme.ts. Token names here are intentionally
// semantic-free so a palette rethink doesn't require renaming
// anything in theme.ts.
//
// To try a different look:
//   1) Tweak in place: edit the values in `defaultPalette`.
//   2) A/B alternate: add `export const altPalette: Palette = { ... }`
//      below, then change the one import line in ../theme.ts.
//
// Current values approximate the post-search-booking mockup; not
// pixel-extracted. Refine after a designer pass.

export interface Palette {
  // Brand accent (CTA buttons, highlights)
  accent500: string;
  accent600: string; // hover / pressed
  onAccent: string;  // text/icon on accent fills

  // Neutrals — surfaces, borders, text (both themes)
  neutral0: string;   // pure white
  neutral50: string;  // light bg
  neutral100: string; // light divider
  neutral200: string; // light border
  neutral400: string; // muted text
  neutral600: string; // secondary text on light
  neutral800: string; // dark border / divider
  neutral900: string; // dark card
  neutral950: string; // dark bg / primary text on light

  // Hue scales for status pills (raw, not domain-mapped)
  green100: string; green900: string;
  amber100: string; amber900: string;
  blue100: string;  blue900: string;
  gray100: string;  gray700: string;

  // Feedback (form errors, toasts)
  success: string;
  warning: string;
  danger: string;
  info: string;
}

export const defaultPalette: Palette = {
  accent500: "#F5C518",
  accent600: "#E0B414",
  onAccent: "#0B0B0B",

  neutral0:   "#FFFFFF",
  neutral50:  "#FAFAF7",
  neutral100: "#EEEEE9",
  neutral200: "#E5E5E0",
  neutral400: "#8A8A85",
  neutral600: "#4B4B4B",
  neutral800: "#1F1F1F",
  neutral900: "#161616",
  neutral950: "#0B0B0B",

  green100: "#D7F0C8", green900: "#0E5E2F",
  amber100: "#F1E2B6", amber900: "#7A5A1A",
  blue100:  "#CCE0F0", blue900:  "#1F4E7A",
  gray100:  "#EDEDED", gray700:  "#4D4D4D",

  success: "#2E7D32",
  warning: "#E0A800",
  danger:  "#C0392B",
  info:    "#1F4E7A",
};
