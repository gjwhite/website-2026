import { ISbStoryData } from "@storyblok/react/rsc";
import { getStoryblokApi } from "@/lib/storyblok";

/** Relations to resolve so reference fields return full story objects instead of UUIDs. */
const RESOLVE_RELATIONS = "front_page.features";

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

async function fetchStoryFromApi(
  path: string,
  version: "draft" | "published",
): Promise<{ story: ISbStoryData; rels?: Array<{ uuid: string; content?: unknown; [key: string]: unknown }> }> {
  const params = new URLSearchParams({
    version,
    token: process.env.NEXT_PUBLIC_STORYBLOK_TOKEN ?? "",
    resolve_relations: RESOLVE_RELATIONS,
    resolve_links: "url",
  });
  const base = getApiHost();
  const url = `${base}/v2/cdn/stories/${path}?${params}`;
  const res = await fetch(url, {
    next: { tags: ["cms"] },
    cache: version === "published" ? "default" : "no-store",
  });
  if (!res.ok) return Promise.reject(new Error(`Storyblok ${res.status}: ${path}`));
  return res.json();
}

function mergeRelsIntoStory(data: {
  story: ISbStoryData;
  rels?: Array<{ uuid: string; content?: unknown; [key: string]: unknown }>;
}): void {
  if (!data.rels?.length || !data.story || typeof data.story !== "object" || !("content" in data.story)) return;
  const relsByUuid = new Map(data.rels.map((rel) => [rel.uuid, rel]));
  const content = data.story.content as Record<string, unknown>;
  const features = content.features as (string | unknown)[] | undefined;
  if (Array.isArray(features)) {
    content.features = features.map((item) =>
      typeof item === "string" ? relsByUuid.get(item) ?? item : item
    );
  }
}

export const fetchStory = async (
  version: "draft" | "published",
  slug?: string[],
) => {
  getStoryblokApi();
  const path = slug?.length ? slug.join("/") : "home";

  let data: Awaited<ReturnType<typeof fetchStoryFromApi>>;
  try {
    data = await fetchStoryFromApi(path, version);
  } catch (err) {
    // In development only: if published returns 404, try draft so you can preview unpublished content
    const isDev = process.env.NODE_ENV === "development";
    if (
      isDev &&
      version === "published" &&
      err instanceof Error &&
      err.message.includes("404")
    ) {
      try {
        data = await fetchStoryFromApi(path, "draft");
      } catch {
        throw err;
      }
    } else {
      throw err;
    }
  }

  mergeRelsIntoStory(data);
  return { story: data.story };
};
