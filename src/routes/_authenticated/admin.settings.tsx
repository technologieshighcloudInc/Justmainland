import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import { adminListSettings, adminSaveSettings } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(adminListSettings);
  const saveFn = useServerFn(adminSaveSettings);
  const [values, setValues] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => listFn({}),
  });

  useEffect(() => {
    if (!data) return;
    setValues(Object.fromEntries(data.map((row) => [row.key, row.value])));
  }, [data]);

  async function save() {
    setPending(true);
    try {
      const result = await saveFn({
        data: { entries: Object.entries(values).map(([key, value]) => ({ key, value })) },
      });
      if (result.ok) {
        toast.success("Site content updated.");
        await queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
        await queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      } else toast.error(result.error);
    } catch {
      toast.error("Could not save your changes.");
    } finally {
      setPending(false);
    }
  }

  if (isLoading) return <PageLoader label="Loading site content…" />;

  const rows = data ?? [];

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Site content</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Headlines, contact details, WhatsApp number and support email shown across the website.
      </p>

      <div className="mt-6 rounded-2xl glass-panel p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.key} className="space-y-2">
              <Label htmlFor={`s-${row.key}`}>{row.label || row.key}</Label>
              <Input
                id={`s-${row.key}`}
                value={values[row.key] ?? ""}
                maxLength={2000}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [row.key]: event.target.value }))
                }
              />
            </div>
          ))}
        </div>

        <Button onClick={save} disabled={pending} className="mt-7 rounded-full px-7">
          {pending ? (
            <>
              <Spinner className="mr-2 size-4" /> Saving…
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </div>
  );
}
