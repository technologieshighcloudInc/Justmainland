import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: Boolean(data), userId: context.userId };
  });

/**
 * Grants the admin role to the signed-in account only when its verified email
 * is on the server-side allowlist (the super administrator). Safe to call on
 * every admin page load.
 */
export const ensureAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = String((context.claims as { email?: string }).email ?? "")
      .trim()
      .toLowerCase();
    if (!email) return { ok: false as const, error: "No verified email on this account." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: allowed, error: allowError } = await supabaseAdmin
      .from("admin_allowlist")
      .select("email")
      .eq("email", email)
      .maybeSingle();
    if (allowError) throw new Error(allowError.message);
    if (!allowed) {
      return {
        ok: false as const,
        error: "This account is not authorised for admin access.",
      };
    }

    const { data: existing } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (existing) return { ok: true as const };

    const { error: insertError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (insertError) throw new Error(insertError.message);
    return { ok: true as const };
  });

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const counts = async (status: string) =>
      (
        await context.supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("status", status as never)
      ).count ?? 0;

    const [published, draft, sold, rented] = await Promise.all([
      counts("published"),
      counts("draft"),
      counts("sold"),
      counts("rented"),
    ]);

    const unread =
      (
        await context.supabase
          .from("enquiries")
          .select("id", { count: "exact", head: true })
          .eq("is_read", false)
      ).count ?? 0;

    const { data: recent } = await context.supabase
      .from("enquiries")
      .select("id, name, email, subject, created_at, is_read")
      .order("created_at", { ascending: false })
      .limit(5);

    return { published, draft, sold, rented, unread, recent: recent ?? [] };
  });

export const adminListProperties = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("properties")
      .select(
        "id, slug, title, price, currency, price_period, status, listing_kind, property_type, city, area, is_featured, cover_image_url, updated_at",
      )
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminGetProperty = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: property, error } = await context.supabase
      .from("properties")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!property) return null;

    const { data: images } = await context.supabase
      .from("property_images")
      .select("id, image_url, caption, sort_order")
      .eq("property_id", property.id)
      .order("sort_order", { ascending: true });

    return { property, images: images ?? [] };
  });

export const adminSaveProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().nullable().optional(),
        title: z.string().trim().min(3).max(160),
        slug: z
          .string()
          .trim()
          .min(3)
          .max(120)
          .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and dashes"),
        summary: z.string().trim().max(400).default(""),
        description: z.string().trim().max(6000).default(""),
        price: z.number().min(0),
        currency: z.string().trim().min(2).max(6).default("NGN"),
        price_period: z.string().trim().max(20).nullable().default(null),
        listing_kind: z.enum(["sale", "rent", "shortlet"]),
        property_type: z.enum(["house", "apartment", "duplex", "land", "commercial", "office"]),
        status: z.enum(["draft", "published", "sold", "rented"]),
        bedrooms: z.number().int().min(0).max(60),
        bathrooms: z.number().int().min(0).max(60),
        size_sqm: z.number().min(0).nullable().default(null),
        address: z.string().trim().max(240).default(""),
        area: z.string().trim().max(120).default(""),
        city: z.string().trim().max(120).default(""),
        features: z.array(z.string().trim().max(80)).max(30).default([]),
        cover_image_url: z.string().trim().max(500).nullable().default(null),
        is_featured: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { id, ...fields } = data;
    if (id) {
      const { error } = await context.supabase.from("properties").update(fields).eq("id", id);
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const, id };
    }
    const { data: created, error } = await context.supabase
      .from("properties")
      .insert({ ...fields, created_by: context.userId })
      .select("id")
      .single();
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, id: created.id };
  });

