import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { captchaFields } from './visitor.functions';

const listSchema = z.object({
  kind: z.string().optional(),
  type: z.string().optional(),
  city: z.string().optional(),
  search: z.string().max(120).optional(),
  featuredOnly: z.boolean().optional(),
  limit: z.number().int().min(1).max(48).optional(),
});

const slugSchema = z.object({ slug: z.string().min(1).max(120) });

const enquirySchema = z.object({
  ...captchaFields,
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).default(""),
  subject: z.string().trim().max(160).default("General enquiry"),
  message: z.string().trim().min(10).max(1500),
  propertyId: z.string().uuid().nullable().optional(),
});

export const listPublicProperties = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => listSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const { createPublicClient } = await import("./public-db.server");
    const supabase = createPublicClient();

    let query = supabase
      .from("properties")
      .select(
        "id, slug, title, summary, price, currency, price_period, listing_kind, property_type, status, bedrooms, bathrooms, size_sqm, area, city, cover_image_url, is_featured, created_at",
      )
      .in("status", ["published", "sold", "rented"])
      .eq('city', 'Lagos')
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (data.kind) query = query.eq("listing_kind", data.kind as never);
    if (data.type) query = query.eq("property_type", data.type as never);
    if (data.city) query = query.eq("city", data.city);
    if (data.featuredOnly) query = query.eq("is_featured", true);
    if (data.search) {
      const term = data.search.replace(/[%,()]/g, " ").trim();
      if (term) {
        query = query.or(
          `title.ilike.%${term}%,area.ilike.%${term}%,city.ilike.%${term}%,summary.ilike.%${term}%`,
        );
      }
    }
    query = query.limit(data.limit ?? 24);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getPublicProperty = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => slugSchema.parse(input))
  .handler(async ({ data }) => {
    const { createPublicClient } = await import("./public-db.server");
    const supabase = createPublicClient();

    const { data: property, error } = await supabase
      .from("properties")
      .select("*")
      .eq("slug", data.slug)
      .eq('city', 'Lagos')
      .in("status", ["published", "sold", "rented"])
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!property) return null;

    const { data: images } = await supabase
      .from("property_images")
      .select("id, image_url, caption, sort_order")
      .eq("property_id", property.id)
      .order("sort_order", { ascending: true });

    const { data: related } = await supabase
      .from("properties")
      .select(
        "id, slug, title, summary, price, currency, price_period, listing_kind, property_type, status, bedrooms, bathrooms, size_sqm, area, city, cover_image_url, is_featured, created_at",
      )
      .eq("city", property.city)
      .neq("id", property.id)
      .in("status", ["published", "sold", "rented"])
      .limit(3);

    return { property, images: images ?? [], related: related ?? [] };
  });

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { createPublicClient } = await import("./public-db.server");
  const supabase = createPublicClient();

  const { data, error } = await supabase.from("site_settings").select("key, value, label");
  if (error) throw new Error(error.message);

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    if(row.key === 'office_abuja') continue;
    map[row.key] = row.value.replace(/Lagos and Abuja/gi, 'Lagos and the Mainland').replace(/Abuja/gi, 'Mainland Lagos');
  }
  return map;
});

export const submitEnquiry = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => enquirySchema.parse(input))
  .handler(async ({ data }) => {
    const { verifyCaptcha } = await import('./captcha.server');
    await verifyCaptcha(data.captchaId, data.captchaAnswer);
    const { createPublicClient } = await import("./public-db.server");
    const supabase = createPublicClient();

    const { error } = await supabase.from("enquiries").insert({
      name: data.name,
      email: data.email,
      phone: data.phone,
      subject: data.subject || "General enquiry",
      message: data.message,
      property_id: data.propertyId ?? null,
    });

    if (error) {
      console.error("enquiry insert failed", error.message);
      return { ok: false as const, error: "We couldn't send that. Please try again." };
    }
    return { ok: true as const };
  });

const inspectionSchema = z.object({
  ...captchaFields,
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).default(""),
  notes: z.string().trim().max(800).default(""),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date"),
  preferredTime: z.string().trim().min(1).max(40),
  propertyId: z.string().uuid().nullable().optional(),
});

export const bookInspection = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inspectionSchema.parse(input))
  .handler(async ({ data }) => {
    const { verifyCaptcha } = await import('./captcha.server');
    await verifyCaptcha(data.captchaId, data.captchaAnswer);
    const { lagosDate } = await import('./visitor-rules');
    const today = new Date(`${lagosDate()}T00:00:00`);
    const chosen = new Date(`${data.preferredDate}T00:00:00`);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 90);
    if (Number.isNaN(chosen.getTime()) || chosen < today || chosen > maxDate) {
      return { ok: false as const, error: "Please choose a date within the next 90 days." };
    }

    const { createPublicClient } = await import("./public-db.server");
    const supabase = createPublicClient();

    const { error } = await supabase.from("inspection_bookings").insert({
      property_id: data.propertyId ?? null,
      name: data.name,
      email: data.email,
      phone: data.phone,
      notes: data.notes,
      preferred_date: data.preferredDate,
      preferred_time: data.preferredTime,
      status: "requested",
    });

    if (error) {
      console.error("inspection insert failed", error.message);
      return { ok: false as const, error: "We couldn't book that. Please try again." };
    }
    return { ok: true as const };
  });

export const listTestimonials = createServerFn({ method: "GET" }).handler(async () => {
  const { createPublicClient } = await import("./public-db.server");
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("testimonials")
    .select("id, name, role, quote, rating, avatar_url, sort_order")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .limit(12);

  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getSiteMedia = createServerFn({ method: "GET" }).handler(async () => {
  const { createPublicClient } = await import("./public-db.server");
  const supabase = createPublicClient();

  const [{ data: rows, error }, { data: settings, error: settingsError }] = await Promise.all([
    supabase
      .from("site_gallery")
      .select("id, section, title, image_url, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase.from("site_settings").select("key, value"),
  ]);
  if (error) throw new Error(error.message);
  if (settingsError) throw new Error(settingsError.message);

  const all = rows ?? [];
  return {
    home: all.filter((row) => row.section === "home"),
    services: all.filter((row) => row.section === "services"),
    heroVideoUrl: settings?.find((row) => row.key === "hero_video_url")?.value ?? "",
  };
});
