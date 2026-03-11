/**
 * Shape and random utilities for clip-paths, shuffle, and hover-shape config.
 * Reusable across components that need random shapes or deterministic SSR config.
 */

// -----------------------------------------------------------------------------
// Edit-friendly constants (tweak these at the top)
// -----------------------------------------------------------------------------

/** Minimum span (in % of clip-path box) so the visible shape never looks tiny. */
export const POLYGON_MIN_SPAN_PERCENT = 66;

/** Minimum span of the original point cloud (before normalization). Stops needle-thin triangles. */
export const POLYGON_MIN_ORIGINAL_SPAN_PERCENT = 28;

/** Lightning bolt (zigzag) clip-path. Size must match SHAPE_LIGHTNING_WIDTH/HEIGHT_PX so rotation is correct. */
export const SHAPE_CLIP_PATH_LIGHTNING =
  "polygon(22% 0, 73% 0, 49% 36%, 71% 49%, 25% 100%, 35% 58%, 8% 50%)";

/** Lightning shape dimensions (px); clip-path is defined for this aspect ratio. */
export const SHAPE_LIGHTNING_WIDTH_PX = 30;
export const SHAPE_LIGHTNING_HEIGHT_PX = 60;

/** "The end" of the lightning bolt (point 5 in the polygon). Update these if you move point 5 in SHAPE_CLIP_PATH_LIGHTNING. */
const LIGHTNING_END_X_PERCENT = 25;
const LIGHTNING_END_Y_PERCENT = 100;
const LIGHTNING_CENTER_PERCENT = 50;

/**
 * Direction (deg) that "the end" points by default. Uses same convention as shape
 * directionDeg: 0 = up, 90 = right, 180 = down, 270 = left. Derived from the tip
 * (LIGHTNING_END_*_PERCENT) vs center (50, 50). atan2 gives 0° = right, so we
 * subtract 90° to get 0° = up so the rotation in Feature aligns the tip with the
 * translation direction (pointing away from the card).
 */
export const LIGHTNING_END_DIRECTION_DEG =
  (Math.atan2(
    LIGHTNING_END_X_PERCENT - LIGHTNING_CENTER_PERCENT,
    LIGHTNING_CENTER_PERCENT - LIGHTNING_END_Y_PERCENT,
  ) *
    (180 / Math.PI) -
    90 +
    360) %
  360;

export const NUM_HOVER_SHAPES = 5;
export const SHAPE_SCALE_MIN = 0.9;
export const SHAPE_SCALE_MAX = 1.01;
export const SHAPE_DELAY_MIN_MS = 50;
export const SHAPE_DELAY_MAX_MS = 100;
export const SHAPE_DIRECTION_MIN_DEG = 0;
export const SHAPE_DIRECTION_MAX_DEG = 360;
/** Min/max CSS rotation (deg) for all shapes. Lightning: tip aligned with translation direction, clamped here; others: rotation in this range. */
export const SHAPE_ROTATION_MIN_DEG = -180;
export const SHAPE_ROTATION_MAX_DEG = 180;
export const SHAPE_TRANSLATION_MIN_PX = 180;
export const SHAPE_TRANSLATION_MAX_PX = 210;
export const SHAPE_SIZE_MIN_PX = 110;
export const SHAPE_SIZE_MAX_PX = 130;

