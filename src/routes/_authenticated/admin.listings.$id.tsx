import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { ListingForm, type ListingValues } from "@/components/admin/listing-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import {
  adminDeleteImage,
  adminGetProperty,
  adminUploadImage,
} from "@/lib/admin.functions";
import { imageSrc } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/listings/$id")({
  component: EditListing,
});

function EditListing() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const getFn = useServerFn(adminGetProperty);
  const uploadFn = useServerFn(adminUploadImage);
  const deleteImageFn = useServerFn(adminDeleteImage);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-listing", id],
    queryFn: () => getFn({ data: { id } }),
  });

  async function onUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      toast.error("Please choose an image under 6MB.");
      return;
    }
    setUploading(true);
    try {
      const buffer = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (const byte of buffer) binary += String.fromCharCode(byte);
      const result = await uploadFn({
        data: {
          propertyId: id,
          fileName: file.name,
          contentType: file.type || "image/jpeg",
          dataBase64: btoa(binary),
          caption,
          sortOrder: (data?.images.length ?? 0) + 1,
        },
      });
      if (result.ok) {
        setCaption("");
        toast.success("Photo added.");
        await queryClient.invalidateQueries({ queryKey: ["admin-listing", id] });
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Could not upload that photo.");
    } finally {
      setUploading(false);
    }
  }

  async function removeImage(imageId: string) {
    const result = await deleteImageFn({ data: { id: imageId } });
    if (result.ok) {
      await queryClient.invalidateQueries({ queryKey: ["admin-listing", id] });
    } else {
      toast.error(result.error);
    }
  }

  if (isLoading) return <PageLoader label="Loading listing…" />;

  if (!data) {
    return (
      <div className="rounded-2xl glass-panel p-8">
        <h1 className="font-display text-2xl font-semibold">Listing not found</h1>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/admin/listings">Back to listings</Link>
        </Button>
      </div>
    );
  }

  const property = data.property;
  const initial: ListingValues = {
    id: property.id,
    title: property.title,
    slug: property.slug,
    summary: property.summary ?? "",
    description: property.description ?? "",
    price: Number(property.price),
    currency: property.currency,
    price_period: property.price_period,
    listing_kind: property.listing_kind,
    property_type: property.property_type,
    status: property.status,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    size_sqm: property.size_sqm === null ? null : Number(property.size_sqm),
    address: property.address ?? "",
    area: property.area ?? "",
    city: property.city ?? "",
    features: property.features ?? [],
    cover_image_url: property.cover_image_url,
    is_featured: property.is_featured,
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold">Edit listing</h1>
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/properties/$slug" params={{ slug: property.slug }} target="_blank">
            View on site
          </Link>
        </Button>
      </div>

      <div className="mt-8">
        <ListingForm
          initial={initial}
          onSaved={async () => {
            await queryClient.invalidateQueries({ queryKey: ["admin-listing", id] });
            await queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
          }}
        />
      </div>

      <div className="mt-8 rounded-2xl glass-panel p-6">
        <h2 className="font-display text-lg font-semibold">Photos</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload photos of this property. The first photo is used when no cover image is set.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="caption">Caption (optional)</Label>
            <Input
              id="caption"
              value={caption}
              maxLength={160}
              onChange={(event) => setCaption(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="photo">Choose photo</Label>
            <Input id="photo" type="file" accept="image/*" onChange={onUpload} disabled={uploading} />
          </div>
        </div>

        {uploading ? (
          <p className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
            <Spinner className="size-4" /> Uploading…
          </p>
        ) : null}

        {data.images.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {data.images.map((image) => (
              <figure key={image.id} className="overflow-hidden rounded-xl border border-border">
                <img
                  src={imageSrc(image.image_url, image.id)}
                  alt={image.caption || property.title}
                  className="aspect-4/3 w-full object-cover"
                  loading="lazy"
                />
                <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-muted-foreground">
                  <span className="truncate">{image.caption || "Photo"}</span>
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="text-destructive hover:underline"
                  >
                    Remove
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">No photos yet.</p>
        )}
      </div>
    </div>
  );
}
