/**
 * Client-only Storyblok init. Used by StoryblokProvider ("use client").
 * Registers the same component map as the server so hydration and live editing match.
 * Do not import this from server code; use @/lib/storyblok (RSC) for data fetching instead.
 */
import { storyblokInit } from "@storyblok/react";
import Page from "@/pages/Page/Page";
import Feature from "@/components/Feature/Feature";
import Article from "@/pages/Article/Article";
import ArticleListing from "@/pages/ArticleListing/ArticleListing";
import FrontPage from "@/pages/FrontPage/FrontPage";
import RichtextBlock from "@/components/RichtextBlock/RichtextBlock";
import Picture from "@/components/Picture/Picture";

const componentMap = {
  page: Page,
  article: Article,
  article_listing: ArticleListing,
  front_page: FrontPage,
  feature: Feature,
  richtext_block: RichtextBlock,
  picture: Picture,
};

export function initStoryblokClient(): void {
  storyblokInit({
    accessToken: process.env.NEXT_PUBLIC_STORYBLOK_TOKEN,
    components: componentMap,
  });
}
