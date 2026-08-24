const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

export function getYouTubeVideoId(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let id: string | null = null;

    if (host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] ?? null;
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      else id = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] ?? null;
    }

    return id && YOUTUBE_ID.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function normalizeYouTubeUrl(value: string) {
  const id = getYouTubeVideoId(value);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

export function getYouTubeThumbnail(value?: string | null) {
  const id = getYouTubeVideoId(value);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}
