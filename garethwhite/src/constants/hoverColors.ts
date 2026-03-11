/**
 * Shared palette for hover shapes and similar UI – vibrant OKLCH.
 * Use from CMS (e.g. Feature hoverColor) or import this for defaults.
 */
export const HOVER_COLORS = [
  "oklch(0.72 0.24 25)" /* coral */,
  "oklch(0.7 0.22 195)" /* teal */,
  "oklch(0.82 0.22 95)" /* golden yellow */,
  "oklch(0.78 0.2 165)" /* mint */,
  "oklch(0.68 0.26 15)" /* warm pink */,
  "oklch(0.68 0.24 300)" /* violet */,
] as const;

export type HoverColor = (typeof HOVER_COLORS)[number];
