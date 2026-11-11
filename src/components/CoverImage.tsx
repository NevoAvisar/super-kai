"use client";

import Image, { type ImageLoader } from "next/image";

const unsplashLoader: ImageLoader = ({ src, width, quality }) =>
  `${src}${src.includes("?") ? "&" : "?"}w=${width}&q=${quality ?? 75}&fit=crop&crop=entropy&auto=format`;

/** Full-bleed photo for tiles/hero areas (parent must be `relative`). */
export function CoverImage({ src, alt, priority }: { src: string | null; alt: string; priority?: boolean }) {
  if (!src) return <div className="absolute inset-0 bg-gradient-to-br from-[#f6e3d6] to-[#ecc9b2]" />;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      sizes="(min-width: 768px) 25vw, 50vw"
      loader={src.startsWith("https://images.unsplash.com/") ? unsplashLoader : undefined}
      className="object-cover transition duration-700 group-hover:scale-105"
    />
  );
}
