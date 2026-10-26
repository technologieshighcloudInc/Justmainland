import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/spinner";
import {
  adminDeleteEnquiry,
  adminListEnquiries,
  adminSetEnquiryRead,
} from "@/lib/admin.functions";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/enquiries")({
  component: AdminEnquiries,
});

function AdminEnquiries() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(adminListEnquiries);
  const readFn = useServerFn(adminSetEnquiryRead);
  const deleteFn = useServerFn(adminDeleteEnquiry);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-enquiries"],
    queryFn: () => listFn({}),
  });

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["admin-enquiries"] });
  }

  async function toggleRead(id: string, isRead: boolean) {
    const result = await readFn({ data: { id, isRead } });
    if (result.ok) await refresh();
    else toast.error(result.error);
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this enquiry?")) return;
    const result = await deleteFn({ data: { id } });
    if (result.ok) {
      toast.success("Enquiry deleted.");
      await refresh();
    } else toast.error(result.error);
  }

  if (isLoading) return <PageLoader label="Loading enquiries…" />;

  const rows = data ?? [];

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Enquiries</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Messages sent from the contact form and property pages.
      </p>

      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No enquiries yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {rows.map((row) => (
            <article
              key={row.id}
              className={`rounded-2xl glass-panel p-5 ${row.is_read ? "opacity-80" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {row.name}
                    {row.is_read ? null : (
                      <span className="ml-3 rounded-full bg-accent/15 px-2.5 py-0.5 text-[0.62rem] uppercase tracking-[0.16em] text-accent">
                        New
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.email}
                    {row.phone ? ` · ${row.phone}` : ""} · {formatDate(row.created_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => toggleRead(row.id, !row.is_read)}
                  >
                    {row.is_read ? "Mark unread" : "Mark read"}
                  </Button>
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
              {row.subject ? (
                <p className="mt-4 text-sm font-medium">{row.subject}</p>
              ) : null}
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {row.message}
              </p>
              <a
                href={`mailto:${row.email}`}
                className="mt-4 inline-block text-xs text-accent hover:underline"
              >
                Reply by email
              </a>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
