import { useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { WhatsAppWidget } from "./whatsapp-widget";
import { siteSettingsQuery } from "@/lib/queries";
import { VisitorPreferences } from './visitor-preferences';

export function SiteShell({ children }: { children: ReactNode }) {
  const { data: settings } = useSuspenseQuery(siteSettingsQuery);

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      <div className="pointer-events-none fixed inset-0 -z-10 mesh-bg" />
      <div className="pointer-events-none fixed inset-0 -z-10 grid-etch opacity-40" />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} />
      <VisitorPreferences/>
      <WhatsAppWidget
        number={settings["whatsapp_number"] ?? settings["contact_phone"] ?? ""}
        supportEmail={settings["support_email"] ?? settings["contact_email"] ?? ""}
      />
    </div>
  );
}
