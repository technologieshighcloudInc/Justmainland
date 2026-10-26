import { mainlandCity, mainlandAerial } from './mainland-media';

export const FALLBACK_IMAGES = [
  mainlandCity,
  mainlandAerial,
];

/** Deterministic fallback so SSR and client render the same image. */
export function fallbackImage(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  }
  return FALLBACK_IMAGES[hash % FALLBACK_IMAGES.length] ?? mainlandCity;
}

/**
 * Stored images are object paths inside the private `property-images` bucket.
 * They are served through the read-only proxy route. Absolute URLs pass through.
 */
export function imageSrc(value: string | null | undefined, seed: string): string {
  if (!value) return fallbackImage(seed);
  if (/^https?:\/\//i.test(value) || value.startsWith("/")) return value;
  return `/api/public/property-image/${value.split("/").map(encodeURIComponent).join("/")}`;
}

const KIND_LABEL: Record<string, string> = {
  sale: "For Sale",
  rent: "For Rent",
  shortlet: "Shortlet",
};

const TYPE_LABEL: Record<string, string> = {
  house: "House",
  apartment: "Apartment",
  land: "Land",
  commercial: "Commercial",
  duplex: "Duplex",
  office: "Office",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  sold: "Sold",
  rented: "Rented",
};

export const kindLabel = (k: string) => KIND_LABEL[k] ?? k;
export const typeLabel = (t: string) => TYPE_LABEL[t] ?? t;
export const statusLabel = (s: string) => STATUS_LABEL[s] ?? s;

export const PROPERTY_KINDS = ["sale", "rent", "shortlet"] as const;
export const PROPERTY_TYPES = [
  "house",
  "apartment",
  "duplex",
  "land",
  "commercial",
  "office",
] as const;
export const PROPERTY_STATUSES = ["draft", "published", "sold", "rented"] as const;

export function formatPrice(
  price: number,
  currency = "NGN",
  period?: string | null,
): string {
  const symbol = currency === "NGN" ? "₦" : `${currency} `;
  let body: string;
  if (price >= 1_000_000_000) body = `${trim(price / 1_000_000_000)}B`;
  else if (price >= 1_000_000) body = `${trim(price / 1_000_000)}M`;
  else if (price >= 1_000) body = `${trim(price / 1_000)}K`;
  else body = `${price}`;
  return `${symbol}${body}${period ? ` / ${period}` : ""}`;
}

export function formatPriceFull(price: number, currency = "NGN"): string {
  const symbol = currency === "NGN" ? "₦" : `${currency} `;
  return `${symbol}${new Intl.NumberFormat("en-NG").format(price)}`;
}

function trim(value: number): string {
  return value.toFixed(value % 1 === 0 ? 0 : 1).replace(/\.0$/, "");
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}
