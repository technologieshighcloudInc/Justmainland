import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

import { mainlandCity as facadeDetail } from "@/lib/mainland-media";
import { SiteShell } from "@/components/site/site-shell";
import { Button } from "@/components/ui/button";
import { siteSettingsQuery } from "@/lib/queries";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About JustMainlandNG | RealEstateJagaban" },
      {
        name: "description",
        content:
          "JustMainlandNG is a Nigerian real estate advisory firm helping clients acquire, let and grow verified property portfolios in Lagos and the Mainland.",
      },
      { property: "og:title", content: "About JustMainlandNG" },
      {
        property: "og:description",
        content: "The team, the standards and the offices behind RealEstateJagaban.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(siteSettingsQuery),
  component: AboutPage,
});

const VALUES = [
  {
    title: "Verify first",
    body: "No listing reaches a client before title documents and physical condition are checked.",
  },
  {
    title: "Speak plainly",
    body: "Real numbers, real risks, real timelines — even when the answer is 'don't buy this'.",
  },
  {
    title: "Stay past closing",
    body: "Handover, documentation and management support continue after the deal signs.",
  },
];

function AboutPage() {
  const { data: settings } = useSuspenseQuery(siteSettingsQuery);

  return (
    <SiteShell>
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-12 pt-14 sm:px-8 lg:grid-cols-2 lg:pt-20">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-accent">Who we are</p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Built for buyers who ask harder questions.
          </h1>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {settings["about_body"] ??
              "JustMainlandNG — known across the market as RealEstateJagaban — advises individuals, diaspora buyers and institutions on Nigerian real estate. We source off-market opportunities, verify every document, negotiate hard and stay involved through handover."}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Our focus is Mainland Lagos: homes, land, rentals and commercial property, with local guidance for your next move.
          </p>
        </div>
        <div className="overflow-hidden rounded-3xl glass-panel glow-ring">
          <img
            src={facadeDetail}
            alt="Lagos city neighbourhoods from above"
            width={1280}
            height={1280}
            className="aspect-square size-full object-cover"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-6 sm:grid-cols-3">
          {VALUES.map((value) => (
            <div key={value.title} className="rounded-2xl glass-panel p-7">
              <h2 className="font-display text-xl font-semibold">{value.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{value.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <h2 className="font-display text-3xl font-semibold">Offices</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {[
            { label: "Lagos", value: settings["office_lagos"] ?? "Lekki Phase 1, Lagos" },
          ].map((office) => (
            <div key={office.label} className="rounded-2xl glass-panel p-7">
              <MapPin className="size-5 text-accent" />
              <h3 className="mt-4 font-display text-lg font-semibold">{office.label}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{office.value}</p>
            </div>
          ))}
        </div>
        <Button asChild className="mt-10 rounded-full px-7">
          <Link to="/contact">Speak with the team</Link>
        </Button>
        <div className="mt-6 flex flex-wrap gap-6 text-sm font-semibold text-primary">
          <Link to="/values">Mission, vision & core values</Link>
          <Link to="/team">Our team & agents</Link>
          <Link to="/partners">Our partners & affiliates</Link>
        </div>
      </section>
    </SiteShell>
  );
}
