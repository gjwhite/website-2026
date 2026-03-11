import { SbBlokData, storyblokEditable, StoryblokServerRichText } from "@storyblok/react/rsc";
import type { RichtextBlockStoryblok } from "@/types/storyblok-component-types";

interface RichtextBlockProps {
  blok: RichtextBlockStoryblok;
}

export default function RichtextBlock({ blok }: RichtextBlockProps) {
  if (!blok.richtext) return null;

  return (
    <section className="richtext-block" {...storyblokEditable(blok as SbBlokData)}>
      {blok.title && (
        <h2 className="richtext-block__title">{blok.title}</h2>
      )}
      <div className="richtext-block__content">
        <StoryblokServerRichText doc={blok.richtext as Parameters<typeof StoryblokServerRichText>[0]["doc"]} />
      </div>
    </section>
  );
}
