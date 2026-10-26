import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { PropertyCard } from "@/components/site/property-card";
import { SiteShell } from "@/components/site/site-shell";
import { Button } from "@/components/ui/button";
import { PAGE_SIZE, visibleResults } from "@/lib/visitor-rules";
import { Input } from "@/components/ui/input";
import { PROPERTY_KINDS, PROPERTY_TYPES, kindLabel, typeLabel } from "@/lib/format";
import { propertiesQuery, siteSettingsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/properties/")({
  head: () => ({
    meta: [
      { title: "Mainland Lagos Property for Sale & Rent | JustMainlandNG" },
      {
        name: "description",
        content:
            "Browse homes, apartments, duplexes, land and commercial property for sale or rent across Mainland Lagos, Nigeria. Search local listings by property type, area and budget.",
      },
          { property: "og:title", content: "Mainland Lagos Property for Sale & Rent | JustMainlandNG" },
      {
        property: "og:description",
        content: "Search verified Mainland Lagos property listings by type, location and budget.",
      },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_NG" },
      { property: "og:site_name", content: "JustMainlandNG" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Mainland Lagos Property for Sale & Rent | JustMainlandNG" },
      { name: "twitter:description", content: "Browse homes, apartments, land and commercial property for sale or rent across Mainland Lagos, Nigeria." },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(siteSettingsQuery),
      context.queryClient.ensureQueryData(propertiesQuery({ limit: 48 })),
    ]);
  },
  component: PropertiesPage,
});

function PropertiesPage() {
  const { data: properties } = useSuspenseQuery(propertiesQuery({ limit: 48 }));
  const [kind, setKind] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const cities = useMemo(
    () => Array.from(new Set(properties.map((p) => p.city).filter(Boolean))).sort(),
    [properties],
  );

  const filtered = properties.filter((p) => {
    if (kind && p.listing_kind !== kind) return false;
    if (type && p.property_type !== type) return false;
    if (city && p.city !== city) return false;
    if (search) {
      const term = search.toLowerCase();
      const haystack = `${p.title} ${p.area} ${p.city} ${p.summary}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-5 pb-6 pt-14 sm:px-8 lg:pt-20">
        <p className="text-xs uppercase tracking-[0.26em] text-accent">Portfolio</p>
        <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
          Available properties
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Every listing here is inspected and title-checked by our team before it goes live.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="rounded-2xl glass-panel p-5 sm:p-6">
          <Input
            value={search}
            onChange={(e) => {setSearch(e.target.value);setVisibleCount(PAGE_SIZE);}}
            placeholder="Search by title, area or city…"
            className="mb-5"
            aria-label="Search properties"
          />
          <div className="flex flex-col gap-4">
            <FilterRow
              label="Listing"
              options={[{ value: "", label: "All" }].concat(
                PROPERTY_KINDS.map((k) => ({ value: k, label: kindLabel(k) })),
              )}
              value={kind}
              onChange={(v)=>{setKind(v);setVisibleCount(PAGE_SIZE);}}
            />
            <FilterRow
              label="Type"
              options={[{ value: "", label: "All" }].concat(
                PROPERTY_TYPES.map((t) => ({ value: t, label: typeLabel(t) })),
              )}
              value={type}
              onChange={(v)=>{setType(v);setVisibleCount(PAGE_SIZE);}}
            />
            {cities.length > 1 ? (
              <FilterRow
                label="City"
                options={[{ value: "", label: "All" }].concat(
                  cities.map((c) => ({ value: c, label: c })),
                )}
                value={city}
                onChange={(v)=>{setCity(v);setVisibleCount(PAGE_SIZE);}}
              />
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <p className="mb-6 text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "property" : "properties"}
        </p>
        {filtered.length === 0 ? (
          <div className="rounded-2xl glass-panel p-10 text-center text-sm text-muted-foreground">
            Nothing matches those filters yet. Try widening your search.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleResults(filtered, visibleCount).map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
        {visibleCount < filtered.length && <div className="mt-8 flex justify-center"><Button variant="outline" onClick={()=>setVisibleCount(count=>count+PAGE_SIZE)}>Load more properties</Button></div>}
      </section>
    </SiteShell>
  );
}

function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 w-16 shrink-0 text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      {options.map((option) => (
        <Button variant="outline"
          key={option.value || "all"}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full border px-4 py-1.5 text-xs transition-colors",
            value === option.value
              ? "border-accent/60 bg-accent/15 text-accent"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
