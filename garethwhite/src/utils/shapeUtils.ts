/**
 * Shape and random utilities for clip-paths, shuffle, and hover-shape config.
 * Reusable across components that need random shapes or deterministic SSR config.
 */

// -----------------------------------------------------------------------------
// Edit-friendly constants (tweak these at the top)
// -----------------------------------------------------------------------------

/** Minimum span (in % of clip-path box) so the visible shape never looks tiny. */
export const POLYGON_MIN_SPAN_PERCENT = 10;

/** Minimum span of the original point cloud (before normalization). Stops needle-thin triangles. */
export const POLYGON_MIN_ORIGINAL_SPAN_PERCENT = 20;

/** Min bbox aspect ratio (short/long). Below this we scale the short axis so the triangle isn’t needle-thin. */
export const POLYGON_MIN_ASPECT_RATIO = 1;

/** Each point (x, y) has x + y in [SUM_MIN, SUM_MAX] so points sit in a band; keeps triangles chunky. */
export const POLYGON_POINT_SUM_MIN_PERCENT = 90;
export const POLYGON_POINT_SUM_MAX_PERCENT = 200;
/** Each coordinate must be at least this (%). */
export const POLYGON_POINT_MIN_PERCENT = 30;

export const NUM_HOVER_SHAPES = 10;
export const SHAPE_SCALE_MIN = 0.9;
export const SHAPE_SCALE_MAX = 1.01;
export const SHAPE_DELAY_MIN_MS = 40;
export const SHAPE_DELAY_MAX_MS = 120;
export const SHAPE_DIRECTION_MIN_DEG = 0;
export const SHAPE_DIRECTION_MAX_DEG = 360;
/** Offset (deg) for deterministic spread so directions don’t always start at 0. */
export const SHAPE_DIRECTION_SPREAD_OFFSET_DEG = 27;
/** Min/max CSS rotation (deg) for all shapes. */
export const SHAPE_ROTATION_MIN_DEG = -10;
export const SHAPE_ROTATION_MAX_DEG = 10;
export const SHAPE_TRANSLATION_MIN_PX = 180;
export const SHAPE_TRANSLATION_MAX_PX = 210;
export const SHAPE_SIZE_MIN_PX = 220;
export const SHAPE_SIZE_MAX_PX = 380;

/** Organic (bean) shape size range (px). Path is scaled to fit this box. */
export const SHAPE_ORGANIC_SIZE_MIN_PX = 8;
export const SHAPE_ORGANIC_SIZE_MAX_PX = 22;

/** Min/max number of points for organic blob (fewer = simpler blob, more = more detailed). */
export const SHAPE_ORGANIC_POINTS_MIN = 3;
export const SHAPE_ORGANIC_POINTS_MAX = 12;

