import { createFileRoute, Link } from "@tanstack/react-router";
import { Handshake, ArrowUpRight } from "lucide-react";
import { ContentPage, contentHead } from "@/components/site/content-page";
import { Button } from "@/components/ui/button";
import { siteSettingsQuery } from "@/lib/queries";

export const Route = createFileRoute("/partners")({
  head: () => contentHead("Our Partners & Affiliates", "Connect with JustMainlandNG about property partnerships and affiliate opportunities."),
  loader: ({ context }) => context.queryClient.ensureQueryData(siteSettingsQuery),
  component: PartnersPage,
});
function PartnersPage() {
  return <ContentPage label="Working together" title="Our partners & affiliates" intro="Strong relationships begin with shared standards.">
    <div className="border-y border-border py-12"><Handshake className="size-10 text-primary" /><h2 className="mt-6 text-2xl font-semibold">Partner with JustMainlandNG</h2><p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">For partnership or affiliate enquiries, tell us about your organisation and how you would like to work together.</p><Button asChild variant="outline" className="mt-7"><Link to="/contact">Discuss a partnership <ArrowUpRight className="size-4" /></Link></Button></div>
  </ContentPage>;
}