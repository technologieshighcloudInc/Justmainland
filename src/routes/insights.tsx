import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { mainlandCity as estateAerial } from "@/lib/mainland-media";
import { ContentPage, contentHead } from "@/components/site/content-page";
import { Reveal } from "@/components/site/reveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { siteSettingsQuery } from "@/lib/queries";
import { INSIGHTS } from "@/lib/site-content";

export const Route = createFileRoute("/insights")({
  head: () => contentHead(
    "Lagos Mainland Property News & Real Estate Insights",
    "Read JustMainlandNG news and practical insights on buying, renting and investing in Mainland Lagos property, including home searches, inspections and real estate decisions in Lagos, Nigeria.",
  ),
  loader: ({ context }) => context.queryClient.ensureQueryData(siteSettingsQuery),
  component: InsightsPage,
});
function InsightsPage() {
  return <ContentPage label="The property journal" title="News & insights" intro="Considered reading for your property journey.">
    <img src={estateAerial} alt="Aerial photograph of Lagos neighbourhoods" className="mb-8 aspect-[3/1] w-full rounded-lg object-cover" />
    <Accordion type="single" collapsible>{INSIGHTS.map((article, i) => <Reveal key={article.title} delay={i * 60} once><AccordionItem value={`article-${i}`}><p className="pt-6 text-xs font-semibold uppercase text-primary">{article.category}</p><AccordionTrigger className="gap-6 py-5 text-xl font-semibold">{article.title}</AccordionTrigger><AccordionContent className="max-w-3xl text-base leading-relaxed text-muted-foreground">{article.body}</AccordionContent></AccordionItem></Reveal>)}</Accordion>
    <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground"><ArrowUpRight className="size-4" />General information, not legal or financial advice.</p>
  </ContentPage>;
}