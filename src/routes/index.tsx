import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Compass, KeyRound, LineChart } from "lucide-react";

import { HomeSlider } from "@/components/site/home-slider";
import { Newsletter } from "@/components/site/newsletter";
import { BRAND_VALUES } from "@/lib/site-content";
import brandLogo from "@/assets/justmainlandng-logo.jpg";
import { PropertyCard } from "@/components/site/property-card";
import { Reveal } from "@/components/site/reveal";
import { SiteShell } from "@/components/site/site-shell";
import { Testimonials } from "@/components/site/testimonials";
import { Button } from "@/components/ui/button";
import { propertiesQuery, siteMediaQuery, siteSettingsQuery, testimonialsQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mainland Lagos Properties for Sale & Rent | JustMainlandNG" },
      {
        name: "description",
        content:
            "Find homes, apartments, land and commercial property for sale or rent across Mainland Lagos, Nigeria. Explore verified listings and local real estate guidance from JustMainlandNG.",
      },
          { property: "og:title", content: "Mainland Lagos Properties for Sale & Rent | JustMainlandNG" },
      {
        property: "og:description",
        content:
            "Search verified homes, apartments, land and commercial property for sale or rent in Mainland Lagos, Nigeria, with practical local real estate support.",
      },
      { property: "og:type", content: "website" },
          { property: "og:locale", content: "en_NG" },
          { property: "og:site_name", content: "JustMainlandNG" },
      { name: "twitter:card", content: "summary_large_image" },
          { name: "twitter:title", content: "Mainland Lagos Properties for Sale & Rent | JustMainlandNG" },
          { name: "twitter:description", content: "Find homes, apartments, land and commercial property for sale or rent across Mainland Lagos, Nigeria." },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(siteSettingsQuery),
      context.queryClient.ensureQueryData(siteMediaQuery),
      context.queryClient.ensureQueryData(propertiesQuery({ featuredOnly: true, limit: 6 })),
      context.queryClient.ensureQueryData(testimonialsQuery),
    ]);
  },
  component: HomePage,
});

const SERVICES = [
  { icon: Building2, title: "Buy", body: "Curated, title-verified homes and commercial assets." },
  { icon: KeyRound, title: "Rent", body: "Long lets and shortlets in Lagos' best addresses." },
  { icon: Compass, title: "Sell", body: "Positioning, pricing and qualified buyer access." },
  { icon: LineChart, title: "Invest", body: "Yield modelling and off-plan advisory you can trust." },
];

