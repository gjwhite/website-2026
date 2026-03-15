import { SbBlokData, storyblokEditable } from "@storyblok/react/rsc";
import type { FrontPageStoryblok } from "@/types/storyblok-component-types";
import type { FeatureStoryblok } from "@/types/storyblok-component-types";
import Feature from "@/components/Feature/Feature";
import "./frontpage.css";

interface FrontPageProps {
  blok?: FrontPageStoryblok;
}

export default function FrontPage({ blok }: FrontPageProps) {
  if (!blok) return null;
  return (
    <main {...storyblokEditable(blok as SbBlokData)}>
      <section className="features-section">
        <h1>{blok.title ?? "Front Page"}</h1>
        <ul className="features-list load-animate">
          {blok.features?.map((item, i) => {
            if (typeof item === "string") return null;
            const key = item.uuid ?? item.content?._uid ?? i;
            const articleContent = item.content as
              | { title?: string; feature_image?: { src?: string; filename?: string | null; width?: number | null; height?: number | null; alt?: string | null } }
              | undefined;
            const articleSlug =
              (item as { full_slug?: string; slug?: string }).full_slug ??
              (item as { full_slug?: string; slug?: string }).slug ??
              "";
            const featureBlok: FeatureStoryblok = {
              component: "feature",
              _uid: String(key),
              name: articleContent?.title ?? item.name ?? "",
              link: articleSlug ? `/${articleSlug}` : undefined,
              image: articleContent?.feature_image,
            };
            return (
              <li key={key}>
                <Feature blok={featureBlok} />
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