/** Percent (0–100) of shapes that are organic blobs in the random config. The last shape is always organic; this chance applies to the rest. */
export const SHAPE_ORGANIC_PERCENT = 40;

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
  /** True when shape uses the organic (bean-like) path clip-path. */
  isOrganic?: boolean;
  /** CSS rotation (deg) for all shapes; from SHAPE_ROTATION_*. */
  rotationDeg: number;
  /** Depth level for perspective stacking: 0 = behind shadows, 2 = mid, 4 = front of card, 5–6 = above card. */
  depthLevel: 0 | 2 | 4 | 5 | 6;
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

  const sumMin = POLYGON_POINT_SUM_MIN_PERCENT;
  const sumMax = POLYGON_POINT_SUM_MAX_PERCENT;
  const minCoord = POLYGON_POINT_MIN_PERCENT;
  const points: number[][] = [];
  for (let i = 0; i < 3; i++) {
    const sum = sumMin + random() * (sumMax - sumMin);
    const xMin = Math.max(minCoord, sum - 100);
    const xMax = Math.min(100, sum - minCoord);
    const x = xMin + random() * (xMax - xMin);
    const y = sum - x;
    points.push([Math.round(x), Math.round(y)]);
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
  let expanded = sorted.map(([x, y]) => [
    centerX + (x - centerX) * scaleX,
    centerY + (y - centerY) * scaleY,
  ]);
  minX = Math.min(...expanded.map(([x]) => x));
  maxX = Math.max(...expanded.map(([x]) => x));
  minY = Math.min(...expanded.map(([, y]) => y));
  maxY = Math.max(...expanded.map(([, y]) => y));
  spanX = maxX - minX || 1;
  spanY = maxY - minY || 1;

  const minAspect = POLYGON_MIN_ASPECT_RATIO;
  const ratio = spanX < spanY ? spanX / spanY : spanY / spanX;
  if (ratio < minAspect) {
    const centerX2 = (minX + maxX) / 2;
    const centerY2 = (minY + maxY) / 2;
    const scaleShort =
      spanX < spanY ? (minAspect * spanY) / spanX : (minAspect * spanX) / spanY;
    expanded = expanded.map(([x, y]) => {
      const sx = spanX < spanY ? centerX2 + (x - centerX2) * scaleShort : x;
      const sy = spanY < spanX ? centerY2 + (y - centerY2) * scaleShort : y;
      return [sx, sy];
    });
    minX = Math.min(...expanded.map(([x]) => x));
    maxX = Math.max(...expanded.map(([x]) => x));
    minY = Math.min(...expanded.map(([, y]) => y));
    maxY = Math.max(...expanded.map(([, y]) => y));
    spanX = maxX - minX || 1;
    spanY = maxY - minY || 1;
  }

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
 * Organic blob: N points in 0–100 space (N between min and max), then smooth cubic
 * Bezier through them. numPoints is chosen in [SHAPE_ORGANIC_POINTS_MIN, SHAPE_ORGANIC_POINTS_MAX];
 * when seed is provided it’s deterministic, otherwise random.
 */
function organicPathPointsIn100(seed?: number): {
  points: [number, number][];
  numPoints: number;
} {
  const random =
    seed !== undefined
      ? (() => {
          const next = seededRandom(seed);
          return () => next() / 0xffffffff;
        })()
      : () => Math.random();

  const range = SHAPE_ORGANIC_POINTS_MAX - SHAPE_ORGANIC_POINTS_MIN + 1;
  const numPoints =
    seed !== undefined
      ? SHAPE_ORGANIC_POINTS_MIN + (Math.abs(seed) % range)
      : SHAPE_ORGANIC_POINTS_MIN + Math.floor(random() * range);

  const cx = 50;
  const cy = 50;
  const baseRadius = 38;
  const radiusJitter = 12;
  const angleJitter = 0.4;

  const points: [number, number][] = [];
  for (let i = 0; i < numPoints; i++) {
    const t = (2 * Math.PI * i) / numPoints + (random() - 0.5) * angleJitter;
    const r = baseRadius + (random() - 0.5) * radiusJitter;
    const x = Math.max(5, Math.min(95, cx + r * Math.cos(t)));
    const y = Math.max(5, Math.min(95, cy + r * Math.sin(t)));
    points.push([x, y]);
  }

  return { points, numPoints };
}

/** Tension for smooth cubic Bezier between points (0–1; ~0.17 is smooth). */
const ORGANIC_BEZIER_TENSION = 1 / 6;

/**
 * Randomised organic (bean-like) clip-path using path(). Number of points is in
 * [SHAPE_ORGANIC_POINTS_MIN, SHAPE_ORGANIC_POINTS_MAX]. Coordinates scaled to
 * sizePx. Pass seed for deterministic SSR.
 */
export function randomOrganicClipPath(sizePx: number, seed?: number): string {
  const { points: pts, numPoints: N } = organicPathPointsIn100(seed);
  const scale = sizePx / 100;
  const round = (v: number) => Math.round(v * scale * 100) / 100;

  const segs: string[] = [];
  for (let i = 0; i < N; i++) {
    const prev = pts[(i - 1 + N) % N];
    const curr = pts[i];
    const next = pts[(i + 1) % N];
    const next2 = pts[(i + 2) % N];

    const cp1x = curr[0] + (next[0] - prev[0]) * ORGANIC_BEZIER_TENSION;
    const cp1y = curr[1] + (next[1] - prev[1]) * ORGANIC_BEZIER_TENSION;
    const cp2x = next[0] - (next2[0] - curr[0]) * ORGANIC_BEZIER_TENSION;
    const cp2y = next[1] - (next2[1] - curr[1]) * ORGANIC_BEZIER_TENSION;

    const x1 = round(curr[0]);
    const y1 = round(curr[1]);
    const c1 = round(cp1x);
    const c2 = round(cp1y);
    const c3 = round(cp2x);
    const c4 = round(cp2y);
    const x2 = round(next[0]);
    const y2 = round(next[1]);

    if (i === 0) {
      segs.push(`M ${x1},${y1}`);
    }
    segs.push(`C ${c1},${c2} ${c3},${c4} ${x2},${y2}`);
  }
  return `path('${segs.join(" ")} Z')`;
}

/**
 * Translation distance (px) inversely related to shape size:
 * smaller shape → larger translation, larger shape → smaller translation.
 * Uses optional min/max for the size range (e.g. SHAPE_ORGANIC_SIZE_* for organic shapes).
 */
function translationFromSizePx(
  sizePx: number,
  sizeMin = SHAPE_SIZE_MIN_PX,
  sizeMax = SHAPE_SIZE_MAX_PX,
): number {
  const sizeRange = sizeMax - sizeMin;
  const tRange = SHAPE_TRANSLATION_MAX_PX - SHAPE_TRANSLATION_MIN_PX;
  const normalized = Math.max(
    0,
    Math.min(1, sizeRange > 0 ? (sizePx - sizeMin) / sizeRange : 0),
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
  const sectorWidth = 360 / numShapes;
  return Array.from({ length: numShapes }, (_, i) => {
    const directionDeg =
      (sectorWidth * i + SHAPE_DIRECTION_SPREAD_OFFSET_DEG) % 360;
    const isOrganic = i === numShapes - 1;
    const sizePx = isOrganic
      ? SHAPE_ORGANIC_SIZE_MIN_PX +
        ((i * 41 + 11) %
          (SHAPE_ORGANIC_SIZE_MAX_PX - SHAPE_ORGANIC_SIZE_MIN_PX + 1))
      : SHAPE_SIZE_MIN_PX +
        ((i * 41 + 11) % (SHAPE_SIZE_MAX_PX - SHAPE_SIZE_MIN_PX + 1));
    const translationDistancePx = isOrganic
      ? translationFromSizePx(
          sizePx,
          SHAPE_ORGANIC_SIZE_MIN_PX,
          SHAPE_ORGANIC_SIZE_MAX_PX,
        )
      : translationFromSizePx(sizePx);
    const clipPath = isOrganic
      ? randomOrganicClipPath(sizePx, i)
      : randomPolygonClipPath(i);
    const rotationDeg =
      SHAPE_ROTATION_MIN_DEG +
      ((i * 53 + 17) % (SHAPE_ROTATION_MAX_DEG - SHAPE_ROTATION_MIN_DEG + 1));
    const widthPx = sizePx;
    const heightPx = sizePx;
    const depthLevels: (0 | 2 | 4 | 5 | 6)[] = [0, 2, 4, 5, 6];
    const depthLevel = depthLevels[(i * 7 + 3) % 5];
    return {
      colorIndex: i % colorCount,
      scale: 1,
      clipPath,
      delayMs: 20 + i * 25,
      directionDeg,
      translationDistancePx,
      widthPx,
      heightPx,
      isOrganic,
      rotationDeg,
      depthLevel,
    };
  });
}

/** Random per-instance hover shape config (call client-side only, e.g. in useEffect). Directions are stratified (one per sector) to avoid clumping. */
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

  const sectorWidth = 360 / numShapes;
  const sectorIndices = shuffle(Array.from({ length: numShapes }, (_, j) => j));

  return Array.from({ length: numShapes }, (_, i) => {
    const colorIndex = colorIndices[i];
    const isOrganic =
      i === numShapes - 1 || Math.random() < SHAPE_ORGANIC_PERCENT / 100;
    const sizePx = isOrganic
      ? SHAPE_ORGANIC_SIZE_MIN_PX +
        Math.round(
          Math.random() *
            (SHAPE_ORGANIC_SIZE_MAX_PX - SHAPE_ORGANIC_SIZE_MIN_PX),
        )
      : SHAPE_SIZE_MIN_PX +
        Math.round(Math.random() * (SHAPE_SIZE_MAX_PX - SHAPE_SIZE_MIN_PX));
    const clipPath = isOrganic
      ? randomOrganicClipPath(sizePx)
      : randomPolygonClipPath();
    const scale =
      SHAPE_SCALE_MIN + Math.random() * (SHAPE_SCALE_MAX - SHAPE_SCALE_MIN);
    const delayMs =
      SHAPE_DELAY_MIN_MS +
      Math.random() * (SHAPE_DELAY_MAX_MS - SHAPE_DELAY_MIN_MS);
    const directionDeg =
      sectorWidth * sectorIndices[i] + Math.random() * sectorWidth;
    const translationDistancePx = isOrganic
      ? translationFromSizePx(
          sizePx,
          SHAPE_ORGANIC_SIZE_MIN_PX,
          SHAPE_ORGANIC_SIZE_MAX_PX,
        )
      : translationFromSizePx(sizePx);
    const rotationDeg =
      SHAPE_ROTATION_MIN_DEG +
      Math.random() * (SHAPE_ROTATION_MAX_DEG - SHAPE_ROTATION_MIN_DEG);
    const widthPx = sizePx;
    const heightPx = sizePx;
    const depthLevels: (0 | 2 | 4 | 5 | 6)[] = [0, 2, 4, 5, 6];
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
      isOrganic,
      rotationDeg,
      depthLevel,
    };
  });
}
