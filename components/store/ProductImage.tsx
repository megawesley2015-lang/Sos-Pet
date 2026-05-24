"use client";

import { useState } from "react";

interface ProductImageProps {
  src: string;
  alt: string;
  fallbackIcon: string;
  className?: string;
}

export function ProductImage({ src, alt, fallbackIcon, className = "" }: ProductImageProps) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <div className={`flex h-full w-full items-center justify-center text-5xl ${className}`}>
        {fallbackIcon}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setBroken(true)}
      className={`h-full w-full object-cover transition duration-300 group-hover:scale-105 ${className}`}
    />
  );
}
