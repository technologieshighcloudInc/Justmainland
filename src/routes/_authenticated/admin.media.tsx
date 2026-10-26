import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import {
  adminDeleteGalleryItem,
  adminListGallery,
  adminRemoveHeroVideo,
  adminSaveGalleryItem,
  adminUploadSiteMedia,
} from "@/lib/admin.functions";
import { resolveSiteMediaUrl } from "@/lib/site-media";

export const Route = createFileRoute("/_authenticated/admin/media")({
  component: AdminMedia,
});

type GalleryRow = {
  id: string;
  section: string;
  title: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
};

async function readFileBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function GallerySection({ section, rows }: { section: "home" | "services"; rows: GalleryRow[] }) {
  const queryClient = useQueryClient();
  const saveFn = useServerFn(adminSaveGalleryItem);
  const deleteFn = useServerFn(adminDeleteGalleryItem);
  const uploadFn = useServerFn(adminUploadSiteMedia);
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const labels = {
    home: {
      heading: "Home page photo strip",
      hint: "The four photos shown under the hero slider on the home page.",
    },
    services: {
      heading: "Services page slider",
      hint: "The rotating photos in the “Start a conversation” panel on the services page.",
    },
  }[section];

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
    await queryClient.invalidateQueries({ queryKey: ["site-media"] });
  }

  async function onUpload(file: File) {
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadFn({
        data: {
          purpose: section,
          fileName: file.name,
          contentType: file.type || "image/jpeg",
          dataBase64: await readFileBase64(file),
        },
      });
      if (result.ok) {
        toast.success("Photo added.");
        await invalidate();
      } else toast.error(result.error);
    } catch {
      toast.error("Upload failed. Please try a smaller image (max 6MB).");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function save(row: GalleryRow) {
    const result = await saveFn({
      data: { id: row.id, title: row.title, sortOrder: row.sort_order, isActive: row.is_active },
    });
    if (result.ok) {
      toast.success("Saved.");
      await invalidate();
    } else toast.error(result.error);
  }

  async function move(row: GalleryRow, delta: number) {
    const swapped = rows.find(
      (other) => other.id !== row.id && other.sort_order === row.sort_order + delta,
    );
    if (swapped) {
      await saveFn({
        data: { id: swapped.id, title: swapped.title, sortOrder: row.sort_order, isActive: swapped.is_active },
      });
    }
    await saveFn({
      data: { id: row.id, title: row.title, sortOrder: Math.max(0, row.sort_order + delta), isActive: row.is_active },
    });
    toast.success("Order updated.");
    await invalidate();
  }

  async function remove(row: GalleryRow) {
    const result = await deleteFn({ data: { id: row.id } });
    if (result.ok) {
      toast.success("Photo removed.");
      await invalidate();
    } else toast.error(result.error);
  }

  return (
    <section className="rounded-2xl glass-panel p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold">{labels.heading}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{labels.hint}</p>
        </div>
        <div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onUpload(file);
            }}
          />
          <Button
            type="button"
            size="sm"
            disabled={uploading}
            className="rounded-full"
            onClick={() => fileInput.current?.click()}
          >
            {uploading ? (
              <>
                <Spinner className="mr-2 size-4" /> Uploading…
              </>
            ) : (
              <>
                <ImagePlus className="mr-2 size-4" /> Add photo
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No photos yet. Add the first one above.</p>
        )}
        {rows.map((row, index) => (
          <GalleryRowCard
            key={row.id}
            row={row}
            first={index === 0}
            last={index === rows.length - 1}
            onSave={save}
            onMove={move}
            onRemove={remove}
          />
        ))}
      </div>
    </section>
  );
}

