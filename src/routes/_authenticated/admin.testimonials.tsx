import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  adminDeleteTestimonial,
  adminListTestimonials,
  adminSaveTestimonial,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/testimonials")({
  component: AdminTestimonials,
});

type Draft = {
  id: string | null;
  name: string;
  role: string;
  quote: string;
  rating: number;
  avatar_url: string;
  is_published: boolean;
  sort_order: number;
};

const EMPTY: Draft = {
  id: null,
  name: "",
  role: "",
  quote: "",
  rating: 5,
  avatar_url: "",
  is_published: true,
  sort_order: 0,
};

function AdminTestimonials() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(adminListTestimonials);
  const saveFn = useServerFn(adminSaveTestimonial);
  const deleteFn = useServerFn(adminDeleteTestimonial);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [pending, setPending] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: () => listFn({}),
  });

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
    await queryClient.invalidateQueries({ queryKey: ["testimonials"] });
  }

  async function save() {
    if (draft.name.trim().length < 2 || draft.quote.trim().length < 10) {
      toast.error("Add a name and a quote of at least 10 characters.");
      return;
    }
    setPending(true);
    try {
      const result = await saveFn({
        data: {
          id: draft.id,
          name: draft.name,
          role: draft.role,
          quote: draft.quote,
          rating: draft.rating,
          avatar_url: draft.avatar_url.trim() || null,
          is_published: draft.is_published,
          sort_order: draft.sort_order,
        },
      });
      if (result.ok) {
        toast.success(draft.id ? "Testimonial updated." : "Testimonial added.");
        setDraft(EMPTY);
        await refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Could not save that testimonial.");
    } finally {
      setPending(false);
    }
  }

  async function remove(id: string) {
    const result = await deleteFn({ data: { id } });
    if (result.ok) {
      if (draft.id === id) setDraft(EMPTY);
      await refresh();
    } else {
      toast.error(result.error);
    }
  }

  if (isLoading) return <PageLoader label="Loading testimonials…" />;

  const rows = data ?? [];

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Testimonials</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Client quotes shown on the homepage. Only published testimonials appear on the website.
      </p>

      <div className="mt-6 rounded-2xl glass-panel p-6">
        <h2 className="font-display text-lg font-semibold">
          {draft.id ? "Edit testimonial" : "Add testimonial"}
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="t-name">Client name</Label>
            <Input
              id="t-name"
              value={draft.name}
              maxLength={120}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-role">Role / location</Label>
            <Input
              id="t-role"
              value={draft.role}
              maxLength={120}
              placeholder="Investor, Lekki"
              onChange={(event) => setDraft({ ...draft, role: event.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="t-quote">Quote</Label>
            <Textarea
              id="t-quote"
              rows={4}
              value={draft.quote}
              maxLength={800}
              onChange={(event) => setDraft({ ...draft, quote: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-rating">Rating (1-5)</Label>
            <Input
              id="t-rating"
              type="number"
              min={1}
              max={5}
              value={draft.rating}
              onChange={(event) =>
                setDraft({ ...draft, rating: Math.min(5, Math.max(1, Number(event.target.value) || 5)) })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-order">Display order</Label>
            <Input
              id="t-order"
              type="number"
              min={0}
              max={999}
              value={draft.sort_order}
              onChange={(event) =>
                setDraft({ ...draft, sort_order: Math.max(0, Number(event.target.value) || 0) })
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="t-avatar">Photo URL (optional)</Label>
            <Input
              id="t-avatar"
              value={draft.avatar_url}
              maxLength={500}
              placeholder="https://…"
              onChange={(event) => setDraft({ ...draft, avatar_url: event.target.value })}
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="t-published"
              checked={draft.is_published}
              onCheckedChange={(checked) => setDraft({ ...draft, is_published: checked })}
            />
            <Label htmlFor="t-published">Published</Label>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Button onClick={save} disabled={pending} className="rounded-full px-7">
            {pending ? (
              <>
                <Spinner className="mr-2 size-4" /> Saving…
              </>
            ) : draft.id ? (
              "Update testimonial"
            ) : (
              "Add testimonial"
            )}
          </Button>
          {draft.id ? (
            <Button variant="outline" className="rounded-full" onClick={() => setDraft(EMPTY)}>
              Cancel
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {rows.map((row) => (
          <article
            key={row.id}
            className="group rounded-2xl glass-panel p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold">{row.name}</h3>
                <p className="text-xs text-muted-foreground">{row.role}</p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                {row.is_published ? "Published" : "Hidden"}
              </span>
            </div>
            <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted-foreground">
              “{row.quote}”
            </p>
            <div className="mt-4 flex gap-4 text-xs">
              <button
                type="button"
                className="text-accent hover:underline"
                onClick={() =>
                  setDraft({
                    id: row.id,
                    name: row.name,
                    role: row.role ?? "",
                    quote: row.quote,
                    rating: row.rating,
                    avatar_url: row.avatar_url ?? "",
                    is_published: row.is_published,
                    sort_order: row.sort_order,
                  })
                }
              >
                Edit
              </button>
              <button
                type="button"
                className="text-destructive hover:underline"
                onClick={() => remove(row.id)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No testimonials yet.</p>
        ) : null}
      </div>
    </div>
  );
}
