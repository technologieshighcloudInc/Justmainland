import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Phone, MessageCircle } from "lucide-react";
import { ContentPage, contentHead } from "@/components/site/content-page";
import { Button } from "@/components/ui/button";
import { siteSettingsQuery } from "@/lib/queries";

export const Route = createFileRoute("/team")({
  head: () => contentHead("Our Team & Agents", "Speak to the JustMainlandNG team about your property search, enquiries and inspection requests."),
  loader: ({ context }) => context.queryClient.ensureQueryData(siteSettingsQuery),
  component: TeamPage,
});
function TeamPage() {
  return <ContentPage label="People & property" title="Our team & agents" intro="A conversation with the right people can make your next property decision clearer.">
    <div className="grid gap-10 border-y border-border py-12 md:grid-cols-2"><div><Users className="size-10 text-primary" /><h2 className="mt-6 text-2xl font-semibold">JustMainlandNG team</h2><p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">Share your property requirements with our team, or get in touch about a listing and an inspection request.</p><Button asChild className="mt-7"><Link to="/contact">Send an enquiry</Link></Button></div><div className="space-y-6 self-center"><a className="flex items-center gap-4 border-b border-border pb-6 text-lg font-semibold transition-colors hover:text-primary" href="tel:+2348115980894"><Phone className="size-5 text-primary" />+234 811 598 0894</a><a className="flex items-center gap-4 text-lg font-semibold transition-colors hover:text-primary" href="https://wa.me/2349010503309" target="_blank" rel="noreferrer noopener"><MessageCircle className="size-5 text-primary" />+234 901 050 3309</a></div></div>
  </ContentPage>;
}