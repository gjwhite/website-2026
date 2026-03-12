"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { SbBlokData, storyblokEditable } from "@storyblok/react/rsc";
import type { FeatureStoryblok } from "@/types/storyblok-component-types";
import { storyblokLink } from "@/utils/storyblokLink";
import {
  type StoryblokAssetLike,
  storyblokImageUrl,
  storyblokAssetObjectPosition,
} from "@/utils/storyblokImage";
import { HOVER_COLORS, type HoverColor } from "@/constants/hoverColors";
import {
  getDeterministicShapeConfig,
  generateHoverShapeConfig,
} from "@/utils/shapeUtils";
import "./Feature.css";

const TILT_MAX_DEG = 5;
const TRANSLATE_MAX_PX = 10;

/** Depth levels (translateZ px): 0 = back, 1 = shadows, 2 = mid, 3 = card, 4 = front, 5–6 = above card */
const FEATURE_DEPTH_LEVEL_PX = {
  0: -48,
  1: -24,
  2: 24,
  3: 56,
  4: 96,
  5: 130,
  6: 165,
} as const;

type TiltState = {
  tiltX: number;
  tiltY: number;
  translateX: number;
  translateY: number;
};

function useTiltFollow() {
  const [state, setState] = useState<TiltState>({
    tiltX: 0,
    tiltY: 0,
    translateX: 0,
    translateY: 0,
  });
  const rafRef = useRef<number | null>(null);
  const lastEventRef = useRef<{ clientX: number; clientY: number; rect: DOMRect } | null>(null);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const { currentTarget } = e;
    lastEventRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      rect: currentTarget.getBoundingClientRect(),
    };
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const ev = lastEventRef.current;
      if (!ev) return;
      const x = (ev.clientX - ev.rect.left) / ev.rect.width;
      const y = (ev.clientY - ev.rect.top) / ev.rect.height;
      setState({
        tiltX: (0.5 - y) * 2 * TILT_MAX_DEG,
        tiltY: (x - 0.5) * 2 * TILT_MAX_DEG,
        translateX: (x - 0.5) * 2 * TRANSLATE_MAX_PX,
        translateY: (y - 0.5) * 2 * TRANSLATE_MAX_PX,
      });
    });
  }, []);

  const onMouseLeave = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastEventRef.current = null;
    setState({ tiltX: 0, tiltY: 0, translateX: 0, translateY: 0 });
  }, []);

  return [state, onMouseMove, onMouseLeave] as const;
}

/** Re-export for consumers that use Feature's shape config type */
export type { HoverShapeConfig } from "@/utils/shapeUtils";

/** Re-export shared hover palette for consumers that import from Feature */
export { HOVER_COLORS as FEATURE_HOVER_COLORS } from "@/constants/hoverColors";
export type { HoverColor as FeatureHoverColor } from "@/constants/hoverColors";

interface FeatureProps {
  blok?: FeatureStoryblok;
}

