import type { ISbStoryData } from "@storyblok/react/rsc";
import { getStoryblokApi } from "@/lib/storyblok";

const API_HOST_BY_REGION: Record<string, string> = {
  eu: "https://api.storyblok.com",
  us: "https://api-us.storyblok.com",
  ap: "https://api-ap.storyblok.com",
  ca: "https://api-ca.storyblok.com",
  cn: "https://app.storyblokchina.cn",
};

function getApiHost(): string {
  const region = (process.env.NEXT_PUBLIC_STORYBLOK_REGION ?? "eu").toLowerCase();
  return API_HOST_BY_REGION[region] ?? API_HOST_BY_REGION.eu;
}

type StoriesListResponse = { stories: ISbStoryData[] };

/** Matches Storyblok `article_listing.sort_order`. */
export type ArticleListSortOrder = "" | "asc" | "desc";

function publishedAtSortBy(order: ArticleListSortOrder | undefined): string {
  if (order === "asc") return "published_at:asc";
  return "published_at:desc";
}

async function fetchArticlesFromApi(
  version: "draft" | "published",
  sortOrder?: ArticleListSortOrder,
): Promise<ISbStoryData[]> {
  const token = process.env.NEXT_PUBLIC_STORYBLOK_TOKEN ?? "";
  const params = new URLSearchParams({
    version,
    token,
    per_page: "100",
    sort_by: publishedAtSortBy(sortOrder),
  });
  /** Root blok component = article (same as single article pages). */
  params.append("filter_query[component][in]", "article");

  const startsWith = process.env.NEXT_PUBLIC_STORYBLOK_ARTICLES_STARTS_WITH?.trim();
  if (startsWith) {
    params.set("starts_with", startsWith.replace(/^\//, "").replace(/\/$/, "") + "/");
  }

  const base = getApiHost();
  const url = `${base}/v2/cdn/stories?${params}`;
  const res = await fetch(url, {
    next: { tags: ["cms", "cms-articles"] },
    cache: version === "published" ? "default" : "no-store",
  });
  if (!res.ok) {
    throw new Error(`Storyblok articles ${res.status}`);
  }
  const data = (await res.json()) as StoriesListResponse;
  return data.stories ?? [];
}

/**
 * All published (or draft) stories whose content type is `article`.
 * Optional `NEXT_PUBLIC_STORYBLOK_ARTICLES_STARTS_WITH` (e.g. `articles`) scopes by folder slug.
 */
export async function fetchArticles(
  version: "draft" | "published",
  sortOrder?: ArticleListSortOrder,
): Promise<ISbStoryData[]> {
  getStoryblokApi();
  try {
    return await fetchArticlesFromApi(version, sortOrder);
  } catch (err) {
    const isDev = process.env.NODE_ENV === "development";
    if (
      isDev &&
      version === "published" &&
      err instanceof Error &&
      (err.message.includes("401") || err.message.includes("404"))
    ) {
      try {
        return await fetchArticlesFromApi("draft", sortOrder);
      } catch {
        throw err;
      }
    }
    throw err;
  }
}
