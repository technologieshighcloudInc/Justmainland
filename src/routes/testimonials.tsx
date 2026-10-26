import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ContentPage, contentHead } from "@/components/site/content-page";
import { Testimonials } from "@/components/site/testimonials";
import { siteSettingsQuery, testimonialsQuery } from "@/lib/queries";

export const Route = createFileRoute("/testimonials")({
  head: () => contentHead("Testimonials & Client Reviews", "Read published client reviews on JustMainlandNG."),
  loader: async ({ context }) => { await Promise.all([context.queryClient.ensureQueryData(siteSettingsQuery), context.queryClient.ensureQueryData(testimonialsQuery)]); },
  component: ReviewsPage,
});
function ReviewsPage() {
  const { data: reviews } = useSuspenseQuery(testimonialsQuery);
  return <ContentPage label="Client voices" title="Testimonials & client reviews" intro="Experiences shared with JustMainlandNG.">{reviews.length ? <Testimonials items={reviews} /> : <p className="border-y border-border py-10 text-muted-foreground">No client reviews published yet.</p>}</ContentPage>;
}