import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Bath, BedDouble, Check, MapPin, Ruler } from "lucide-react";
import { useState } from "react";

import { EnquiryForm } from "@/components/site/enquiry-form";
import { InspectionForm } from "@/components/site/inspection-form";
import { PropertyCard } from "@/components/site/property-card";
import { SiteShell } from "@/components/site/site-shell";
import { formatPriceFull, imageSrc, kindLabel, statusLabel, typeLabel } from "@/lib/format";
import { propertyQuery, siteSettingsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/properties/$slug")({
  loader: async ({ context, params }) => {
    const [, property] = await Promise.all([
      context.queryClient.ensureQueryData(siteSettingsQuery),
      context.queryClient.ensureQueryData(propertyQuery(params.slug)),
    ]);
    if (!property) throw notFound();
    return { title: property.property.title, summary: property.property.summary };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Property unavailable | JustMainlandNG" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const description =
      loaderData.summary || "View full details, pricing and specifications for this listing.";
    return {
      meta: [
        { title: `${loaderData.title} | JustMainlandNG` },
        { name: "description", content: description.slice(0, 155) },
        { property: "og:title", content: loaderData.title },
        { property: "og:description", content: description.slice(0, 155) },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: PropertyDetail,
  notFoundComponent: PropertyMissing,
});

function PropertyMissing() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-5 py-28 text-center sm:px-8">
        <h1 className="font-display text-4xl font-semibold">Listing not available</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          This property may have been taken down or sold.
        </p>
        <Link
          to="/properties"
          className="mt-8 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Browse all properties
        </Link>
      </div>
    </SiteShell>
  );
}

function PropertyDetail() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(propertyQuery(slug));
  const [activeIndex, setActiveIndex] = useState(0);

  if (!data) return <PropertyMissing />;

  const { property, images, related } = data;
  const gallery = [
    { id: "cover", image_url: property.cover_image_url ?? "", caption: property.title },
    ...images,
  ].filter((image, index) => index === 0 || image.image_url);
  const active = gallery[Math.min(activeIndex, gallery.length - 1)]!;
  const unavailable = property.status === "sold" || property.status === "rented";

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-5 pt-10 sm:px-8">
        <Link
          to="/properties"
          className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
        >
          ← All properties
        </Link>
      </div>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1.55fr_1fr] lg:gap-14">
        <div>
          <div className="overflow-hidden rounded-3xl glass-panel">
            <img
              src={imageSrc(active.image_url, `${property.slug}-${activeIndex}`)}
              alt={active.caption || property.title}
              width={1600}
              height={1067}
              className="aspect-3/2 size-full object-cover"
            />
          </div>
          {gallery.length > 1 ? (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {gallery.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`View image ${index + 1}`}
                  className={cn(
                    "size-20 shrink-0 overflow-hidden rounded-xl border transition-colors",
                    index === activeIndex ? "border-accent" : "border-border",
                  )}
                >
                  <img
                    src={imageSrc(image.image_url, `${property.slug}-${index}`)}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-10">
            <h2 className="font-display text-2xl font-semibold">About this property</h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {property.description || property.summary}
            </p>
          </div>

          {property.features.length > 0 ? (
            <div className="mt-10">
              <h2 className="font-display text-2xl font-semibold">Features</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {property.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl glass-panel p-6 sm:p-7">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-accent/15 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-accent">
                {kindLabel(property.listing_kind)}
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
                {typeLabel(property.property_type)}
              </span>
              {unavailable ? (
                <span className="rounded-full bg-destructive/20 px-3 py-1 text-[0.65rem] uppercase tracking-[0.16em] text-destructive">
                  {statusLabel(property.status)}
                </span>
              ) : null}
            </div>

            <h1 className="mt-5 font-display text-3xl font-semibold leading-tight">
              {property.title}
            </h1>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 text-accent" />
              {[property.area, property.city].filter(Boolean).join(", ")}
            </p>

            <p className="mt-6 font-display text-3xl font-semibold text-gradient">
              {formatPriceFull(Number(property.price), property.currency)}
              {property.price_period ? (
                <span className="ml-1 text-base text-muted-foreground">
                  / {property.price_period}
                </span>
              ) : null}
            </p>

            <dl className="mt-7 grid grid-cols-3 gap-4 border-t border-border pt-6 text-center">
              <Spec icon={BedDouble} value={property.bedrooms} label="Beds" />
              <Spec icon={Bath} value={property.bathrooms} label="Baths" />
              <Spec
                icon={Ruler}
                value={property.size_sqm ? `${Number(property.size_sqm)}` : "—"}
                label="sqm"
              />
            </dl>
          </div>

          <div className="mt-6">
            <h2 className="mb-4 font-display text-lg font-semibold">Book an inspection</h2>
            <InspectionForm propertyId={property.id} propertyTitle={property.title} />
          </div>

          <div className="mt-6">
            <h2 className="mb-4 font-display text-lg font-semibold">Enquire about this property</h2>
            <EnquiryForm
              propertyId={property.id}
              defaultSubject={`Enquiry: ${property.title}`}
            />
          </div>
        </aside>
      </section>

      {related.length > 0 ? (
        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <h2 className="font-display text-2xl font-semibold">More in {property.city}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <PropertyCard key={item.id} property={item} />
            ))}
          </div>
        </section>
      ) : null}
    </SiteShell>
  );
}

function Spec({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof BedDouble;
  value: number | string;
  label: string;
}) {
  return (
    <div>
      <Icon className="mx-auto size-4 text-accent" />
      <dt className="mt-2 font-display text-lg font-semibold">{value}</dt>
      <dd className="text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">{label}</dd>
    </div>
  );
}
