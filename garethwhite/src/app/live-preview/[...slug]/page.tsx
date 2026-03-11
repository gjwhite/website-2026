import { StoryblokStory } from "@storyblok/react/rsc";
import { fetchStory } from "@/utils/fetchStory";

type Params = Promise<{ slug?: string[] }>;

export default async function LivePreviewPage({ params }: { params: Params }) {
  const { slug } = await params;
  const pageData = await fetchStory("draft", slug);
  return <StoryblokStory story={pageData.story} />;
}
