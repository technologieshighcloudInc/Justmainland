import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import {
  canTransition,
  DEFAULT_TZ,
  formatSlot,
  generateSlots,
  isBookableDate,
  isChangeable,
  localDate,
} from "./booking-core";

const TOKEN = z.string().regex(/^[a-f0-9]{48}$/);
const ISO = z.string().datetime({ offset: true });
const OVERLAP = "23P01";
const TAKEN = "That time was just taken. Please pick another slot.";

type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

async function admin(): Promise<Admin> {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

/** Free start instants per agent for a local date, computed from weekly hours minus held bookings. */
async function slotsForDate(db: Admin, date: string, excludeAppointmentId?: string) {
  const now = Date.now();
  const { data: agents, error } = await db
    .from("agents")
    .select("id, timezone, slot_minutes, agent_availability(weekday, start_time, end_time)")
    .eq("is_active", true);
  if (error) throw new Error(error.message);
  if (!agents?.length) return new Map<number, { agentId: string; minutes: number }[]>();

  const from = new Date(Date.parse(`${date}T00:00:00Z`) - 86_400_000).toISOString();
  const to = new Date(Date.parse(`${date}T00:00:00Z`) + 2 * 86_400_000).toISOString();
  let busyQuery = db
    .from("appointments")
    .select("id, agent_id, starts_at, ends_at")
    .in("status", ["requested", "confirmed"])
    .lt("starts_at", to)
    .gt("ends_at", from);
  if (excludeAppointmentId) busyQuery = busyQuery.neq("id", excludeAppointmentId);
  const { data: busy, error: busyError } = await busyQuery;
  if (busyError) throw new Error(busyError.message);

  const map = new Map<number, { agentId: string; minutes: number }[]>();
  for (const agent of agents) {
    const tz = agent.timezone || DEFAULT_TZ;
    const slots = generateSlots({
      date,
      tz,
      slotMinutes: agent.slot_minutes,
      windows: agent.agent_availability ?? [],
      busy: (busy ?? [])
        .filter((b) => b.agent_id === agent.id)
        .map((b) => ({ start: Date.parse(b.starts_at), end: Date.parse(b.ends_at) })),
      nowMs: now,
    });
    for (const s of slots) {
      const list = map.get(s) ?? [];
      list.push({ agentId: agent.id, minutes: agent.slot_minutes });
      map.set(s, list);
    }
  }
  return map;
}

function checkDate(date: string) {
  if (!isBookableDate(date, Date.now())) throw new Error("Please choose a date within the next 60 days.");
}

export const getAvailableSlots = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(input),
  )
  .handler(async ({ data }) => {
    if (!isBookableDate(data.date, Date.now())) return [];
    const map = await slotsForDate(await admin(), data.date);
    return [...map.keys()]
      .sort((a, b) => a - b)
      .map((ms) => ({ startsAt: new Date(ms).toISOString(), label: formatSlot(ms) }));
  });

/** Tries each free agent in turn; the database exclusion constraint is the final conflict guard. */
async function claimSlot(
  db: Admin,
  startsAt: string,
  write: (agentId: string, endsAt: string) => Promise<{ code?: string; message: string } | null>,
  excludeAppointmentId?: string,
) {
  const ms = Date.parse(startsAt);
  const date = localDate(ms);
  checkDate(date);
  const map = await slotsForDate(db, date, excludeAppointmentId);
  const candidates = map.get(ms) ?? [];
  if (!candidates.length) return { ok: false as const, error: "That time is not available. Please pick another slot." };
  for (const c of candidates) {
    const err = await write(c.agentId, new Date(ms + c.minutes * 60_000).toISOString());
    if (!err) return { ok: true as const };
    if (err.code !== OVERLAP) {
      console.error("appointment write failed", err.message);
      return { ok: false as const, error: "We couldn't save your booking. Please try again." };
    }
  }
  return { ok: false as const, error: TAKEN };
}

