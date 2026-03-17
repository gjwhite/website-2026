import { SbBlokData, storyblokEditable } from "@storyblok/react/rsc";
import { Link } from "next-view-transitions";
import type { ArticleListingStoryblok } from "@/types/storyblok-component-types";
import ArticleListingGrid from "./ArticleListingGrid";
import "./ArticleListing.css";

interface ArticleListingProps {
  blok?: ArticleListingStoryblok;
}

export default function ArticleListing({ blok }: ArticleListingProps) {
  if (!blok) return null;

  return (
    <section
      className="article-listing"
      {...storyblokEditable(blok as SbBlokData)}
    >
      <div className="article-listing__inner load-animate">
        <nav className="article-listing__nav" aria-label="Back">
          <Link href="/" className="article-listing__back">
            Back
          </Link>
        </nav>
        {blok.title ? (
          <h1 className="article-listing__title">{blok.title}</h1>
        ) : (
          <h1 className="article-listing__title">Articles</h1>
        )}
        <ArticleListingGrid sortOrder={blok.sort_order} />
      </div>
    </section>
  );
}