function HomePage() {
  
  const { data: featured } = useSuspenseQuery(propertiesQuery({ featuredOnly: true, limit: 6 }));
  const { data: testimonials } = useSuspenseQuery(testimonialsQuery);


  return (
    <SiteShell>
      <HomeSlider />

      <section className="overflow-hidden border-y border-border/70 bg-primary py-4 text-primary-foreground" aria-label="Services overview">
        <div className="flex w-max animate-marquee whitespace-nowrap font-display text-xs font-semibold uppercase tracking-[0.22em]">
          {[0, 1].map((group) => (
            <div key={group} className="flex items-center" aria-hidden={group === 1}>
              {Array.from({ length: 4 }).map((_, index) => (
                <span key={index} className="flex items-center gap-7 px-7">
                  Buy · Rent · Sell · Invest <span className="text-accent">◆</span> Lagos · Mainland
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-accent">Featured</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Signature listings
            </h2>
          </div>
          <Link
            to="/properties"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            View all properties <ArrowRight className="size-4" />
          </Link>
        </div>

        {featured.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">
            New listings are being prepared. Check back shortly.
          </p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.slice(0, 3).map((property, index) => (
              <Reveal key={property.id} delay={index * 90} once>
                <PropertyCard property={property} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service) => (
            <Reveal
              key={service.title}
              className="group rounded-2xl glass-panel p-6 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl hover:ring-1 hover:ring-accent/30"
              once
            >
              <service.icon className="size-6 text-accent transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:scale-110" />
              <h3 className="mt-5 font-display text-lg font-semibold transition-colors duration-300 group-hover:text-accent">
                {service.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
                {service.body}
              </p>
            </Reveal>
          ))}
        </div>
      </section>


      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <Reveal className="rounded-3xl glass-panel p-8 sm:p-12" from="left" once>
          <p className="text-xs uppercase tracking-[0.26em] text-accent">Who we are</p>
          <div className="mt-6 grid items-center gap-8 lg:grid-cols-[auto_1fr]">
            <div className="grid h-[6.2rem] w-[9rem] shrink-0 place-items-center animate-float">
              <img src={brandLogo} alt="JustMainlandNG Real Estate" width={358} height={247} className="size-full object-contain" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">
                JustMainland Property Investment Limited
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                JustMainland Property Investment Limited (JustMainlandNG) focuses on
                affordable and high-growth mainland Lagos property investment — from land banking
                to residential developments.
              </p>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <a href="tel:+2348115980894" className="hover:text-foreground">
                  Call: +234 811 598 0894
                </a>
                <a
                  href="https://wa.me/2349010503309"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-accent hover:underline"
                >
                  WhatsApp / Call: +234 901 050 3309
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8" aria-label="Discover JustMainlandNG">
        <p className="text-xs font-semibold uppercase text-primary">Discover JustMainlandNG</p>
        <h2 className="mt-3 font-display text-3xl font-bold">The people, purpose & perspective.</h2>
        <div className="mt-8 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { to: "/about", label: "About us", body: "Get to know JustMainland Property Investment Limited." },
            { to: "/values", label: "Mission, vision & core values", body: "Trustworthy. Professional. Modern. Reliable. Growth." },
            { to: "/partners", label: "Our partners & affiliates", body: "Start a conversation about working together." },
            { to: "/team", label: "Our team & agents", body: "Connect with the people behind your property enquiry." },
            { to: "/insights", label: "Blog, news & insights", body: "A considered perspective on property decisions." },
            { to: "/faq", label: "Frequently asked questions", body: "Property enquiries, inspections and your next step." },
          ].map((item, i) => <Reveal key={item.to} delay={i * 60} once>
            <Link to={item.to} className="group block border-b border-border py-7 transition-colors hover:border-primary">
              <div className="flex items-center justify-between gap-4"><h3 className="text-base font-semibold group-hover:text-primary">{item.label}</h3><ArrowRight className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" /></div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </Link>
          </Reveal>)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 border-y border-border py-10 md:grid-cols-2">
          <Reveal once><h2 className="text-2xl font-semibold text-primary">Our mission</h2><p className="mt-4 leading-relaxed text-muted-foreground">To help people make informed property decisions through professional guidance, clear communication and a dependable real estate experience on the mainland.</p></Reveal>
          <Reveal once><h2 className="text-2xl font-semibold text-primary">Our vision</h2><p className="mt-4 leading-relaxed text-muted-foreground">To be a trusted partner for mainland property ownership and investment, supporting lasting relationships and long-term growth.</p></Reveal>
        </div>
        <h2 className="mt-8 text-2xl font-semibold">Our core values</h2><div className="mt-5 flex flex-wrap gap-x-8 gap-y-4">{BRAND_VALUES.map(value=><span key={value.title} className="text-sm font-semibold text-primary transition-transform hover:-translate-y-1">{value.title}</span>)}</div>
      </section>
      <Testimonials items={testimonials} />
      <Newsletter />

      <section className="mx-auto max-w-7xl px-5 pb-8 sm:px-8">
        <Reveal className="overflow-hidden rounded-3xl glass-panel p-8 text-center sm:p-14" from="scale" once>
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            Ready to move on the right address?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Share your brief and budget. We'll return a verified shortlist with pricing, title
            status and projected yield.
          </p>
          <Button asChild size="lg" className="mt-8 rounded-full px-8">
            <Link to="/contact">Book a consultation</Link>
          </Button>
        </Reveal>
      </section>
    </SiteShell>
  );
}