export const adminDeleteProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("properties").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const adminAddImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        propertyId: z.string().uuid(),
        imageUrl: z.string().trim().min(1).max(500),
        caption: z.string().trim().max(160).default(""),
        sortOrder: z.number().int().min(0).max(999).default(0),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("property_images").insert({
      property_id: data.propertyId,
      image_url: data.imageUrl,
      caption: data.caption,
      sort_order: data.sortOrder,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const adminDeleteImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("property_images").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const adminListEnquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("enquiries")
      .select("id, name, email, phone, subject, message, is_read, created_at, property_id")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminSetEnquiryRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), isRead: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("enquiries")
      .update({ is_read: data.isRead })
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const adminDeleteEnquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("enquiries").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const adminListSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("site_settings")
      .select("key, value, label")
      .order("key", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminSaveSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        entries: z
          .array(
            z.object({
              key: z.string().trim().min(1).max(80),
              value: z.string().max(2000),
            }),
          )
          .max(60),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    for (const entry of data.entries) {
      const { error } = await context.supabase
        .from("site_settings")
        .update({ value: entry.value })
        .eq("key", entry.key);
      if (error) return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  });

export const adminListInspections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("inspection_bookings")
      .select(
        "id, name, email, phone, notes, preferred_date, preferred_time, status, created_at, property_id",
      )
      .order("preferred_date", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminSetInspectionStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["requested", "confirmed", "completed", "cancelled"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("inspection_bookings")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const adminDeleteInspection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("inspection_bookings")
      .delete()
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

/** Uploads a listing photo into the private bucket and records it. */
export const adminUploadImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        propertyId: z.string().uuid(),
        fileName: z.string().trim().min(1).max(160),
        contentType: z.string().trim().min(3).max(80),
        dataBase64: z.string().min(1),
        caption: z.string().trim().max(160).default(""),
        sortOrder: z.number().int().min(0).max(999).default(0),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) return { ok: false as const, error: "Admin access required." };
    if (!data.contentType.startsWith("image/")) {
      return { ok: false as const, error: "Only image files can be uploaded." };
    }

    const binary = Uint8Array.from(atob(data.dataBase64), (char) => char.charCodeAt(0));
    if (binary.byteLength > MAX_UPLOAD_BYTES) {
      return { ok: false as const, error: "Image is larger than 6MB." };
    }

    const safeName = data.fileName.toLowerCase().replace(/[^a-z0-9.]+/g, "-").slice(-60);
    const objectPath = `${data.propertyId}/${Date.now()}-${safeName}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: uploadError } = await supabaseAdmin.storage
      .from("property-images")
      .upload(objectPath, binary, { contentType: data.contentType, upsert: false });
    if (uploadError) return { ok: false as const, error: uploadError.message };

    const { error } = await context.supabase.from("property_images").insert({
      property_id: data.propertyId,
      image_url: objectPath,
      caption: data.caption,
      sort_order: data.sortOrder,
    });
    if (error) return { ok: false as const, error: error.message };

    // The first photo uploaded becomes the main (cover) image automatically.
    const { data: property } = await context.supabase
      .from("properties")
      .select("cover_image_url")
      .eq("id", data.propertyId)
      .maybeSingle();
    if (property && !property.cover_image_url) {
      await context.supabase
        .from("properties")
        .update({ cover_image_url: objectPath })
        .eq("id", data.propertyId);
    }

    return { ok: true as const, path: objectPath };
  });

export const adminSetCoverImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ propertyId: z.string().uuid(), imageUrl: z.string().trim().min(1).max(500) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("properties")
      .update({ cover_image_url: data.imageUrl })
      .eq("id", data.propertyId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

const testimonialSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(2).max(120),
  role: z.string().trim().max(120).default(""),
  quote: z.string().trim().min(10).max(800),
  rating: z.number().int().min(1).max(5).default(5),
  avatar_url: z.string().trim().max(500).nullable().default(null),
  is_published: z.boolean().default(true),
  sort_order: z.number().int().min(0).max(999).default(0),
});

export const adminListTestimonials = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("testimonials")
      .select("id, name, role, quote, rating, avatar_url, is_published, sort_order, created_at")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminSaveTestimonial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => testimonialSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { id, ...fields } = data;
    if (id) {
      const { error } = await context.supabase.from("testimonials").update(fields).eq("id", id);
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const };
    }
    const { error } = await context.supabase.from("testimonials").insert(fields);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const adminDeleteTestimonial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("testimonials").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const adminListGallery = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("site_gallery")
      .select("id, section, title, image_url, sort_order, is_active")
      .order("section", { ascending: true })
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminSaveGalleryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().trim().max(160).default(""),
        sortOrder: z.number().int().min(0).max(999),
        isActive: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("site_gallery")
      .update({
        title: data.title,
        sort_order: data.sortOrder,
        is_active: data.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const adminDeleteGalleryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("site_gallery").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

const MAX_SITE_IMAGE_BYTES = 6 * 1024 * 1024;
const MAX_SITE_VIDEO_BYTES = 50 * 1024 * 1024;

/**
 * Uploads a photo for the home/services galleries or a short video for the
 * homepage background into the private `site-media` bucket. Gallery uploads
 * are recorded as new gallery rows; the video becomes the hero background.
 */
export const adminUploadSiteMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        purpose: z.enum(["home", "services", "hero-video"]),
        fileName: z.string().trim().min(1).max(160),
        contentType: z.string().trim().min(3).max(80),
        dataBase64: z.string().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) return { ok: false as const, error: "Admin access required." };

    const isVideo = data.purpose === "hero-video";
    if (isVideo && !data.contentType.startsWith("video/")) {
      return { ok: false as const, error: "Only video files can be used as the homepage background." };
    }
    if (!isVideo && !data.contentType.startsWith("image/")) {
      return { ok: false as const, error: "Only image files can be uploaded." };
    }

    const binary = Uint8Array.from(atob(data.dataBase64), (char) => char.charCodeAt(0));
    if (binary.byteLength > (isVideo ? MAX_SITE_VIDEO_BYTES : MAX_SITE_IMAGE_BYTES)) {
      return {
        ok: false as const,
        error: isVideo ? "Video is larger than 50MB." : "Image is larger than 6MB.",
      };
    }

    const safeName = data.fileName.toLowerCase().replace(/[^a-z0-9.]+/g, "-").slice(-60);
    const objectPath = `${data.purpose}/${Date.now()}-${safeName}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: uploadError } = await supabaseAdmin.storage
      .from("site-media")
      .upload(objectPath, binary, { contentType: data.contentType, upsert: false });
    if (uploadError) return { ok: false as const, error: uploadError.message };

    if (isVideo) {
      const { error: settingsError } = await context.supabase
        .from("site_settings")
        .update({ value: objectPath })
        .eq("key", "hero_video_url");
      if (settingsError) return { ok: false as const, error: settingsError.message };
      return { ok: true as const, path: objectPath };
    }

    const { data: highest } = await context.supabase
      .from("site_gallery")
      .select("sort_order")
      .eq("section", data.purpose)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextOrder = (highest?.sort_order ?? -1) + 1;

    const { error: insertError } = await context.supabase.from("site_gallery").insert({
      section: data.purpose,
      title: "",
      image_url: objectPath,
      sort_order: nextOrder,
      is_active: true,
    });
    if (insertError) return { ok: false as const, error: insertError.message };
    return { ok: true as const, path: objectPath };
  });

/** Clears the homepage background video (the stored object itself is kept). */
export const adminRemoveHeroVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("site_settings")
      .update({ value: "" })
      .eq("key", "hero_video_url");
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
