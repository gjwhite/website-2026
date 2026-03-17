import { SbBlokData, storyblokEditable } from "@storyblok/react/rsc";
import Image from "next/image";
import type { PictureStoryblok } from "@/types/storyblok-component-types";
import {
  type StoryblokAssetLike,
  storyblokImageUrl,
  storyblokAssetObjectPosition,
} from "@/utils/storyblokImage";
import "./Picture.css";

const MAX_EDGE = 1920;

interface PictureProps {
  blok?: PictureStoryblok;
}

export default function Picture({ blok }: PictureProps) {
  if (!blok) return null;

  const image = blok.image as StoryblokAssetLike | undefined;
  const w = image?.width ?? 1200;
  const h = image?.height ?? 800;
  const maxEdge = Math.min(Math.max(w, h), MAX_EDGE);
  const imageSrc = storyblokImageUrl(image, { width: maxEdge, height: 0 });
  const objectPosition = storyblokAssetObjectPosition(image, {
    width: w,
    height: h,
  });

  return (
    <figure
      className={`picture${imageSrc ? "" : " picture--empty"}`}
      {...storyblokEditable(blok as SbBlokData)}
    >
      {imageSrc ? (
        <div className="picture__frame">
          <Image
            className="picture__image"
            src={imageSrc}
            alt={image?.alt ?? "Image"}
            width={w}
            height={h}
            sizes="(max-width: 1024px) 100vw, min(90vw, 72rem)"
            style={{ objectPosition }}
          />
        </div>
      ) : null}
    </figure>
  );
}
