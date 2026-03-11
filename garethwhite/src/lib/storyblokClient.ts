/**
 * Client-only Storyblok init. Used by StoryblokProvider ("use client").
 * Registers the same component map as the server so hydration and live editing match.
 * Do not import this from server code; use @/lib/storyblok (RSC) for data fetching instead.
 */
import { storyblokInit } from "@storyblok/react";
import Page from "@/pages/Page/Page";
import Feature from "@/components/Feature/Feature";
import Article from "@/pages/Article/Article";
import FrontPage from "@/pages/FrontPage/FrontPage";
import RichtextBlock from "@/components/RichtextBlock/RichtextBlock";

const componentMap = {
  page: Page,
  article: Article,
  front_page: FrontPage,
  feature: Feature,
  richtext_block: RichtextBlock,
};

export function initStoryblokClient(): void {
  storyblokInit({
    accessToken: process.env.NEXT_PUBLIC_STORYBLOK_TOKEN,
    components: componentMap,
  });
}