export default function Feature({ blok }: FeatureProps) {
  if (!blok) return null;

  const [mouseFollow, onMouseMove, onMouseLeave] = useTiltFollow();
  // Deterministic on server and first client render to avoid hydration mismatch
  const [shapeConfig, setShapeConfig] = useState(() =>
    getDeterministicShapeConfig(HOVER_COLORS.length),
  );

  const { href, target } = storyblokLink(blok.link);
  const image = blok.image as StoryblokAssetLike | undefined;
  const imageSrc = storyblokImageUrl(image, { width: 400, height: 800 });
  const objectPosition = storyblokAssetObjectPosition(image, {
    width: image?.width ?? 400,
    height: image?.height ?? 300,
  });
  const imageNode = imageSrc ? (
    <Image
      className="feature__background-image"
      src={imageSrc}
      alt={image?.alt ?? blok.name ?? ""}
      width={400}
      height={800}
      sizes="(max-width: 768px) 100vw, 400px"
      style={{ objectPosition }}
    />
  ) : null;

  const hoverColors = (blok as { hoverColor?: string[] }).hoverColor?.length
    ? ((blok as { hoverColor?: string[] }).hoverColor as HoverColor[])
    : HOVER_COLORS;

  const onMouseEnter = useCallback(() => {
    setShapeConfig(generateHoverShapeConfig(hoverColors.length));
  }, [hoverColors.length]);

  const shadowColor =
    hoverColors[(shapeConfig[0]?.colorIndex ?? 0) % hoverColors.length];
  const shadowColorTopLeft =
    hoverColors[(shapeConfig[1]?.colorIndex ?? 1) % hoverColors.length];

  const article = (
    <div
      className="feature-wrapper"
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={
        {
          "--tilt-x": `${mouseFollow.tiltX}deg`,
          "--tilt-y": `${mouseFollow.tiltY}deg`,
          "--translate-x": `${mouseFollow.translateX}px`,
          "--translate-y": `${mouseFollow.translateY}px`,
          "--feature-shadow-color": shadowColor,
          "--feature-shadow-color-top-left": shadowColorTopLeft,
          "--feature-depth-level-0": `${FEATURE_DEPTH_LEVEL_PX[0]}px`,
          "--feature-depth-level-1": `${FEATURE_DEPTH_LEVEL_PX[1]}px`,
          "--feature-depth-level-2": `${FEATURE_DEPTH_LEVEL_PX[2]}px`,
          "--feature-depth-level-3": `${FEATURE_DEPTH_LEVEL_PX[3]}px`,
          "--feature-depth-level-4": `${FEATURE_DEPTH_LEVEL_PX[4]}px`,
          "--feature-depth-level-5": `${FEATURE_DEPTH_LEVEL_PX[5]}px`,
          "--feature-depth-level-6": `${FEATURE_DEPTH_LEVEL_PX[6]}px`,
        } as React.CSSProperties
      }
    >
      <div className="feature__card-shadow" aria-hidden />
      <div className="feature__card-shadow feature__card-shadow--top-left" aria-hidden />
      <div className="feature__hover-shapes" aria-hidden>
        {shapeConfig.map((shape, i) => {
          const rad = (shape.directionDeg * Math.PI) / 180;
          const translateX = Math.round(shape.translationDistancePx * Math.sin(rad) * 100) / 100;
          const translateY = Math.round(-shape.translationDistancePx * Math.cos(rad) * 100) / 100;
          const rotationDeg = shape.rotationDeg;
          return (
            <div
              key={i}
              className={`feature__hover-shape${shape.isOrganic ? " feature__hover-shape--organic" : ""}`}
              style={
                {
                  "--hover-shape-color":
                    hoverColors[shape.colorIndex % hoverColors.length],
                  "--hover-shape-scale": `${shape.scale}`,
                  "--hover-shape-delay": `${Math.round(shape.delayMs)}ms`,
                  "--hover-shape-translate-x": `${translateX}px`,
                  "--hover-shape-translate-y": `${translateY}px`,
                  "--hover-shape-width": `${shape.widthPx}px`,
                  "--hover-shape-height": `${shape.heightPx}px`,
                  "--hover-shape-rotation": `${rotationDeg}deg`,
                  "--hover-shape-depth-z": `${FEATURE_DEPTH_LEVEL_PX[shape.depthLevel]}px`,
                } as React.CSSProperties
              }
            >
              <div
                className="feature__hover-shape-inner"
                style={{ clipPath: shape.clipPath } as React.CSSProperties}
              />
            </div>
          );
        })}
      </div>
      <article
        className="feature"
        {...storyblokEditable(blok as SbBlokData)}
      >
        <div className="feature__background">{imageNode}</div>
        <span className="feature__name">{blok.name ?? ""}</span>
      </article>
    </div>
  );

  const linkClassName = "feature-link";
  if (!href) return article;
  if (target === "_blank") {
    return (
      <a
        href={href}
        target={target}
        rel="noopener noreferrer"
        className={linkClassName}
      >
        {article}
      </a>
    );
  }
  return (
    <Link href={href} className={linkClassName}>
      {article}
    </Link>
  );
}
