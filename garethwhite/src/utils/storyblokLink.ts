/**
 * Resolve a Storyblok link field (multilink or string) to an href and optional target.
 * Use this for link/image/option fields that can be url, story, asset, or email.
 *
 * For internal story links to have cached_url, add resolve_links=url to your CDN fetch.
 */
export type StoryblokLinkResult = { href: string; target?: "_self" | "_blank" };

export function storyblokLinkUrl(link: unknown): string {
  if (typeof link === "string") return link;
  if (!link || typeof link !== "object") return "";

  const obj = link as Record<string, unknown>;

  // Multilink: prefer cached_url (resolved by API when resolve_links=url), then url
  if (typeof obj.cached_url === "string") return obj.cached_url;
  if (typeof obj.url === "string") {
    if (obj.linktype === "email") return `mailto:${obj.url}`;
    return obj.url;
  }

  return "";
}

export function storyblokLink(link: unknown): StoryblokLinkResult {
  const href = storyblokLinkUrl(link);
  const obj = link && typeof link === "object" ? (link as Record<string, unknown>) : null;
  const target = obj?.target === "_blank" ? "_blank" : undefined;
  return { href, target };
}