const requestSchema = z.object({
  propertyId: z.string().uuid(),
  startsAt: ISO,
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(255),
  phone: z.string().trim().max(40).default(""),
  notes: z.string().trim().max(800).default(""),
});

export const requestAppointment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => requestSchema.parse(input))
  .handler(async ({ data }) => {
    const db = await admin();

    const { data: property } = await db
      .from("properties")
      .select("id, status")
      .eq("id", data.propertyId)
      .maybeSingle();
    if (!property || property.status !== "published") {
      return { ok: false as const, error: "This property is not open for inspections." };
    }

    let { data: lead } = await db.from("leads").select("id").eq("email", data.email).maybeSingle();
    if (!lead) {
      const inserted = await db
        .from("leads")
        .insert({ name: data.name, email: data.email, phone: data.phone, source: "inspection" })
        .select("id")
        .single();
      lead = inserted.data ?? (await db.from("leads").select("id").eq("email", data.email).maybeSingle()).data;
    } else {
      await db.from("leads").update({ name: data.name, ...(data.phone ? { phone: data.phone } : {}) }).eq("id", lead.id);
    }
    if (!lead) return { ok: false as const, error: "We couldn't save your details. Please try again." };
    const leadId = lead.id;

    let token = "";
    const result = await claimSlot(db, data.startsAt, async (agentId, endsAt) => {
      const { data: row, error } = await db
        .from("appointments")
        .insert({
          property_id: data.propertyId,
          lead_id: leadId,
          agent_id: agentId,
          starts_at: data.startsAt,
          ends_at: endsAt,
          notes: data.notes,
        })
        .select("manage_token")
        .single();
      if (error) return error;
      token = row.manage_token;
      return null;
    });
    return result.ok ? { ok: true as const, token } : result;
  });

const APPT_FIELDS =
  "id, starts_at, ends_at, status, notes, cancel_reason, cancelled_by, created_at, lead_id, property:properties(title, slug), agent:agents(name, phone)";

export const getAppointmentByToken = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ token: TOKEN }).parse(input))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: appt, error } = await db
      .from("appointments")
      .select(APPT_FIELDS)
      .eq("manage_token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!appt) return null;
    const { data: history } = await db
      .from("appointments")
      .select("id, starts_at, status, property:properties(title, slug)")
      .eq("lead_id", appt.lead_id)
      .neq("id", appt.id)
      .order("starts_at", { ascending: false })
      .limit(20);
    const { lead_id: _lead, ...rest } = appt;
    return { appointment: { ...rest, changeable: isChangeable(appt.status, appt.starts_at, Date.now()) }, history: history ?? [] };
  });

export const customerReschedule = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ token: TOKEN, startsAt: ISO }).parse(input))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: appt } = await db
      .from("appointments")
      .select("id, status, starts_at")
      .eq("manage_token", data.token)
      .maybeSingle();
    if (!appt) return { ok: false as const, error: "Booking not found." };
    if (!isChangeable(appt.status, appt.starts_at, Date.now())) {
      return { ok: false as const, error: "This booking can no longer be changed." };
    }
    return claimSlot(
      db,
      data.startsAt,
      async (agentId, endsAt) =>
        (
          await db
            .from("appointments")
            .update({ agent_id: agentId, starts_at: data.startsAt, ends_at: endsAt, status: "requested" })
            .eq("id", appt.id)
            .in("status", ["requested", "confirmed"])
        ).error,
      appt.id,
    );
  });

export const customerCancel = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ token: TOKEN, reason: z.string().trim().max(300).default("") }).parse(input),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: appt } = await db
      .from("appointments")
      .select("id, status, starts_at")
      .eq("manage_token", data.token)
      .maybeSingle();
    if (!appt) return { ok: false as const, error: "Booking not found." };
    if (!isChangeable(appt.status, appt.starts_at, Date.now())) {
      return { ok: false as const, error: "This booking can no longer be cancelled." };
    }
    const { error } = await db
      .from("appointments")
      .update({ status: "cancelled", cancel_reason: data.reason, cancelled_by: "customer" })
      .eq("id", appt.id);
    return error ? { ok: false as const, error: "Could not cancel. Please try again." } : { ok: true as const };
  });

