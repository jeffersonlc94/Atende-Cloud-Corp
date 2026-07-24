"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";

export function FotoThumb({
  url,
  alt,
  className,
}: {
  url: string;
  alt: string;
  className: string;
}) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className={`flex items-center justify-center rounded-md border bg-muted text-muted-foreground ${className}`}>
        <ImageOff className="h-5 w-5" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} className={`rounded-md border object-cover ${className}`} onError={() => setError(true)} />
  );
}
