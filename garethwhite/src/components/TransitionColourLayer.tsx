/**
 * Three full-screen layers for the diagonal swipe transition (bottom-right → top-left).
 * Top = page background; under that, two layers use random colours from HOVER_COLORS.
 * The two colour layers have a stagger delay.
 */
export function TransitionColourLayer() {
  return (
    <>
      <div aria-hidden className="swipe-layer swipe-layer--bg" />
      <div aria-hidden className="swipe-layer swipe-layer--colour-1" />
      <div aria-hidden className="swipe-layer swipe-layer--colour-2" />
    </>
  );
}
