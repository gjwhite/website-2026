import { storyblokInit } from "@storyblok/react/rsc";
import Page from "@/pages/Page/Page";
import Feature from "@/components/Feature/Feature";
import Article from "@/pages/Article/Article";
import FrontPage from "@/pages/FrontPage/FrontPage";
import RichtextBlock from "@/components/RichtextBlock/RichtextBlock";
export const getStoryblokApi = storyblokInit({
  accessToken: process.env.NEXT_PUBLIC_STORYBLOK_TOKEN,
  components: {
    page: Page,
    article: Article,
    front_page: FrontPage,
    feature: Feature,
    richtext_block: RichtextBlock,
  },
});
