import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Compass, KeyRound, LineChart, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { SiteShell } from "@/components/site/site-shell";
import { Button } from "@/components/ui/button";
import { siteMediaQuery, siteSettingsQuery } from "@/lib/queries";
import { resolveSiteMediaUrl, SERVICES_GALLERY_FALLBACK } from "@/lib/site-media";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Real Estate Services — Buy, Sell, Rent & Invest | JustMainlandNG" },
      {
        name: "description",
        content:
          "Acquisition, disposal, letting and investment advisory for Nigerian real estate — with title verification and end-to-end deal management.",
      },
      { property: "og:title", content: "Real Estate Services | JustMainlandNG" },
      {
        property: "og:description",
        content: "Buy, sell, rent and invest with a licensed advisory team in Lagos and the Mainland.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(siteSettingsQuery),
      context.queryClient.ensureQueryData(siteMediaQuery),
    ]);
  },
  component: ServicesPage,
});

const SERVICES = [
  {
    icon: Building2,
    title: "Buy",
    body: "We shortlist only what survives our checks: title search, physical inspection, developer track record and resale outlook. You see five real options instead of fifty listings.",
    points: ["Title & document verification", "Inspection scheduling", "Price negotiation"],
  },
  {
    icon: Compass,
    title: "Sell",
    body: "Positioning, pricing and presentation that attract qualified buyers — plus a network of investors already looking for what you own.",
    points: ["Valuation & pricing strategy", "Photography and listing copy", "Buyer qualification"],
  },
  {
    icon: KeyRound,
    title: "Rent & Shortlet",
    body: "Long lets and shortlets across Lagos' prime corridors, managed from tenant screening through renewal.",
    points: ["Tenant vetting", "Lease documentation", "Renewals & rent reviews"],
  },
  {
    icon: LineChart,
    title: "Invest & Advisory",
    body: "Yield modelling, off-plan risk assessment and portfolio structuring for buyers treating property as an asset, not a purchase.",
    points: ["ROI & yield modelling", "Off-plan due diligence", "Portfolio structuring"],
  },
];

function ServicesSlider() {
  const { data: media } = useSuspenseQuery(siteMediaQuery);
  const items = media.services.length > 0 ? media.services : SERVICES_GALLERY_FALLBACK;
  const [index, setIndex] = useState(0);
  const count = items.length;

  useEffect(() => {
    if (count <= 1 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 5000);
    return () => clearInterval(timer);
  }, [count]);

  if (count === 0) return null;

  return (
    <div className="relative min-h-[280px] w-full overflow-hidden lg:min-h-full">
      {items.map((item, i) => (
        <img
          key={item.id}
          src={resolveSiteMediaUrl(item.image_url)}
          alt={item.title || "Lagos property scene"}
          loading="lazy"
          aria-hidden={i !== index}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      {count > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Show photo ${i + 1}`}
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
              className={`size-2.5 rounded-full transition-colors ${
                i === index ? "bg-primary-foreground" : "bg-primary-foreground/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ServicesPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-5 pb-10 pt-14 sm:px-8 lg:pt-20">
        <p className="text-xs uppercase tracking-[0.26em] text-accent">What we do</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
          Advisory that carries the deal, not just the listing.
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          From first viewing to handover, one team stays accountable for the outcome.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {SERVICES.map((service) => (
            <article key={service.title} className="rounded-2xl glass-panel p-7 sm:p-9">
              <service.icon className="size-7 text-accent" />
              <h2 className="mt-6 font-display text-2xl font-semibold">{service.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{service.body}</p>
              <ul className="mt-6 space-y-2 border-t border-border pt-5 text-sm text-muted-foreground">
                {service.points.map((point) => (
                  <li key={point} className="flex items-center gap-3">
                    <span className="size-1.5 rounded-full bg-accent" />
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
        <div className="grid items-stretch gap-0 overflow-hidden rounded-3xl glass-panel lg:grid-cols-2">
          <ServicesSlider />
          <div className="p-8 sm:p-12">
            <ShieldCheck className="size-7 text-accent" />
            <h2 className="mt-6 font-display text-3xl font-semibold">Due diligence by default</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Every property we present has been physically inspected and document-checked. If a
              title can't be verified, it never reaches your shortlist.
            </p>
            <Button asChild className="mt-8 rounded-full px-7">
              <Link to="/contact">Start a conversation</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
