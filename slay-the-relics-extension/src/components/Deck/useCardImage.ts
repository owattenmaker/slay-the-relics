import { useEffect, useState } from "react";
import cardPreviews from "../../generated/card-previews.json";

const previews: Record<string, Record<string, string>> = cardPreviews;

const decoded = new Set<string>();
const pending = new Map<string, Promise<void>>();

// Share requests between duplicate cards, piles, and the enlarged card view.
function loadImage(url: string): Promise<void> {
  if (decoded.has(url)) return Promise.resolve();
  const existing = pending.get(url);
  if (existing) return existing;

  const request = new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      void image.decode().then(resolve, reject);
    };
    image.onerror = () => reject(new Error(`Could not load ${url}`));
    image.src = url;
  }).then(() => {
    decoded.add(url);
  });
  pending.set(url, request);
  // Failed downloads can be retried the next time the view opens.
  void request.then(
    () => pending.delete(url),
    () => pending.delete(url),
  );
  return request;
}

export function cardPreviewUrl(imageUrl: string, game?: string): string {
  const filename = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
  return previews[game === "sts2" ? "sts2" : "sts1"][filename] ?? imageUrl;
}

export function useCardImage(
  imageUrl: string,
  game: string | undefined,
  visible: boolean,
): string {
  const previewUrl = cardPreviewUrl(imageUrl, game);
  const [loadedUrl, setLoadedUrl] = useState<string>();

  // Decks/piles stay mounted while hidden: warm only their small previews.
  useEffect(() => {
    if (previewUrl === imageUrl) return;
    void loadImage(previewUrl).catch(() => {
      // New/modded cards may not have a preview in this extension release.
      // Their original image still loads when the view is opened.
    });
  }, [previewUrl, imageUrl]);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    void loadImage(imageUrl).then(
      () => {
        if (active) setLoadedUrl(imageUrl);
      },
      () => {
        // Keep the preview if the original download or decode fails.
      },
    );
    return () => {
      active = false;
    };
  }, [imageUrl, visible]);

  // Compare URLs so navigation/upgrades never show the previous card's art.
  return loadedUrl === imageUrl || decoded.has(imageUrl)
    ? imageUrl
    : previewUrl;
}
