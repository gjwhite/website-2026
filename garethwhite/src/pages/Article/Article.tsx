import {
  SbBlokData,
  storyblokEditable,
  StoryblokServerComponent,
} from "@storyblok/react/rsc";
import type { ArticleStoryblok } from "@/types/storyblok-component-types";
import {
  type StoryblokAssetLike,
  storyblokImageUrl,
  storyblokAssetObjectPosition,
} from "@/utils/storyblokImage";
import ArticleHeroImage from "@/pages/Article/ArticleHeroImage";
import "./Article.css";

interface ArticleProps {
  blok?: ArticleStoryblok;
}

export default function Article({ blok }: ArticleProps) {
  if (!blok) return null;
  const image = blok.feature_image as StoryblokAssetLike | undefined;
  const imageSrc = storyblokImageUrl(image, { width: 2460, height: 590 });
  const objectPosition = storyblokAssetObjectPosition(image, {
    width: image?.width ?? 800,
    height: image?.height ?? 450,
  });
  return (
    <section {...storyblokEditable(blok as SbBlokData)}>
      <header className="article__header">
        <h1 className="article__title">{blok.title ?? "Article"}</h1>
        <div className="article__image-wrapper">
          {imageSrc ? (
            <ArticleHeroImage
              src={imageSrc}
              alt={image?.alt ?? blok.title ?? "Article image"}
              width={2460}
              height={590}
              sizes="(max-width: 1024px) 100vw, 1230px"
              style={{ objectFit: "cover", objectPosition }}
            />
          ) : null}
        </div>
      </header>

      {blok.components?.map((nestedBlok) => (
        <StoryblokServerComponent blok={nestedBlok} key={nestedBlok._uid} />
      ))}
    </section>
  );
}
