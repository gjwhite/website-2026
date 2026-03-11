/**
 * Reusable helpers for Storyblok image assets (URL, focus point → object-position).
 */

export type StoryblokAssetLike = {
  src?: string;
  filename?: string | null;
  width?: number | null;
  height?: number | null;
  alt?: string | null;
  focus?: string | null;
};

/** Storyblok CDN hostnames that support the image service (/m/ resize, filters). */
const STORYBLOK_IMAGE_HOSTS = [
  "a.storyblok.com",
  "a2.storyblok.com",
  "a-us.storyblok.com",
  "a2-us.storyblok.com",
  "a-ap.storyblok.com",
  "a2-ap.storyblok.com",
  "a-ca.storyblok.com",
  "a2-ca.storyblok.com",
];

function isStoryblokImageUrl(url: string): boolean {
  try {
    const host = new URL(url.startsWith("//") ? `https:${url}` : url).hostname;
    return STORYBLOK_IMAGE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

/**
 * Returns the image URL from a Storyblok asset (uses src or filename).
 */
export function storyblokAssetUrl(
  asset: StoryblokAssetLike | undefined,
): string | null {
  if (!asset) return null;
  const url = asset.src ?? asset.filename;
  return url && typeof url === "string" ? url : null;
}

export type StoryblokImageOptions = {
  /** Target width in pixels. Use with height for exact size, or height 0 for proportional. */
  width: number;
  /** Target height in pixels. 0 = proportional to width. */
  height?: number;
  /** If true and asset has focus, append focal filter so resize respects focus. Default true. */
  focal?: boolean;
};

/**
 * Returns an optimized image URL for a Storyblok asset: resized via Image Service
 * (/m/WIDTHxHEIGHT) and optional focal filter. Non-Storyblok URLs are returned unchanged.
 * Use for smaller, display-sized requests (e.g. width 800 for cards, 1200–1600 for heroes).
 */
export function storyblokImageUrl(
  asset: StoryblokAssetLike | undefined,
  options: StoryblokImageOptions,
): string | null {
  const raw = storyblokAssetUrl(asset);
  if (!raw || !isStoryblokImageUrl(raw)) return raw;

  const { width, height = 0, focal = true } = options;
  const segment = height > 0 ? `${width}x${height}` : `${width}x0`;
  let url = raw.replace(/\?.*$/, "");
  url = `${url}/m/${segment}`;
  if (focal && asset?.focus) {
    url = `${url}/filters:focal(${asset.focus})`;
  }
  return url;
}

/**
 * Parses image dimensions from a Storyblok asset URL.
 * URLs often look like: .../f/51376/664x488/f4f9d1769c/filename.webp
 * Returns { width, height } or null if not found.
 */
export function storyblokDimensionsFromUrl(
  url: string | null | undefined,
): { width: number; height: number } | null {
  if (!url || typeof url !== "string") return null;
  const match = url.match(/\/(\d+)x(\d+)\//);
  if (!match) return null;
  const w = parseInt(match[1], 10);
  const h = parseInt(match[2], 10);
  return w > 0 && h > 0 ? { width: w, height: h } : null;
}

/**
 * Returns the image dimensions to use for focus calculation: from asset
 * width/height, then from the asset URL path, then fallback.
 */
function getDimensions(
  asset: StoryblokAssetLike | undefined,
  fallback: { width: number; height: number },
): { width: number; height: number } {
  if (asset?.width != null && asset?.height != null && asset.width > 0 && asset.height > 0) {
    return { width: asset.width, height: asset.height };
  }
  const url = asset?.src ?? asset?.filename;
  const fromUrl = storyblokDimensionsFromUrl(url ?? null);
  return fromUrl ?? fallback;
}

/**
 * Parses Storyblok focus string "x1y1:x2y2" (focal rectangle in pixels) and
 * returns CSS object-position (e.g. "45% 30%") so the focal point stays
 * visible when the image is cropped (e.g. object-fit: cover).
 * Returns "50% 50%" when focus is missing or invalid.
 */
export function storyblokFocusToObjectPosition(
  focus: string | null | undefined,
  width: number,
  height: number,
): string {
  if (!focus || typeof focus !== "string" || !width || !height) {
    return "50% 50%";
  }
  const parts = focus.split(":");
  if (parts.length !== 2) return "50% 50%";
  const [p1, p2] = parts.map((p) => p.split("x").map(Number));
  if (
    p1.length !== 2 ||
    p2.length !== 2 ||
    p1.some(Number.isNaN) ||
    p2.some(Number.isNaN)
  ) {
    return "50% 50%";
  }
  const centerX = (p1[0] + p2[0]) / 2;
  const centerY = (p1[1] + p2[1]) / 2;
  const xPercent = (centerX / width) * 100;
  const yPercent = (centerY / height) * 100;
  return `${Math.max(0, Math.min(100, xPercent))}% ${Math.max(0, Math.min(100, yPercent))}%`;
}

/**
 * Returns CSS object-position for a Storyblok image asset using its focus
 * point. Uses asset width/height when present, otherwise parses dimensions
 * from the asset URL so the focal point is correct.
 */
export function storyblokAssetObjectPosition(
  asset: StoryblokAssetLike | undefined,
  fallbackDimensions?: { width: number; height: number },
): string {
  const fallback = fallbackDimensions ?? { width: 400, height: 300 };
  const { width, height } = getDimensions(asset, fallback);
  return storyblokFocusToObjectPosition(asset?.focus, width, height);
}
