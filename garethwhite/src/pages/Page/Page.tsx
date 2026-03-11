import {
  SbBlokData,
  storyblokEditable,
  StoryblokServerComponent,
} from "@storyblok/react/rsc";

interface PageProps {
  blok?: SbBlokData & { body?: SbBlokData[] };
}

export default function Page({ blok }: PageProps) {
  if (!blok) return null;
  const body = blok.body ?? [];
  return (
    <main {...storyblokEditable(blok)}>
      {body.map((nestedBlok) => (
        <StoryblokServerComponent blok={nestedBlok} key={nestedBlok._uid} />
      ))}
    </main>
  );
}
