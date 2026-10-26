import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { ContentPage, contentHead } from "@/components/site/content-page";
import { Reveal } from "@/components/site/reveal";
import { siteSettingsQuery } from "@/lib/queries";
import { BRAND_VALUES } from "@/lib/site-content";

export const Route = createFileRoute("/values")({
  head: () => contentHead("Mission, Vision & Core Values", "The purpose and principles behind JustMainlandNG, your trusted real estate partner on the mainland."),
  loader: ({ context }) => context.queryClient.ensureQueryData(siteSettingsQuery),
  component: ValuesPage,
});

function ValuesPage() {
  return <ContentPage label="Our purpose" title="Mission, vision & core values" intro="Your Trusted Real Estate Partner on the Mainland.">
    <div className="grid gap-10 border-y border-border py-10 md:grid-cols-2">
      <Reveal once><h2 className="font-display text-2xl font-bold text-primary">Our mission</h2><p className="mt-4 leading-relaxed text-muted-foreground">To help people make informed property decisions through professional guidance, clear communication and a dependable real estate experience on the mainland.</p></Reveal>
      <Reveal once delay={100}><h2 className="font-display text-2xl font-bold text-primary">Our vision</h2><p className="mt-4 leading-relaxed text-muted-foreground">To be a trusted partner for mainland property ownership and investment, supporting lasting relationships and long-term growth.</p></Reveal>
    </div>
    <h2 className="mt-12 font-display text-2xl font-bold">Our core values</h2>
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{BRAND_VALUES.map((value, i) => <Reveal key={value.title} delay={i * 60} once><article className="h-full rounded-lg border border-border bg-card p-7 transition-transform duration-300 hover:-translate-y-1"><ShieldCheck className="size-6 text-primary" /><h3 className="mt-5 text-lg font-semibold">{value.title}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{value.body}</p></article></Reveal>)}</div>
  </ContentPage>;
}