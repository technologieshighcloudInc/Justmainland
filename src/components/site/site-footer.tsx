import { Link } from "@tanstack/react-router";
import { Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";

import brandLogo from "@/assets/justmainlandng-logo.jpg";

export function SiteFooter({ settings }: { settings: Record<string, string> }) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-24 border-t border-border/70 bg-surface/40">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="flex items-center">
            <img
              src={brandLogo}
              alt="JustMainlandNG Real Estate"
              width={358}
              height={247}
              className="h-16 w-auto max-w-40 object-contain"
            />
          </div>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
            Licensed Nigerian real estate advisory building generational property
            portfolios across Lagos and the Mainland — engineered for people who expect more
            than a listing.
          </p>
          <p className="mt-4 max-w-md text-xs leading-relaxed text-muted-foreground">
            Registered as:{" "}
            <span className="text-foreground">JustMainland Property Investment Limited</span>{" "}
            (JustMainlandNG) — +234 811 598 0894 · WhatsApp +234 901 050 3309
          </p>
          <div className="mt-6 flex gap-3">
            <a
              href={settings["instagram_url"] ?? "#"}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Instagram"
              className="grid size-10 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-accent/50 hover:text-accent"
            >
              <Instagram className="size-4" />
            </a>
            <a
              href={settings["linkedin_url"] ?? "#"}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="LinkedIn"
              className="grid size-10 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-accent/50 hover:text-accent"
            >
              <Linkedin className="size-4" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Navigate
          </h3>
          <ul className="mt-5 space-y-3 text-sm">
            {[
              { to: "/properties", label: "Properties" },
              { to: "/services", label: "Services" },
              { to: "/about", label: "About us" },
              { to: "/values", label: "Mission, vision & values" },
              { to: "/testimonials", label: "Client reviews" },
              { to: "/partners", label: "Partners & affiliates" },
              { to: "/team", label: "Team & agents" },
              { to: "/insights", label: "News & insights" },
              { to: "/faq", label: "FAQs" },
              { to: "/contact", label: "Contact" },
            ].map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Reach us
          </h3>
          <ul className="mt-5 space-y-4 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-accent" />
              <a href={`tel:${settings["contact_phone"] ?? ""}`} className="hover:text-foreground">
                {settings["contact_phone"] ?? "—"}
              </a>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-accent" />
              <a href={`mailto:${settings["contact_email"] ?? ""}`} className="hover:text-foreground">
                {settings["contact_email"] ?? "—"}
              </a>
            </li>
            <li className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
              <span>{settings["office_lagos"] ?? "Lagos, Nigeria"}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {year} JustMainlandNG. All rights reserved.</p>
          <p>Your Trusted Real Estate Partner on the Mainland</p>
        </div>
      </div>
    </footer>
  );
}
