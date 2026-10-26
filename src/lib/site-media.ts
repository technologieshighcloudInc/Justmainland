import { mainlandAerial, mainlandPhotos } from './mainland-media';

/**
 * Resolves a stored media reference to a browser-loadable URL.
 *
 * Legacy/seed rows and admin uploads differ:
 * - Asset pointers already start with "/" and load directly.
 * - Objects uploaded to the private `site-media` bucket are stored as plain
 *   object paths and must go through the read-only public proxy.
 */
export function resolveSiteMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed)) return trimmed;
  return `/api/public/site-media/${trimmed.replace(/^\/+/, "")}`;
}

export type GalleryItem = {
  id: string;
  title: string;
  image_url: string;
};

/** Shown when a gallery section has no rows yet, so layouts never break. */
export const HOME_GALLERY_FALLBACK: GalleryItem[] = [
  { id: "fallback-home-1", title: "Completed property from JustMainlandNG", image_url: mainlandPhotos[0] ?? mainlandAerial },
  { id: "fallback-home-2", title: "Property development from JustMainlandNG", image_url: mainlandPhotos[1] ?? mainlandAerial },
  { id: "fallback-home-3", title: "Maryland apartment promotion", image_url: mainlandPhotos[2] ?? mainlandAerial },
  { id: "fallback-home-4", title: "JustMainlandNG property investment promotion", image_url: mainlandPhotos[3] ?? mainlandAerial },
];

export const SERVICES_GALLERY_FALLBACK: GalleryItem[] = [
  { id: "fallback-services-1", title: "Aerial view of Lagos and its neighbourhoods", image_url: mainlandAerial },
  { id: "fallback-services-2", title: "Allen Avenue intersection in Ikeja, Lagos", image_url: mainlandAerial },
  { id: "fallback-services-3", title: "Completed property from JustMainlandNG", image_url: mainlandPhotos[0] ?? mainlandAerial },
];
