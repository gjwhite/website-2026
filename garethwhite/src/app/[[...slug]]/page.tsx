import { StoryblokStory } from "@storyblok/react/rsc";
import { notFound } from "next/navigation";
import { fetchStory } from "@/utils/fetchStory";

type Params = Promise<{ slug?: string[] }>;

export async function generateStaticParams() {
  return []; // Add slugs here for full SSG
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const isEditor = typeof query._storyblok !== "undefined";
  const version = isEditor ? "draft" : "published";
  try {
    const pageData = await fetchStory(version, slug);
    if (!pageData?.story) notFound();
    const story = pageData.story;
    return <StoryblokStory story={story} />;
  } catch {
    notFound();
  }
}