function GalleryRowCard({
  row,
  first,
  last,
  onSave,
  onMove,
  onRemove,
}: {
  row: GalleryRow;
  first: boolean;
  last: boolean;
  onSave: (row: GalleryRow) => Promise<void>;
  onMove: (row: GalleryRow, delta: number) => Promise<void>;
  onRemove: (row: GalleryRow) => Promise<void>;
}) {
  const [draft, setDraft] = useState(row);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-background/60 p-3">
      <img
        src={resolveSiteMediaUrl(draft.image_url)}
        alt={draft.title || "Gallery photo"}
        className="size-16 shrink-0 rounded-lg border border-border object-cover"
      />
      <div className="min-w-0 flex-1 space-y-2">
        <Label htmlFor={`g-title-${row.id}`} className="sr-only">
          Caption
        </Label>
        <Input
          id={`g-title-${row.id}`}
          maxLength={160}
          placeholder="Caption (shown to visitors)"
          value={draft.title}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Move up"
          disabled={first}
          onClick={() => void onMove(draft, -1)}
        >
          <ArrowUp className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Move down"
          disabled={last}
          onClick={() => void onMove(draft, 1)}
        >
          <ArrowDown className="size-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id={`g-active-${row.id}`}
          checked={draft.is_active}
          onCheckedChange={(checked) => setDraft({ ...draft, is_active: checked })}
        />
        <Label htmlFor={`g-active-${row.id}`} className="text-xs text-muted-foreground">
          Visible
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" disabled={saving} className="rounded-full" onClick={save}>
          {saving ? <Spinner className="size-4" /> : "Save"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Delete ${draft.title || "photo"}`}
          onClick={() => void onRemove(draft)}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

function HeroVideoSection() {
  const queryClient = useQueryClient();
  const uploadFn = useServerFn(adminUploadSiteMedia);
  const removeFn = useServerFn(adminRemoveHeroVideo);
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: media } = useQuery({
    queryKey: ["admin-hero-video"],
    queryFn: () => import("@/lib/public.functions").then((m) => m.getSiteMedia()),
  });
  const videoUrl = media?.heroVideoUrl ? resolveSiteMediaUrl(media.heroVideoUrl) : "";

  async function onUpload(file: File) {
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadFn({
        data: {
          purpose: "hero-video",
          fileName: file.name,
          contentType: file.type || "video/mp4",
          dataBase64: await readFileBase64(file),
        },
      });
      if (result.ok) {
        toast.success("Homepage video updated.");
        await queryClient.invalidateQueries({ queryKey: ["admin-hero-video"] });
        await queryClient.invalidateQueries({ queryKey: ["site-media"] });
      } else toast.error(result.error);
    } catch {
      toast.error("Upload failed. Please try a smaller video (max 50MB).");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function remove() {
    const result = await removeFn({});
    if (result.ok) {
      toast.success("Homepage video removed.");
      await queryClient.invalidateQueries({ queryKey: ["admin-hero-video"] });
      await queryClient.invalidateQueries({ queryKey: ["site-media"] });
    } else toast.error(result.error);
  }

  return (
    <section className="rounded-2xl glass-panel p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Homepage background video</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A short clip (MP4/WebM, up to 50MB) that plays behind the home page hero. Without one,
            the photo slider is shown.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInput}
            type="file"
            accept="video/mp4,video/webm"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onUpload(file);
            }}
          />
          <Button
            type="button"
            size="sm"
            disabled={uploading}
            className="rounded-full"
            onClick={() => fileInput.current?.click()}
          >
            {uploading ? (
              <>
                <Spinner className="mr-2 size-4" /> Uploading…
              </>
            ) : (
              "Upload video"
            )}
          </Button>
          {videoUrl && (
            <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={remove}>
              Remove
            </Button>
          )}
        </div>
      </div>
      {videoUrl && (
        <video
          src={videoUrl}
          controls
          muted
          playsInline
          className="mt-5 max-h-72 w-full rounded-xl border border-border bg-background"
        />
      )}
    </section>
  );
}

function AdminMedia() {
  const listFn = useServerFn(adminListGallery);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: () => listFn({}),
  });

  if (isLoading) return <PageLoader label="Loading media…" />;

  const rows = data ?? [];
  const home = rows.filter((row) => row.section === "home");
  const services = rows.filter((row) => row.section === "services");

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Media</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Photos and the homepage background video shown across the website.
      </p>

      <div className="mt-6 space-y-6">
        <GallerySection section="home" rows={home} />
        <GallerySection section="services" rows={services} />
        <HeroVideoSection />
      </div>
    </div>
  );
}
