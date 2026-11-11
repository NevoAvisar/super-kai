"use client";

import Image, { type ImageLoader } from "next/image";
import { useState } from "react";

const SIZES = "(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 480px) 50vw, 100vw";

/** Serve Unsplash photos straight from Unsplash's imgix CDN, cropped to the card's 4:3 frame. */
const unsplashLoader: ImageLoader = ({ src, width, quality }) =>
  `${src}${src.includes("?") ? "&" : "?"}w=${width}&q=${quality ?? 75}&fit=crop&crop=entropy&ar=4:3&auto=format`;

const isUnsplash = (src: string) => src.startsWith("https://images.unsplash.com/");

interface Props {
  name: string;
  imageUrl: string | null;
  credit?: { name: string; url: string } | null;
  icon: string | null;
  priority?: boolean;
}

export function ProductImage({ name, imageUrl, credit, icon, priority }: Props) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    // Last-resort fallback (every seeded dish has a photo, enforced by a test).
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f6e3d6] to-[#ecc9b2]">
        <span className="text-6xl" aria-hidden>{icon}</span>
      </div>
    );
  }

  return (
    <>
      <Image
        src={imageUrl}
        alt={name}
        fill
        sizes={SIZES}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        loader={isUnsplash(imageUrl) ? unsplashLoader : undefined}
        onError={() => setFailed(true)}
        className="object-cover transition duration-700 group-hover:scale-105"
      />
      {/* Warm grade so photos from different photographers read as one shoot */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent mix-blend-multiply" />
      {credit && (
        <a
          href={credit.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 end-3 z-10 text-[10px] text-white/80 opacity-0 drop-shadow transition hover:text-white group-hover:opacity-100"
        >
          📷 {credit.name} / Unsplash
        </a>
      )}
    </>
  );
}
