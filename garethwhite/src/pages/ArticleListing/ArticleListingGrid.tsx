"use client";

import type { ISbStoryData } from "@storyblok/react/rsc";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Link } from "next-view-transitions";
import {
  type StoryblokAssetLike,
  storyblokImageUrl,
  storyblokAssetObjectPosition,
} from "@/utils/storyblokImage";
import type { ArticleListingStoryblok } from "@/types/storyblok-component-types";
import "./ArticleListing.css";

const CARD_IMAGE_MAX = 800;

type SortOrder = ArticleListingStoryblok["sort_order"];

function ArticleCard({ story }: { story: ISbStoryData }) {
  const content = story.content as {
    title?: string;
    feature_image?: StoryblokAssetLike;
  };
  const title = content.title ?? story.name ?? "Article";
  const slug = story.full_slug ?? story.slug ?? "";
  const href = slug ? `/${slug}` : "#";
  const image = content.feature_image;
  const w = image?.width ?? 640;
  const h = image?.height ?? 400;
  const maxEdge = Math.min(Math.max(w, h), CARD_IMAGE_MAX);
  const imageSrc = storyblokImageUrl(image, { width: maxEdge, height: 0 });
  const objectPosition = storyblokAssetObjectPosition(image, {
    width: w,
    height: h,
  });

  return (
    <li className="article-listing__item">
      <Link href={href} className="article-listing__card">
        <div className="article-listing__media">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={image?.alt ?? title}
              width={w}
              height={h}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="article-listing__image"
              style={{ objectPosition }}
            />
          ) : (
            <div className="article-listing__placeholder" aria-hidden />
          )}
        </div>
        <h2 className="article-listing__card-title">{title}</h2>
      </Link>
    </li>
  );
}

interface ArticleListingGridProps {
  sortOrder?: SortOrder;
}

export default function ArticleListingGrid({
  sortOrder,
}: ArticleListingGridProps) {
  const [stories, setStories] = useState<ISbStoryData[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const editor =
      typeof window !== "undefined" &&
      window.location.search.includes("_storyblok");
    const q = new URLSearchParams();
    if (editor) q.set("editor", "1");
    if (sortOrder === "asc" || sortOrder === "desc") {
      q.set("sort", sortOrder);
    }
    const qs = q.toString();
    const url = `/api/cms/articles${qs ? `?${qs}` : ""}`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data: ISbStoryData[]) => setStories(Array.isArray(data) ? data : []))
      .catch(() => {
        setFailed(true);
        setStories([]);
      });
  }, [sortOrder]);

  if (stories === null) {
    return (
      <p className="article-listing__empty article-listing__empty--loading">
        Loading articles…
      </p>
    );
  }
  if (failed && stories.length === 0) {
    return (
      <p className="article-listing__empty">
        Couldn&apos;t load articles. Check your connection and Storyblok setup.
      </p>
    );
  }
  if (stories.length === 0) {
    return <p className="article-listing__empty">No articles yet.</p>;
  }
  return (
    <ul className="article-listing__grid">
      {stories.map((story) => (
        <ArticleCard
          key={story.uuid ?? String(story.id) ?? story.slug}
          story={story}
        />
      ))}
    </ul>
  );
}
