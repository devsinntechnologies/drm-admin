"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { resolveProductImageUrl } from "@/lib/product-image";

const FALLBACK = "/business/pic1.jpeg";

type Props = {
  src?: string | null;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
};

/** Product/category thumbnails — bypasses optimizer issues with /backend proxy URLs. */
export function ProductMediaImage({ src, alt, className, fill, sizes }: Props) {
  const [url, setUrl] = useState(() => resolveProductImageUrl(src));

  useEffect(() => {
    setUrl(resolveProductImageUrl(src));
  }, [src]);

  return (
    <Image
      src={url}
      alt={alt}
      fill={fill}
      sizes={sizes}
      unoptimized
      className={className}
      onError={() => {
        if (url !== FALLBACK) setUrl(FALLBACK);
      }}
    />
  );
}
