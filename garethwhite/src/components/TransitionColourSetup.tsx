"use client";

import { useLayoutEffect } from "react";
import { useSearchParams } from "next/navigation";
import { HOVER_COLORS } from "@/constants/hoverColors";

const PREVIEW_CLASS = "swipe-layers-preview";

/** Picks two different colours from HOVER_COLORS so layer 2 and 3 are always distinct. */
function pickTwoRandomColours(): [string, string] {
  const len = HOVER_COLORS.length;
  const i = Math.floor(Math.random() * len);
  if (len <= 1) return [HOVER_COLORS[0], HOVER_COLORS[0]];
  const otherIndices = [...Array(len).keys()].filter((k) => k !== i);
  const j = otherIndices[Math.floor(Math.random() * otherIndices.length)];
  return [HOVER_COLORS[i], HOVER_COLORS[j]];
}

/**
 * Sets --transition-accent-1 and --transition-accent-2 before every view transition
 * so the two colour layers get random values from HOVER_COLORS.
 */
export function TransitionColourSetup() {
  const searchParams = useSearchParams();

  useLayoutEffect(() => {
    const preview = searchParams?.get("preview-swipe") != null;
    document.body.classList.toggle(PREVIEW_CLASS, preview);
    return () => document.body.classList.remove(PREVIEW_CLASS);
  }, [searchParams]);

  useLayoutEffect(() => {
    const setTransitionColors = () => {
      const [c1, c2] = pickTwoRandomColours();
      document.documentElement.style.setProperty("--transition-accent-1", c1);
      document.documentElement.style.setProperty("--transition-accent-2", c2);
    };

    setTransitionColors(); /* set on mount so preview mode and layers always have values */

    const onCaptureClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest("a[href]") as
        | HTMLAnchorElement
        | null;
      if (anchor?.href && anchor.target !== "_blank") {
        try {
          const url = new URL(anchor.href);
          if (url.origin === window.location.origin) setTransitionColors();
        } catch {
          /* ignore */
        }
      }
    };

    document.addEventListener("click", onCaptureClick, true);

    const TRANSITION_ACTIVE_CLASS = "view-transition-active";

    const original = document.startViewTransition;
    if (typeof original === "function") {
      (document as Document & { startViewTransition: typeof original }).startViewTransition =
        function (callback: () => void | Promise<void>) {
          setTransitionColors();
          document.body.classList.add(TRANSITION_ACTIVE_CLASS);
          const vt = original.call(this, callback);
          vt.finished.finally(() => {
            document.body.classList.remove(TRANSITION_ACTIVE_CLASS);
          });
          return vt;
        };
    }

    return () => {
      document.removeEventListener("click", onCaptureClick, true);
      if (typeof original === "function") {
        (document as Document & { startViewTransition: typeof original }).startViewTransition =
          original;
      }
    };
  }, []);

  return null;
}
