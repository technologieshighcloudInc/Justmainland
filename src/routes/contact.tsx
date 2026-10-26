import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { InspectionForm } from "@/components/site/inspection-form";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { SiteShell } from "@/components/site/site-shell";
import { siteSettingsQuery } from "@/lib/queries";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact JustMainlandNG | Mainland Lagos Real Estate" },
      {
        name: "description",
        content:
          "Send your property brief to JustMainlandNG. Call, email or WhatsApp our Mainland Lagos advisory desks.",
      },
      { property: "og:title", content: "Contact JustMainlandNG" },
      {
        property: "og:description",
        content: "Share your brief and budget — we respond within one business day.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(siteSettingsQuery),
  component: ContactPage,
});

function ContactPage() {
  const { data: settings } = useSuspenseQuery(siteSettingsQuery);
  const phone = settings["contact_phone"] ?? "";
  const whatsapp = (settings["whatsapp_number"] ?? phone).replace(/[^0-9]/g, "");

  return (
    <SiteShell>
      <section className="mx-auto grid min-w-0 max-w-7xl gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1fr_1.2fr] lg:pt-20">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.26em] text-accent">Contact</p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Let's talk about the property you want.
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Tell us the budget, the area and the timeline. You'll get a verified shortlist, not a
            sales pitch.
          </p>

          <ul className="mt-10 space-y-5 text-sm">
            <li className="flex gap-4">
              <Phone className="mt-0.5 size-5 shrink-0 text-accent" />
              <a href={`tel:${phone}`} className="min-w-0 break-words text-muted-foreground hover:text-foreground">
                {phone || "—"}
              </a>
            </li>
            <li className="flex gap-4">
              <Mail className="mt-0.5 size-5 shrink-0 text-accent" />
              <a
                href={`mailto:${settings["contact_email"] ?? ""}`}
                className="min-w-0 break-words text-muted-foreground hover:text-foreground"
              >
                {settings["contact_email"] ?? "—"}
              </a>
            </li>
            {whatsapp ? (
              <li className="flex gap-4">
                <MessageCircle className="mt-0.5 size-5 shrink-0 text-accent" />
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="min-w-0 break-words text-muted-foreground hover:text-foreground"
                >
                  Chat on WhatsApp
                </a>
              </li>
            ) : null}
            <li className="flex gap-4">
              <MapPin className="mt-0.5 size-5 shrink-0 text-accent" />
              <span className="text-muted-foreground">
                {settings["office_lagos"] ?? "Lagos, Nigeria"}
              </span>
            </li>
          </ul>
        </div>

        <div className="min-w-0 space-y-8"><InspectionForm /><EnquiryForm /></div>
      </section>
    </SiteShell>
  );
}
