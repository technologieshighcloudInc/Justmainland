import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import { adminStats } from "@/lib/admin.functions";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const statsFn = useServerFn(adminStats);
  const { data, isLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: () => statsFn({}) });

  const cards = [
    { label: "Published", value: data?.published ?? 0 },
    { label: "Drafts", value: data?.draft ?? 0 },
    { label: "Sold", value: data?.sold ?? 0 },
    { label: "Rented", value: data?.rented ?? 0 },
    { label: "Unread enquiries", value: data?.unread ?? 0 },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold">Dashboard</h1>
        <Button asChild className="rounded-full px-6">
          <Link to="/admin/listings/new">Add listing</Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl glass-panel p-5">
            <p className="font-display text-3xl font-semibold text-gradient">
              {isLoading ? "—" : card.value}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {card.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl glass-panel p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Recent enquiries</h2>
          <Link to="/admin/enquiries" className="text-sm text-muted-foreground hover:text-foreground">
            View inbox
          </Link>
        </div>
        <div className="mt-5 space-y-3">
          {(data?.recent ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No enquiries yet.</p>
          ) : (
            data!.recent.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {item.name} · <span className="text-muted-foreground">{item.subject}</span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{item.email}</p>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(item.created_at)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