/* ---------------------------- Staff (admin) ---------------------------- */

async function assertAdmin(context: { supabase: { rpc: Function }; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const adminListAppointments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ from: ISO, to: ISO }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("appointments")
      .select(
        "id, starts_at, ends_at, status, notes, cancel_reason, cancelled_by, property:properties(title, slug), agent:agents(id, name), lead:leads(name, email, phone)",
      )
      .gte("starts_at", data.from)
      .lt("starts_at", data.to)
      .order("starts_at");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminUpdateAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["confirm", "complete", "cancel", "reschedule"]),
        startsAt: ISO.optional(),
        reason: z.string().trim().max(300).default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const db = context.supabase;
    const { data: appt } = await db.from("appointments").select("id, status, starts_at").eq("id", data.id).maybeSingle();
    if (!appt) return { ok: false as const, error: "Appointment not found." };

    if (data.action === "reschedule") {
      if (!data.startsAt) return { ok: false as const, error: "Pick a new time." };
      if (!isChangeable(appt.status, appt.starts_at, Date.now())) {
        return { ok: false as const, error: "Only upcoming active appointments can be rescheduled." };
      }
      const startsAt = data.startsAt;
      return claimSlot(
        await admin(),
        startsAt,
        async (agentId, endsAt) =>
          (await db.from("appointments").update({ agent_id: agentId, starts_at: startsAt, ends_at: endsAt, status: "confirmed" }).eq("id", appt.id)).error,
        appt.id,
      );
    }

    const to = { confirm: "confirmed", complete: "completed", cancel: "cancelled" }[data.action];
    if (!canTransition(appt.status, to)) {
      return { ok: false as const, error: `A ${appt.status} appointment can't be marked ${to}.` };
    }
    const patch =
      to === "cancelled" ? { status: to, cancel_reason: data.reason, cancelled_by: "staff" } : { status: to };
    const { error } = await db.from("appointments").update(patch).eq("id", appt.id).eq("status", appt.status);
    return error ? { ok: false as const, error: error.message } : { ok: true as const };
  });

export const adminSlotsForDate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), excludeId: z.string().uuid().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!isBookableDate(data.date, Date.now())) return [];
    const map = await slotsForDate(await admin(), data.date, data.excludeId);
    return [...map.keys()].sort((a, b) => a - b).map((ms) => ({ startsAt: new Date(ms).toISOString(), label: formatSlot(ms) }));
  });

/* ------------------------------- Agents ------------------------------- */

export const adminListAgents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("agents")
      .select("*, agent_availability(id, weekday, start_time, end_time)")
      .order("created_at");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const TIME = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/);
const agentSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().max(255).default(""),
  phone: z.string().trim().max(40).default(""),
  slot_minutes: z.number().int().min(15).max(240),
  is_active: z.boolean(),
  availability: z
    .array(z.object({ weekday: z.number().int().min(0).max(6), start_time: TIME, end_time: TIME }))
    .max(28)
    .refine((list) => list.every((a) => a.end_time > a.start_time), "End time must be after start time."),
});

export const adminSaveAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => agentSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { availability, id, ...fields } = data;
    const db = context.supabase;
    const saved = id
      ? await db.from("agents").update(fields).eq("id", id).select("id").single()
      : await db.from("agents").insert({ ...fields, timezone: DEFAULT_TZ }).select("id").single();
    if (saved.error) return { ok: false as const, error: saved.error.message };
    const agentId = saved.data.id;
    const del = await db.from("agent_availability").delete().eq("agent_id", agentId);
    if (del.error) return { ok: false as const, error: del.error.message };
    if (availability.length) {
      const ins = await db.from("agent_availability").insert(availability.map((a) => ({ ...a, agent_id: agentId })));
      if (ins.error) return { ok: false as const, error: ins.error.message };
    }
    return { ok: true as const };
  });
