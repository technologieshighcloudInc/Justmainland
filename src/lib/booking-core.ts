/**
 * Pure, timezone-aware slot maths shared by the booking server functions.
 * All instants are UTC epoch milliseconds; wall-clock values are interpreted
 * in the agent's IANA timezone (default Africa/Lagos).
 */

export const DEFAULT_TZ = "Africa/Lagos";
export const BOOKING_WINDOW_DAYS = 60;
export const MIN_NOTICE_MINUTES = 60;

export type Window = { weekday: number; start_time: string; end_time: string };
export type Busy = { start: number; end: number };

function partsInTz(ms: number, tz: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p: Record<string, number> = {};
  for (const part of fmt.formatToParts(new Date(ms))) {
    if (part.type !== "literal") p[part.type] = Number(part.value);
  }
  return p as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

/** Offset (ms) of `tz` from UTC at instant `ms`. */
export function tzOffset(ms: number, tz: string) {
  const p = partsInTz(ms, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(ms / 1000) * 1000;
}

/** Converts a wall-clock date ("YYYY-MM-DD") and time ("HH:MM") in `tz` to a UTC instant. */
export function zonedToUtc(date: string, time: string, tz: string = DEFAULT_TZ) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y!, m! - 1, d!, hh!, mm!);
  let result = guess - tzOffset(guess, tz);
  result = guess - tzOffset(result, tz);
  return result;
}

/** Local calendar date ("YYYY-MM-DD") of an instant in `tz`. */
export function localDate(ms: number, tz: string = DEFAULT_TZ) {
  const p = partsInTz(ms, tz);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function weekdayOf(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
}

export function addDays(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y!, m! - 1, d! + days));
  return t.toISOString().slice(0, 10);
}

/** True when `date` lies between today and the booking window (in `tz`). */
export function isBookableDate(date: string, nowMs: number, tz: string = DEFAULT_TZ) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const today = localDate(nowMs, tz);
  return date >= today && date <= addDays(today, BOOKING_WINDOW_DAYS);
}

/** Free slot start instants for one agent on one local date. */
export function generateSlots(opts: {
  date: string;
  tz: string;
  slotMinutes: number;
  windows: Window[];
  busy: Busy[];
  nowMs: number;
  minNoticeMinutes?: number;
}) {
  const { date, tz, slotMinutes, windows, busy, nowMs } = opts;
  const notice = (opts.minNoticeMinutes ?? MIN_NOTICE_MINUTES) * 60_000;
  const step = slotMinutes * 60_000;
  const weekday = weekdayOf(date);
  const out: number[] = [];
  for (const w of windows) {
    if (w.weekday !== weekday) continue;
    const startMs = zonedToUtc(date, w.start_time.slice(0, 5), tz);
    const endMs = zonedToUtc(date, w.end_time.slice(0, 5), tz);
    for (let t = startMs; t + step <= endMs; t += step) {
      if (t < nowMs + notice) continue;
      const clash = busy.some((b) => t < b.end && t + step > b.start);
      if (!clash) out.push(t);
    }
  }
  return [...new Set(out)].sort((a, b) => a - b);
}

export function formatSlot(ms: number, tz: string = DEFAULT_TZ) {
  return new Intl.DateTimeFormat("en-NG", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms));
}

export function formatDateTime(iso: string, tz: string = DEFAULT_TZ) {
  return new Intl.DateTimeFormat("en-NG", {
    timeZone: tz,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Allowed status transitions. Customers may only cancel; staff may also confirm/complete. */
export const TRANSITIONS: Record<string, string[]> = {
  requested: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  cancelled: [],
  completed: [],
};

export function canTransition(from: string, to: string) {
  return (TRANSITIONS[from] ?? []).includes(to);
}

/** Whether an appointment can still be rescheduled or cancelled. */
export function isChangeable(status: string, startsAtIso: string, nowMs: number) {
  return (status === "requested" || status === "confirmed") && new Date(startsAtIso).getTime() > nowMs;
}
