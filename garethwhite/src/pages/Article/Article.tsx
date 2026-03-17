import {
  SbBlokData,
  storyblokEditable,
  StoryblokServerComponent,
} from "@storyblok/react/rsc";
import type { ArticleStoryblok } from "@/types/storyblok-component-types";
import Image from "next/image";
import { Link } from "next-view-transitions";
import {
  type StoryblokAssetLike,
  storyblokImageUrl,
  storyblokAssetObjectPosition,
} from "@/utils/storyblokImage";
import "./Article.css";

interface ArticleProps {
  blok?: ArticleStoryblok;
}

const HERO_MAX_DIMENSION = 2460;

export default function Article({ blok }: ArticleProps) {
  if (!blok) return null;
  const image = blok.feature_image as StoryblokAssetLike | undefined;
  const imgWidth = image?.width ?? 800;
  const imgHeight = image?.height ?? 600;
  const maxEdge = Math.min(Math.max(imgWidth, imgHeight), HERO_MAX_DIMENSION);
  const imageSrc = storyblokImageUrl(image, { width: maxEdge, height: 0 });
  const objectPosition = storyblokAssetObjectPosition(image, {
    width: imgWidth,
    height: imgHeight,
  });
  return (
    <section {...storyblokEditable(blok as SbBlokData)}>
      <div className="load-animate">
        <nav className="article__nav" aria-label="Back">
          <Link href="/archive" className="article__back">
            View all
          </Link>
        </nav>
        <header className="article__header">
          {imageSrc ? (
            <div className="article__image">
              <Image
                src={imageSrc}
                alt={image?.alt ?? blok.title ?? "Article image"}
                width={imgWidth}
                height={imgHeight}
                sizes="(max-width: 1024px) 100vw, 80dvw"
                priority
                style={{ objectPosition }}
              />
              <h1 className="article__title">{blok.title ?? "Article"}</h1>
            </div>
          ) : (
            <h1 className="article__title article__title--no-hero">
              {blok.title ?? "Article"}
            </h1>
          )}
        </header>
        <div className="article__content">
          {blok.components?.map((nestedBlok) => (
            <div key={nestedBlok._uid} className="article__item">
              <StoryblokServerComponent blok={nestedBlok} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
