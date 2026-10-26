import { Link } from "@tanstack/react-router";
import { Bath, BedDouble, MapPin, Ruler } from "lucide-react";

import { formatPrice, imageSrc, kindLabel, typeLabel } from "@/lib/format";

export type PropertyCardData = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  price: number;
  currency: string;
  price_period: string | null;
  listing_kind: string;
  property_type: string;
  status: string;
  bedrooms: number;
  bathrooms: number;
  size_sqm: number | null;
  area: string;
  city: string;
  cover_image_url: string | null;
  is_featured: boolean;
};

export function PropertyCard({ property }: { property: PropertyCardData }) {
  const unavailable = property.status === "sold" || property.status === "rented";

  return (
    <Link
      to="/properties/$slug"
      params={{ slug: property.slug }}
      className="group relative flex flex-col overflow-hidden rounded-lg glass-panel transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:ring-1 hover:ring-primary/30"
    >
      <div className="relative aspect-4/3 overflow-hidden">
        <img
          src={imageSrc(property.cover_image_url, property.slug)}
          alt={property.cover_image_url ? property.title : 'Lagos neighbourhood photograph — property photos pending'}
          loading="lazy"
          width={1280}
          height={960}
          className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-linear-to-t from-foreground/85 via-foreground/10 to-transparent" />
        <div className="absolute left-4 top-4 flex gap-2">
          <span className="rounded-full bg-background/75 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-accent backdrop-blur">
            {kindLabel(property.listing_kind)}
          </span>
          {property.is_featured ? (
            <span className="rounded-full bg-primary/85 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-primary-foreground backdrop-blur">
              Featured
            </span>
          ) : null}
        </div>
        {unavailable ? (
          <span className="absolute right-4 top-4 rounded-full bg-destructive/85 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-destructive-foreground">
            {property.status}
          </span>
        ) : null}
        {!property.cover_image_url && <span className="absolute right-3 top-14 rounded-md bg-background/90 px-2 py-1 text-[0.6rem] text-foreground">Area imagery</span>}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <span className="font-display text-xl font-semibold text-primary-foreground">
            {formatPrice(property.price, property.currency, property.price_period)}
          </span>
          <span className="rounded-md border border-primary-foreground/25 bg-foreground/65 px-2 py-1 text-[0.65rem] uppercase tracking-[0.14em] text-primary-foreground backdrop-blur">
            {typeLabel(property.property_type)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-semibold leading-snug transition-colors group-hover:text-accent">
          {property.title}
        </h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5 text-accent" />
          {property.area}, {property.city}
        </p>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {property.summary}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border/70 pt-4 text-xs text-muted-foreground">
          {property.bedrooms > 0 ? (
            <span className="flex items-center gap-1.5">
              <BedDouble className="size-4 text-accent/80" />
              {property.bedrooms} bed
            </span>
          ) : null}
          {property.bathrooms > 0 ? (
            <span className="flex items-center gap-1.5">
              <Bath className="size-4 text-accent/80" />
              {property.bathrooms} bath
            </span>
          ) : null}
          {property.size_sqm ? (
            <span className="flex items-center gap-1.5">
              <Ruler className="size-4 text-accent/80" />
              {new Intl.NumberFormat("en-NG").format(property.size_sqm)} m²
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
