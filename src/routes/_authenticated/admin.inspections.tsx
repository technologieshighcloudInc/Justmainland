import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/spinner";
import {
  adminDeleteInspection,
  adminListInspections,
  adminSetInspectionStatus,
} from "@/lib/admin.functions";
import { formatDate } from "@/lib/format";

const STATUSES = ["requested", "confirmed", "completed", "cancelled"] as const;

export const Route = createFileRoute("/_authenticated/admin/inspections")({
  component: AdminInspections,
});

function AdminInspections() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(adminListInspections);
  const statusFn = useServerFn(adminSetInspectionStatus);
  const deleteFn = useServerFn(adminDeleteInspection);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-inspections"],
    queryFn: () => listFn({}),
  });

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["admin-inspections"] });
  }

  async function setStatus(id: string, status: (typeof STATUSES)[number]) {
    const result = await statusFn({ data: { id, status } });
    if (result.ok) await refresh();
    else toast.error(result.error);
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this booking?")) return;
    const result = await deleteFn({ data: { id } });
    if (result.ok) {
      toast.success("Booking deleted.");
      await refresh();
    } else toast.error(result.error);
  }

  if (isLoading) return <PageLoader label="Loading inspections…" />;

  const rows = data ?? [];

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Inspections</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Viewing requests booked from the website, soonest first.
      </p>

      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No inspection requests yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {rows.map((row) => (
            <article key={row.id} className="rounded-2xl glass-panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.email}
                    {row.phone ? ` · ${row.phone}` : ""}
                  </p>
                  <p className="mt-2 text-sm">
                    {formatDate(row.preferred_date)}
                    {row.preferred_time ? ` · ${row.preferred_time}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatus(row.id, status)}
                      className={`rounded-full border px-3 py-1 text-xs capitalize transition-colors ${
                        row.status === status
                          ? "border-accent/60 bg-accent/15 text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full text-destructive"
                    onClick={() => remove(row.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              {row.notes ? (
                <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {row.notes}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
