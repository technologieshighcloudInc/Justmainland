import { describe, expect, it } from "vitest";

import {
  canTransition,
  generateSlots,
  isBookableDate,
  isChangeable,
  zonedToUtc,
} from "./booking-core";

const windows = [{ weekday: 1, start_time: "09:00", end_time: "12:00" }]; // Monday 9–12
const MONDAY = "2026-10-19";

describe("timezone handling", () => {
  it("treats 09:00 in Lagos as 08:00 UTC", () => {
    expect(new Date(zonedToUtc(MONDAY, "09:00", "Africa/Lagos")).toISOString()).toBe(
      "2026-10-19T08:00:00.000Z",
    );
  });
});

describe("slot generation", () => {
  const now = Date.parse("2026-10-18T12:00:00Z");

  it("splits availability into hourly slots", () => {
    const slots = generateSlots({ date: MONDAY, tz: "Africa/Lagos", slotMinutes: 60, windows, busy: [], nowMs: now });
    expect(slots.map((s) => new Date(s).toISOString())).toEqual([
      "2026-10-19T08:00:00.000Z",
      "2026-10-19T09:00:00.000Z",
      "2026-10-19T10:00:00.000Z",
    ]);
  });

  it("hides slots that are already booked", () => {
    const busy = [{ start: Date.parse("2026-10-19T09:00:00Z"), end: Date.parse("2026-10-19T10:00:00Z") }];
    const slots = generateSlots({ date: MONDAY, tz: "Africa/Lagos", slotMinutes: 60, windows, busy, nowMs: now });
    expect(slots).toHaveLength(2);
    expect(slots).not.toContain(Date.parse("2026-10-19T09:00:00Z"));
  });

  it("offers nothing on days without availability", () => {
    expect(generateSlots({ date: "2026-10-18", tz: "Africa/Lagos", slotMinutes: 60, windows, busy: [], nowMs: now })).toEqual([]);
  });

  it("requires at least one hour of notice", () => {
    const soon = Date.parse("2026-10-19T08:30:00Z");
    const slots = generateSlots({ date: MONDAY, tz: "Africa/Lagos", slotMinutes: 60, windows, busy: [], nowMs: soon });
    expect(slots[0]).toBe(Date.parse("2026-10-19T10:00:00Z"));
  });
});

describe("booking window", () => {
  const now = Date.parse("2026-10-16T18:00:00Z");
  it("rejects past dates", () => expect(isBookableDate("2026-10-15", now)).toBe(false));
  it("allows up to 60 days ahead", () => expect(isBookableDate("2026-12-15", now)).toBe(true));
  it("rejects beyond 60 days", () => expect(isBookableDate("2026-12-16", now)).toBe(false));
});

describe("status rules", () => {
  it("cannot reopen a cancelled appointment", () => expect(canTransition("cancelled", "confirmed")).toBe(false));
  it("can confirm a request", () => expect(canTransition("requested", "confirmed")).toBe(true));
  it("cannot change a past appointment", () =>
    expect(isChangeable("confirmed", "2026-10-01T08:00:00Z", Date.parse("2026-10-16T00:00:00Z"))).toBe(false));
});
