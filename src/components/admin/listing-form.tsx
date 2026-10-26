import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { adminSaveProperty } from "@/lib/admin.functions";
import {
  PROPERTY_KINDS,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  kindLabel,
  slugify,
  statusLabel,
  typeLabel,
} from "@/lib/format";

export type ListingValues = {
  id?: string | null;
  title: string;
  slug: string;
  summary: string;
  description: string;
  price: number;
  currency: string;
  price_period: string | null;
  listing_kind: string;
  property_type: string;
  status: string;
  bedrooms: number;
  bathrooms: number;
  size_sqm: number | null;
  address: string;
  area: string;
  city: string;
  features: string[];
  cover_image_url: string | null;
  is_featured: boolean;
};

export const EMPTY_LISTING: ListingValues = {
  id: null,
  title: "",
  slug: "",
  summary: "",
  description: "",
  price: 0,
  currency: "NGN",
  price_period: null,
  listing_kind: "sale",
  property_type: "house",
  status: "draft",
  bedrooms: 0,
  bathrooms: 0,
  size_sqm: null,
  address: "",
  area: "",
  city: "Lagos",
  features: [],
  cover_image_url: null,
  is_featured: false,
};

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background/60 px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ListingForm({
  initial,
  onSaved,
}: {
  initial: ListingValues;
  onSaved?: (id: string) => void;
}) {
  const navigate = useNavigate();
  const saveFn = useServerFn(adminSaveProperty);
  const [values, setValues] = useState<ListingValues>(initial);
  const [featuresText, setFeaturesText] = useState(initial.features.join(", "));
  const [pending, setPending] = useState(false);

  function set<K extends keyof ListingValues>(key: K, value: ListingValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const result = await saveFn({
        data: {
          id: values.id ?? null,
          title: values.title.trim(),
          slug: (values.slug || slugify(values.title)).trim(),
          summary: values.summary.trim(),
          description: values.description.trim(),
          price: Number(values.price) || 0,
          currency: values.currency || "NGN",
          price_period: values.price_period?.trim() ? values.price_period.trim() : null,
          listing_kind: values.listing_kind as "sale",
          property_type: values.property_type as "house",
          status: values.status as "draft",
          bedrooms: Number(values.bedrooms) || 0,
          bathrooms: Number(values.bathrooms) || 0,
          size_sqm: values.size_sqm === null ? null : Number(values.size_sqm),
          address: values.address.trim(),
          area: values.area.trim(),
          city: values.city.trim(),
          features: featuresText
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 30),
          cover_image_url: values.cover_image_url,
          is_featured: values.is_featured,
        },
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Listing saved.");
      if (onSaved) onSaved(result.id);
      else await navigate({ to: "/admin/listings/$id", params: { id: result.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the listing.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-2xl glass-panel p-6">
        <h2 className="font-display text-lg font-semibold">Basics</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              required
              maxLength={160}
              value={values.title}
              onChange={(event) => {
                const title = event.target.value;
                setValues((current) => ({
                  ...current,
                  title,
                  slug: current.id ? current.slug : slugify(title),
                }));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">URL slug</Label>
            <Input
              id="slug"
              required
              value={values.slug}
              onChange={(event) => set("slug", slugify(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className={selectClass}
              value={values.status}
              onChange={(event) => set("status", event.target.value)}
            >
              {PROPERTY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="summary">Short summary</Label>
            <Input
              id="summary"
              maxLength={400}
              value={values.summary}
              onChange={(event) => set("summary", event.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Full description</Label>
            <Textarea
              id="description"
              rows={7}
              maxLength={6000}
              value={values.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl glass-panel p-6">
        <h2 className="font-display text-lg font-semibold">Pricing & type</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              min={0}
              step="1000"
              value={values.price}
              onChange={(event) => set("price", Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              maxLength={6}
              value={values.currency}
              onChange={(event) => set("currency", event.target.value.toUpperCase())}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="period">Price period (optional)</Label>
            <Input
              id="period"
              placeholder="year, month, night"
              maxLength={20}
              value={values.price_period ?? ""}
              onChange={(event) => set("price_period", event.target.value || null)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kind">Listing kind</Label>
            <select
              id="kind"
              className={selectClass}
              value={values.listing_kind}
              onChange={(event) => set("listing_kind", event.target.value)}
            >
              {PROPERTY_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {kindLabel(kind)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Property type</Label>
            <select
              id="type"
              className={selectClass}
              value={values.property_type}
              onChange={(event) => set("property_type", event.target.value)}
            >
              {PROPERTY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {typeLabel(type)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-3 pb-1">
            <Switch
              id="featured"
              checked={values.is_featured}
              onCheckedChange={(checked) => set("is_featured", checked)}
            />
            <Label htmlFor="featured">Feature on home page</Label>
          </div>
        </div>
      </div>

      <div className="rounded-2xl glass-panel p-6">
        <h2 className="font-display text-lg font-semibold">Location & specs</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={values.city}
              onChange={(event) => set("city", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="area">Area / district</Label>
            <Input
              id="area"
              value={values.area}
              onChange={(event) => set("area", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={values.address}
              onChange={(event) => set("address", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bedrooms">Bedrooms</Label>
            <Input
              id="bedrooms"
              type="number"
              min={0}
              max={60}
              value={values.bedrooms}
              onChange={(event) => set("bedrooms", Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bathrooms">Bathrooms</Label>
            <Input
              id="bathrooms"
              type="number"
              min={0}
              max={60}
              value={values.bathrooms}
              onChange={(event) => set("bathrooms", Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="size">Size (sqm)</Label>
            <Input
              id="size"
              type="number"
              min={0}
              value={values.size_sqm ?? ""}
              onChange={(event) =>
                set("size_sqm", event.target.value === "" ? null : Number(event.target.value))
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-3">
            <Label htmlFor="features">Features (comma separated)</Label>
            <Input
              id="features"
              value={featuresText}
              onChange={(event) => setFeaturesText(event.target.value)}
              placeholder="Pool, Smart home, 24/7 power"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending} className="rounded-full px-7">
          {pending ? (
            <>
              <Spinner className="mr-2 size-4" /> Saving…
            </>
          ) : (
            "Save listing"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-full px-6"
          onClick={() => navigate({ to: "/admin/listings" })}
        >
          Back to listings
        </Button>
      </div>
    </form>
  );
}