/** Percent (0–100) of shapes that are lightning bolts in the random config. The last shape is always lightning; this chance applies to the rest. */
export const SHAPE_LIGHTNING_PERCENT = 0;

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Hover shape config (color index, scale, clip-path, delay, direction, translation, size). */
export interface HoverShapeConfig {
  colorIndex: number;
  scale: number;
  clipPath: string;
  delayMs: number;
  /** Direction in degrees: 0 = up, 90 = right, 180 = down, 270 = left. */
  directionDeg: number;
  /** How far the shape translates on hover (px). */
  translationDistancePx: number;
  /** Width in px; matches clip-path bounding box so rotation looks correct. */
  widthPx: number;
  /** Height in px; matches clip-path bounding box so rotation looks correct. */
  heightPx: number;
  /** True when shape is lightning (fixed 30×60 from SHAPE_LIGHTNING_*_PX). */
  isLightning?: boolean;
  /** CSS rotation (deg) for all shapes; from SHAPE_ROTATION_* (lightning: tip-aligned clamped, others: value in range). */
  rotationDeg: number;
  /** Depth level for perspective stacking: 0 = behind shadows, 2 = between shadows and card, 4 = in front of card. */
  depthLevel: 0 | 2 | 4;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Minimal seeded RNG (mulberry32) for deterministic polygon from a seed. */
function seededRandom(seed: number): () => number {
  return function next() {
    seed = (seed + 0x6d2b79f5) | 0; // 32-bit
    const t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    return ((t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ 0) >>> 0;
  };
}

// -----------------------------------------------------------------------------
// Clip-path generators
// -----------------------------------------------------------------------------

/**
 * Single random triangle clip-path (3 points, 0–100% each axis).
 * The triangle is normalized so its bounding box spans at least POLYGON_MIN_SPAN_PERCENT
 * in both dimensions (centered), so the visible shape never renders below the min size.
 * Pass a numeric seed for deterministic output (SSR-safe); omit for random.
 */
export function randomPolygonClipPath(seed?: number): string {
  const random =
    seed !== undefined
      ? (() => {
          const next = seededRandom(seed);
          return () => next() / 0xffffffff;
        })()
      : () => Math.random();

  const points: number[][] = [];
  for (let i = 0; i < 3; i++) {
    points.push([Math.round(random() * 100), Math.round(random() * 100)]);
  }
  const sorted = points
    .map((p) => ({ p, angle: Math.atan2(p[1] - 50, p[0] - 50) }))
    .sort((a, b) => a.angle - b.angle)
    .map(({ p }) => p);

  let minX = Math.min(...sorted.map(([x]) => x));
  let maxX = Math.max(...sorted.map(([x]) => x));
  let minY = Math.min(...sorted.map(([, y]) => y));
  let maxY = Math.max(...sorted.map(([, y]) => y));
  let spanX = maxX - minX || 1;
  let spanY = maxY - minY || 1;

  const minOriginal = POLYGON_MIN_ORIGINAL_SPAN_PERCENT;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const scaleX = spanX >= minOriginal ? 1 : minOriginal / spanX;
  const scaleY = spanY >= minOriginal ? 1 : minOriginal / spanY;
  const expanded = sorted.map(([x, y]) => [
    centerX + (x - centerX) * scaleX,
    centerY + (y - centerY) * scaleY,
  ]);
  minX = Math.min(...expanded.map(([x]) => x));
  maxX = Math.max(...expanded.map(([x]) => x));
  minY = Math.min(...expanded.map(([, y]) => y));
  maxY = Math.max(...expanded.map(([, y]) => y));
  spanX = maxX - minX || 1;
  spanY = maxY - minY || 1;

  const targetSpan = POLYGON_MIN_SPAN_PERCENT;
  const pad = (100 - targetSpan) / 2;
  const normalized = expanded.map(([x, y]) => {
    const nx = pad + ((x - minX) / spanX) * targetSpan;
    const ny = pad + ((y - minY) / spanY) * targetSpan;
    return [Math.round(nx), Math.round(ny)];
  });

  return `polygon(${normalized.map(([x, y]) => `${x}% ${y}%`).join(", ")})`;
}

/** Random ellipse (rx, ry, cx, cy in %) for extra shape variety. */
export function randomEllipseClipPath(): string {
  const rx = 40 + Math.round(Math.random() * 25);
  const ry = 38 + Math.round(Math.random() * 22);
  const cx = 30 + Math.round(Math.random() * 40);
  const cy = 30 + Math.round(Math.random() * 40);
  return `ellipse(${rx}% ${ry}% at ${cx}% ${cy}%)`;
}

/**
 * Translation distance (px) inversely related to shape size:
 * smaller shape → larger translation, larger shape → smaller translation.
 * Clamps size to SHAPE_SIZE_* range so result stays within SHAPE_TRANSLATION_*.
 */
function translationFromSizePx(sizePx: number): number {
  const sizeRange = SHAPE_SIZE_MAX_PX - SHAPE_SIZE_MIN_PX;
  const tRange = SHAPE_TRANSLATION_MAX_PX - SHAPE_TRANSLATION_MIN_PX;
  const normalized = Math.max(
    0,
    Math.min(1, (sizePx - SHAPE_SIZE_MIN_PX) / sizeRange),
  );
  return Math.round(SHAPE_TRANSLATION_MAX_PX - normalized * tRange);
}

/** Fisher–Yates shuffle. Returns a new array. */
export function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

// -----------------------------------------------------------------------------
// Shape configs
// -----------------------------------------------------------------------------

/** Deterministic config for SSR so server and client match (avoids hydration error). */
export function getDeterministicShapeConfig(
  colorCount: number,
  numShapes = NUM_HOVER_SHAPES,
): HoverShapeConfig[] {
  return Array.from({ length: numShapes }, (_, i) => {
    const directionDeg = (i * 97 + 23) % 360;
    const sizePx =
      SHAPE_SIZE_MIN_PX +
      ((i * 41 + 11) % (SHAPE_SIZE_MAX_PX - SHAPE_SIZE_MIN_PX + 1));
    const translationDistancePx = translationFromSizePx(sizePx);
    const isLightning = i === numShapes - 1;
    const clipPath = isLightning
      ? SHAPE_CLIP_PATH_LIGHTNING
      : randomPolygonClipPath(i);
    const rotationDeg = isLightning
      ? Math.max(
          SHAPE_ROTATION_MIN_DEG,
          Math.min(
            SHAPE_ROTATION_MAX_DEG,
            directionDeg - LIGHTNING_END_DIRECTION_DEG,
          ),
        )
      : SHAPE_ROTATION_MIN_DEG +
        ((i * 53 + 17) % (SHAPE_ROTATION_MAX_DEG - SHAPE_ROTATION_MIN_DEG + 1));
    const widthPx = isLightning ? SHAPE_LIGHTNING_WIDTH_PX : sizePx;
    const heightPx = isLightning ? SHAPE_LIGHTNING_HEIGHT_PX : sizePx;
    const depthLevels: (0 | 2 | 4)[] = [0, 2, 4];
    const depthLevel = depthLevels[(i * 7 + 3) % 3];
    return {
      colorIndex: i % colorCount,
      scale: 1,
      clipPath,
      delayMs: 20 + i * 25,
      directionDeg,
      translationDistancePx,
      widthPx,
      heightPx,
      isLightning,
      rotationDeg,
      depthLevel,
    };
  });
}

/** Random per-instance hover shape config (call client-side only, e.g. in useEffect). Each shape gets its own random directionDeg and translationDistancePx. */
export function generateHoverShapeConfig(
  colorCount: number,
  numShapes = NUM_HOVER_SHAPES,
): HoverShapeConfig[] {
  const colorIndices = shuffle(
    Array.from(
      { length: Math.max(colorCount, numShapes) },
      (_, i) => i % colorCount,
    ),
  ).slice(0, numShapes);

  return Array.from({ length: numShapes }, (_, i) => {
    const colorIndex = colorIndices[i];
    const isLightning =
      i === numShapes - 1 || Math.random() < SHAPE_LIGHTNING_PERCENT / 100;
    const clipPath = isLightning
      ? SHAPE_CLIP_PATH_LIGHTNING
      : randomPolygonClipPath();
    const scale =
      SHAPE_SCALE_MIN + Math.random() * (SHAPE_SCALE_MAX - SHAPE_SCALE_MIN);
    const delayMs =
      SHAPE_DELAY_MIN_MS +
      Math.random() * (SHAPE_DELAY_MAX_MS - SHAPE_DELAY_MIN_MS);
    const directionDeg =
      SHAPE_DIRECTION_MIN_DEG +
      Math.random() * (SHAPE_DIRECTION_MAX_DEG - SHAPE_DIRECTION_MIN_DEG + 32);
    const sizePx =
      SHAPE_SIZE_MIN_PX +
      Math.round(Math.random() * (SHAPE_SIZE_MAX_PX - SHAPE_SIZE_MIN_PX));
    const translationDistancePx = translationFromSizePx(sizePx);
    const rotationDeg = isLightning
      ? Math.max(
          SHAPE_ROTATION_MIN_DEG,
          Math.min(
            SHAPE_ROTATION_MAX_DEG,
            directionDeg - LIGHTNING_END_DIRECTION_DEG,
          ),
        )
      : SHAPE_ROTATION_MIN_DEG +
        Math.random() * (SHAPE_ROTATION_MAX_DEG - SHAPE_ROTATION_MIN_DEG);
    const widthPx = isLightning ? SHAPE_LIGHTNING_WIDTH_PX : sizePx;
    const heightPx = isLightning ? SHAPE_LIGHTNING_HEIGHT_PX : sizePx;
    const depthLevels: (0 | 2 | 4)[] = [0, 2, 4];
    const depthLevel =
      depthLevels[Math.floor(Math.random() * depthLevels.length)];
    return {
      colorIndex,
      scale,
      clipPath,
      delayMs,
      directionDeg,
      translationDistancePx,
      widthPx,
      heightPx,
      isLightning,
      rotationDeg,
      depthLevel,
    };
  });
}
