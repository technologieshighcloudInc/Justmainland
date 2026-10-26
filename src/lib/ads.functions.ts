import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listActiveAds = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ placement: z.enum(["home", "properties"]) }).parse(input))
  .handler(async ({ data }) => {
    const { createPublicClient } = await import("./public-db.server");
    const { data: rows, error } = await createPublicClient()
      .from("ads")
      .select("id, title, body, image_url, cta_label, cta_url, ends_at")
      .in("placement", [data.placement, "all"])
      .order("sort_order")
      .limit(3);
    if (error) {
      console.error("ads read failed", error.message);
      return [];
    }
    return rows ?? [];
  });

async function assertAdmin(context: { supabase: { rpc: Function }; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const adminListAds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase.from("ads").select("*").order("sort_order").order("created_at");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const adSchema = z
  .object({
    id: z.string().uuid().optional(),
    title: z.string().trim().min(2).max(120),
    body: z.string().trim().max(400).default(""),
    image_url: z.string().trim().url().max(500).nullable().or(z.literal("").transform(() => null)),
    cta_label: z.string().trim().max(40).default(""),
    cta_url: z
      .string()
      .trim()
      .max(500)
      .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v), "Link must start with / or https://")
      .default(""),
    placement: z.enum(["home", "properties", "all"]),
    starts_at: z.string().datetime({ offset: true }),
    ends_at: z.string().datetime({ offset: true }).nullable(),
    is_active: z.boolean(),
    sort_order: z.number().int().min(0).max(999),
  })
  .refine((a) => !a.ends_at || a.ends_at > a.starts_at, "End time must be after start time.");

export const adminSaveAd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => adSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...fields } = data;
    const { error } = id
      ? await context.supabase.from("ads").update(fields).eq("id", id)
      : await context.supabase.from("ads").insert(fields);
    return error ? { ok: false as const, error: error.message } : { ok: true as const };
  });

export const adminDeleteAd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("ads").delete().eq("id", data.id);
    return error ? { ok: false as const, error: error.message } : { ok: true as const };
  });
