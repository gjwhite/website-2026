import Image from "next/image";

interface ArticleHeroImageProps {
  slug?: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  style?: React.CSSProperties;
}

export default function ArticleHeroImage({
  src,
  alt,
  width,
  height,
  sizes,
  style,
}: ArticleHeroImageProps) {
  return (
    <div className="article__image">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        style={style}
        priority
      />
    </div>
  );
}
