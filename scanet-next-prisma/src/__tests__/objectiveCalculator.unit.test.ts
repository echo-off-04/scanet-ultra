import { describe, it, expect } from "vitest";
import {
  getPeriodDates,
  getObjectiveProgress,
  OBJECTIVE_TYPE_CONFIG,
  CONTACT_STATUS_LABELS,
  PERIOD_LABELS,
  type PersonalObjective,
} from "@/lib/objectiveCalculator";

const makeObjective = (
  overrides: Partial<PersonalObjective> = {},
): PersonalObjective => ({
  id: "test-id",
  userId: "user-id",
  objectiveType: "new_contacts",
  title: "Test Objective",
  description: null,
  targetValue: 100,
  currentValue: 50,
  unit: "number",
  currency: "EUR",
  contactStatusFilter: null,
  periodType: "month",
  periodStart: null,
  periodEnd: null,
  eventId: null,
  status: "active",
  achievedAt: null,
  notified: false,
  priority: "medium",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("getPeriodDates", () => {
  it("returns custom dates when both customStart and customEnd are provided", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const end = new Date("2026-06-30T23:59:59Z");
    const result = getPeriodDates("custom", start, end);
    expect(result.start.toISOString()).toBe(new Date(start).toISOString());
    expect(result.end.toISOString()).toBe(new Date(end).toISOString());
  });

  it('returns today start/end for "day" period', () => {
    const now = new Date();
    const result = getPeriodDates("day");
    expect(result.start.getFullYear()).toBe(now.getFullYear());
    expect(result.start.getMonth()).toBe(now.getMonth());
    expect(result.start.getDate()).toBe(now.getDate());
    expect(result.start.getHours()).toBe(0);
    expect(result.start.getMinutes()).toBe(0);

    const expectedEnd = new Date(result.start);
    expectedEnd.setDate(expectedEnd.getDate() + 1);
    expect(result.end.getTime()).toBe(expectedEnd.getTime());
  });

  it('returns week boundaries starting on Monday for "week" period', () => {
    const result = getPeriodDates("week");
    expect(result.start.getDay()).not.toBe(0);
    const dayDiff =
      (result.end.getTime() - result.start.getTime()) / (1000 * 60 * 60 * 24);
    expect(dayDiff).toBe(7);
  });

  it('returns first and last day of current month for "month" period', () => {
    const now = new Date();
    const result = getPeriodDates("month");
    expect(result.start.getDate()).toBe(1);
    expect(result.start.getMonth()).toBe(now.getMonth());
    expect(result.end.getDate()).toBe(1);
    expect(result.end.getMonth()).toBe((now.getMonth() + 1) % 12);
  });

  it('returns jan 1 to jan 1 next year for "year" period', () => {
    const now = new Date();
    const result = getPeriodDates("year");
    expect(result.start.getMonth()).toBe(0);
    expect(result.start.getDate()).toBe(1);
    expect(result.start.getFullYear()).toBe(now.getFullYear());
    expect(result.end.getFullYear()).toBe(now.getFullYear() + 1);
    expect(result.end.getMonth()).toBe(0);
    expect(result.end.getDate()).toBe(1);
  });

  it('returns wide range for "all_time" period', () => {
    const result = getPeriodDates("all_time");
    expect(result.start.getFullYear()).toBe(2000);
    expect(result.end.getFullYear()).toBe(2100);
  });

  it("defaults to all_time for unknown period type", () => {
    const result = getPeriodDates("unknown_type");
    expect(result.start.getFullYear()).toBe(2000);
    expect(result.end.getFullYear()).toBe(2100);
  });

  it('uses custom dates even if periodType is not "custom"', () => {
    const start = new Date("2025-03-01T00:00:00Z");
    const end = new Date("2025-03-31T23:59:59Z");
    const result = getPeriodDates("month", start, end);
    expect(result.start.toISOString()).toBe(new Date(start).toISOString());
    expect(result.end.toISOString()).toBe(new Date(end).toISOString());
  });
});

describe("getObjectiveProgress", () => {
  it("returns 0 when target_value is 0", () => {
    const obj = makeObjective({ targetValue: 0, currentValue: 50 });
    expect(getObjectiveProgress(obj)).toBe(0);
  });

  it("returns 0 when target_value is negative", () => {
    const obj = makeObjective({ targetValue: -10, currentValue: 5 });
    expect(getObjectiveProgress(obj)).toBe(0);
  });

  it("returns 50 when half completed", () => {
    const obj = makeObjective({ targetValue: 100, currentValue: 50 });
    expect(getObjectiveProgress(obj)).toBe(50);
  });

  it("returns 100 when fully completed", () => {
    const obj = makeObjective({ targetValue: 100, currentValue: 100 });
    expect(getObjectiveProgress(obj)).toBe(100);
  });

  it("caps at 100 when current exceeds target", () => {
    const obj = makeObjective({ targetValue: 50, currentValue: 200 });
    expect(getObjectiveProgress(obj)).toBe(100);
  });

  it("returns 0 when current_value is 0", () => {
    const obj = makeObjective({ targetValue: 100, currentValue: 0 });
    expect(getObjectiveProgress(obj)).toBe(0);
  });

  it("rounds to nearest integer", () => {
    const obj = makeObjective({ targetValue: 3, currentValue: 1 });
    expect(getObjectiveProgress(obj)).toBe(33);
  });

  it("handles percentage objectives correctly", () => {
    const obj = makeObjective({
      objectiveType: "win_rate",
      unit: "percentage",
      targetValue: 80,
      currentValue: 60,
    });
    expect(getObjectiveProgress(obj)).toBe(75);
  });
});

describe("OBJECTIVE_TYPE_CONFIG", () => {
  it("contains all 5 objective types", () => {
    const types = Object.keys(OBJECTIVE_TYPE_CONFIG);
    expect(types).toHaveLength(5);
    expect(types).toContain("revenue");
    expect(types).toContain("new_contacts");
    expect(types).toContain("contacts_by_status");
    expect(types).toContain("win_rate");
    expect(types).toContain("participation_rate");
  });

  it("each type has required fields", () => {
    for (const config of Object.values(OBJECTIVE_TYPE_CONFIG)) {
      expect(config).toHaveProperty("label");
      expect(config).toHaveProperty("description");
      expect(config).toHaveProperty("unit");
      expect(config).toHaveProperty("icon");
      expect(config).toHaveProperty("color");
      expect(typeof config.label).toBe("string");
      expect(typeof config.description).toBe("string");
      expect(["currency", "number", "percentage"]).toContain(config.unit);
    }
  });

  it("revenue type uses currency unit", () => {
    expect(OBJECTIVE_TYPE_CONFIG.revenue.unit).toBe("currency");
  });

  it("win_rate and participation_rate use percentage unit", () => {
    expect(OBJECTIVE_TYPE_CONFIG.win_rate.unit).toBe("percentage");
    expect(OBJECTIVE_TYPE_CONFIG.participation_rate.unit).toBe("percentage");
  });

  it("new_contacts and contacts_by_status use number unit", () => {
    expect(OBJECTIVE_TYPE_CONFIG.new_contacts.unit).toBe("number");
    expect(OBJECTIVE_TYPE_CONFIG.contacts_by_status.unit).toBe("number");
  });
});

describe("CONTACT_STATUS_LABELS", () => {
  it("contains all 7 status labels", () => {
    const statuses = Object.keys(CONTACT_STATUS_LABELS);
    expect(statuses).toHaveLength(7);
    expect(statuses).toContain("lead");
    expect(statuses).toContain("prospect");
    expect(statuses).toContain("client");
    expect(statuses).toContain("partner");
    expect(statuses).toContain("collaborateur");
    expect(statuses).toContain("ami");
    expect(statuses).toContain("fournisseur");
  });

  it("all values are non-empty strings", () => {
    for (const label of Object.values(CONTACT_STATUS_LABELS)) {
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

describe("PERIOD_LABELS", () => {
  it("contains all 5 period labels", () => {
    const periods = Object.keys(PERIOD_LABELS);
    expect(periods).toHaveLength(5);
    expect(periods).toContain("day");
    expect(periods).toContain("week");
    expect(periods).toContain("month");
    expect(periods).toContain("year");
    expect(periods).toContain("all_time");
  });

  it("all values are non-empty strings", () => {
    for (const label of Object.values(PERIOD_LABELS)) {
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    }
  });
});
