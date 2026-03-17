"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getDeterministicShapeConfig,
  generateHoverShapeConfig,
  type HoverShapeConfig,
} from "@/utils/shapeUtils";

// -----------------------------------------------------------------------------
// Trail tweakables (bottom-left of strip in rotated-45° space)
// -----------------------------------------------------------------------------
const TRAIL_SHAPES_MIN = 10;
const TRAIL_SHAPES_MAX = 20;
const TRAIL_SHAPE_SCALE = 2;

/** Deterministic count in [MIN, MAX] from a seed (avoids hydration mismatch from Math.random). */
function trailCountFromSeed(seed: number): number {
  const range = TRAIL_SHAPES_MAX - TRAIL_SHAPES_MIN + 1;
  return TRAIL_SHAPES_MIN + (Math.abs(seed) % range);
}

/** Distance from main swipe layer: first shape offset (dvh in rotated space). */
const TRAIL_OFFSET_BASE_X = 2;
const TRAIL_OFFSET_BASE_Y = 30;
/** Step per shape along the trail (dvh). Strip is 300dvw×30dvh so step X >> step Y to run along the strip. */
const TRAIL_OFFSET_STEP_X = 0;
const TRAIL_OFFSET_STEP_Y = 0;
/** Max random offset added on each transition (dvh). */
const TRAIL_OFFSET_RANDOM_MAX = 10;

const INITIAL_CONFIG = getDeterministicShapeConfig(6, TRAIL_SHAPES_MAX * 2);

function getLayerOffsets(
  n: number,
  positionOffset: { x: number; y: number } = { x: 0, y: 0 },
): { x: number; y: number }[] {
  return Array.from({ length: n }, (_, i) => ({
    x: TRAIL_OFFSET_BASE_X + positionOffset.x + i * TRAIL_OFFSET_STEP_X,
    y: TRAIL_OFFSET_BASE_Y + positionOffset.y + i * TRAIL_OFFSET_STEP_Y,
  }));
}

/**
 * Three full-screen layers for the diagonal swipe transition (bottom-right → top-left).
 * Top = page background (no trailing shapes); two colour layers have 6–12 trailing shapes each.
 * Shapes and trail position are randomized on every page transition (like feature card hover).
 */
export function TransitionColourLayer() {
  const pathname = usePathname();
  const seed =
    (pathname ?? "").length * 7 +
    (pathname ?? "").split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  const count1 = trailCountFromSeed(seed);
  const count2 = trailCountFromSeed(seed * 3 + 11);

  const [config1, setConfig1] = useState<HoverShapeConfig[]>(() =>
    INITIAL_CONFIG.slice(0, TRAIL_SHAPES_MAX),
  );
  const [config2, setConfig2] = useState<HoverShapeConfig[]>(() =>
    INITIAL_CONFIG.slice(TRAIL_SHAPES_MAX, TRAIL_SHAPES_MAX * 2),
  );
  const [positionOffset, setPositionOffset] = useState({ x: 0, y: 0 });
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setConfig1(generateHoverShapeConfig(6, TRAIL_SHAPES_MAX));
    setConfig2(generateHoverShapeConfig(6, TRAIL_SHAPES_MAX));
    setPositionOffset({
      x: Math.floor(Math.random() * TRAIL_OFFSET_RANDOM_MAX),
      y: Math.floor(Math.random() * TRAIL_OFFSET_RANDOM_MAX),
    });
  }, [pathname]);

  const colour1Shapes = config1.slice(0, count1);
  const colour2Shapes = config2.slice(0, count2);
  const offsets1 = getLayerOffsets(count1, positionOffset);
  const offsets2 = getLayerOffsets(count2, positionOffset);

  return (
    <>
      <div className="swipe-layer-wrap swipe-layer-wrap--bg" aria-hidden>
        <div className="swipe-layer swipe-layer--bg" />
      </div>
      <div className="swipe-layer-wrap swipe-layer-wrap--colour-1" aria-hidden>
        <div className="swipe-layer swipe-layer--colour-1">
          <div className="swipe-layer__trails swipe-layer__trails--colour-1">
            {colour1Shapes.map((shape, i) => (
              <div
                key={i}
                className="swipe-layer__trail-shape"
                style={{
                  left: `${offsets1[i].x}dvh`,
                  top: `${offsets1[i].y}dvh`,
                  clipPath: shape.clipPath,
                  width: shape.widthPx * TRAIL_SHAPE_SCALE,
                  height: shape.heightPx * TRAIL_SHAPE_SCALE,
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="swipe-layer-wrap swipe-layer-wrap--colour-2" aria-hidden>
        <div className="swipe-layer swipe-layer--colour-2">
          <div className="swipe-layer__trails swipe-layer__trails--colour-2">
            {colour2Shapes.map((shape, i) => (
              <div
                key={i}
                className="swipe-layer__trail-shape"
                style={{
                  left: `${offsets2[i].x}dvh`,
                  top: `${offsets2[i].y}dvh`,
                  clipPath: shape.clipPath,
                  width: shape.widthPx * TRAIL_SHAPE_SCALE,
                  height: shape.heightPx * TRAIL_SHAPE_SCALE,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
