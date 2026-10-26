import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { SiteShell } from "@/components/site/site-shell";
import { Button } from "@/components/ui/button";

export function ContentPage({ label, title, intro, children }: { label: string; title: string; intro: string; children: ReactNode }) {
  return <SiteShell>
    <section className="mx-auto max-w-7xl px-5 pb-10 pt-14 sm:px-8 lg:pt-20">
      <Reveal once>
        <p className="text-xs font-semibold uppercase text-primary">{label}</p>
        <h1 className="mt-4 max-w-4xl font-display text-4xl font-bold leading-tight sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">{intro}</p>
      </Reveal>
    </section>
    <section className="mx-auto w-full max-w-7xl px-5 pb-16 sm:px-8">{children}</section>
    <section className="border-y border-border bg-secondary/50">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-5 py-10 sm:px-8">
        <div><h2 className="font-display text-xl font-semibold">Your next move starts with a conversation.</h2><p className="mt-2 text-sm text-muted-foreground">Tell us what you have in mind.</p></div>
        <Button asChild><Link to="/contact">Contact us <ArrowUpRight className="size-4" /></Link></Button>
      </div>
    </section>
  </SiteShell>;
}

export function contentHead(title: string, description: string) {
  return { meta: [
    { title: `${title} | JustMainlandNG` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} | JustMainlandNG` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] };
}