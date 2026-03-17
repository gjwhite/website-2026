import type { Metadata } from "next";
import { Link } from "next-view-transitions";
import ArticleListingGrid from "@/pages/ArticleListing/ArticleListingGrid";
import "@/pages/ArticleListing/ArticleListing.css";

export const metadata: Metadata = {
  title: "Articles",
  description: "Browse all articles.",
};

export default function ArchivePage() {
  return (
    <section className="article-listing">
      <div className="article-listing__inner load-animate">
        <nav className="article-listing__nav" aria-label="Back">
          <Link href="/" className="article-listing__back">
            Back
          </Link>
        </nav>
        <h1 className="article-listing__title">Articles</h1>
        <ArticleListingGrid />
      </div>
    </section>
  );
}
