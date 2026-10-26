import { Quote, Star } from "lucide-react";

import { Reveal } from "@/components/site/reveal";

export type TestimonialData = {
  id: string;
  name: string;
  role: string;
  quote: string;
  rating: number;
  avatar_url: string | null;
};

export function Testimonials({ items }: { items: TestimonialData[] }) {
  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8" aria-label="Client testimonials">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-accent">Testimonials</p>
          <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
            What our clients say
          </h2>
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <Reveal key={item.id} delay={index * 90} once>
            <figure className="group h-full rounded-2xl glass-panel p-6 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl hover:ring-1 hover:ring-accent/30">
              <Quote className="size-6 text-accent transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110" />
              <blockquote className="mt-4 text-sm leading-relaxed text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
                “{item.quote}”
              </blockquote>
              <div
                className="mt-5 flex gap-1"
                aria-label={`${item.rating} out of 5 stars`}
              >
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <Star
                    key={starIndex}
                    className={`size-4 transition-transform duration-300 group-hover:scale-110 ${
                      starIndex < item.rating ? "fill-accent text-accent" : "text-muted-foreground/40"
                    }`}
                    style={{ transitionDelay: `${starIndex * 40}ms` }}
                  />
                ))}
              </div>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-border/70 pt-4">
                {item.avatar_url ? (
                  <img
                    src={item.avatar_url}
                    alt={item.name}
                    loading="lazy"
                    className="size-10 rounded-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary font-display text-xs font-bold text-accent transition-transform duration-500 group-hover:scale-110">
                    {item.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span>
                  <span className="block font-display text-sm font-semibold">{item.name}</span>
                  <span className="block text-xs text-muted-foreground">{item.role}</span>
                </span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
