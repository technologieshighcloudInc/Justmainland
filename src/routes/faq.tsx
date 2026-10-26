import { createFileRoute } from "@tanstack/react-router";
import { ContentPage, contentHead } from "@/components/site/content-page";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { siteSettingsQuery } from "@/lib/queries";
import { FAQS } from "@/lib/site-content";

export const Route = createFileRoute("/faq")({
  head: () => contentHead("Frequently Asked Questions", "Answers to common questions about property enquiries, inspections and contacting JustMainlandNG."),
  loader: ({ context }) => context.queryClient.ensureQueryData(siteSettingsQuery),
  component: FAQPage,
});
function FAQPage() {
  return <ContentPage label="Your questions" title="Frequently asked questions" intro="A little clarity before your next move."><Accordion type="single" collapsible className="max-w-3xl">{FAQS.map((faq, i) => <AccordionItem key={faq.question} value={`faq-${i}`}><AccordionTrigger className="py-6 text-base font-semibold">{faq.question}</AccordionTrigger><AccordionContent className="max-w-2xl leading-relaxed text-muted-foreground">{faq.answer}</AccordionContent></AccordionItem>)}</Accordion></ContentPage>;
}