import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineLoader } from "@/components/ui/spinner";
import { adminDeleteProperty, adminListProperties } from "@/lib/admin.functions";
import { formatPriceFull, kindLabel, statusLabel, typeLabel } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/listings/")({
  component: AdminListings,
});

function AdminListings() {
  const listFn = useServerFn(adminListProperties);
  const deleteFn = useServerFn(adminDeleteProperty);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-listings"],
    queryFn: () => listFn({}),
  });

  const rows = (data ?? []).filter((row) =>
    `${row.title} ${row.city} ${row.area}`.toLowerCase().includes(search.toLowerCase()),
  );

  async function remove(id: string, title: string) {
    if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;
    const result = await deleteFn({ data: { id } });
    if (result.ok) {
      toast.success("Listing deleted.");
      await queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold">Listings</h1>
        <Button asChild className="rounded-full px-6">
          <Link to="/admin/listings/new">Add listing</Link>
        </Button>
      </div>

      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search listings…"
        className="mt-6 max-w-sm"
      />

      {isLoading ? (
        <InlineLoader label="Loading listings…" />
      ) : rows.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No listings match that search.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl glass-panel">
          <table className="w-full min-w-[52rem] text-sm">
            <thead>
              <tr className="border-b border-border/70 text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
                <th className="px-5 py-4 font-medium">Property</th>
                <th className="px-5 py-4 font-medium">Type</th>
                <th className="px-5 py-4 font-medium">Price</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border/50 last:border-0">
                  <td className="px-5 py-4">
                    <p className="font-medium">{row.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.area ? `${row.area}, ` : ""}
                      {row.city}
                      {row.is_featured ? " · Featured" : ""}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {typeLabel(row.property_type)} · {kindLabel(row.listing_kind)}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {formatPriceFull(Number(row.price), row.currency)}
                    {row.price_period ? ` / ${row.price_period}` : ""}
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                      {statusLabel(row.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="sm" variant="outline" className="rounded-full">
                        <Link to="/admin/listings/$id" params={{ id: row.id }}>
                          Edit
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full text-destructive"
                        onClick={() => remove(row.id, row.title)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
