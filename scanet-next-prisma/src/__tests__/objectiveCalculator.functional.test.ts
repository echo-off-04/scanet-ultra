import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  calculateObjectiveValue,
  getEffectivePeriodDates,
  type PersonalObjective,
} from "@/lib/objectiveCalculator";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    contact: {
      count: vi.fn().mockResolvedValue(0),
    },
    contactOpportunity: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    event: {
      count: vi.fn().mockResolvedValue(0),
    },
    contactEvent: {
      count: vi.fn().mockResolvedValue(0),
    },
    personalObjective: {
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock("@/lib/currency", () => ({
  convertAllToBaseCurrency: vi.fn(
    async (items: Array<{ amount: number | null }>) => {
      return items.reduce((sum, i) => sum + (i.amount || 0), 0);
    },
  ),
}));

const makeObjective = (
  overrides: Partial<PersonalObjective> = {},
): PersonalObjective => ({
  id: "obj-1",
  userId: "user-1",
  objectiveType: "new_contacts",
  title: "Test",
  description: null,
  targetValue: 10,
  currentValue: 0,
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

describe("getEffectivePeriodDates", () => {
  it("returns period dates based on objective periodType", () => {
    const obj = makeObjective({ periodType: "month" });
    const result = getEffectivePeriodDates(obj);
    expect(result).toHaveProperty("start");
    expect(result).toHaveProperty("end");
    expect(result.start).toBeInstanceOf(Date);
    expect(result.end).toBeInstanceOf(Date);
    expect(result.start.getDate()).toBe(1);
  });

  it("uses custom dates when periodStart and periodEnd are set", () => {
    const obj = makeObjective({
      periodType: "custom",
      periodStart: new Date("2026-01-01"),
      periodEnd: new Date("2026-06-30"),
    });
    const result = getEffectivePeriodDates(obj);
    expect(result.start.toISOString()).toContain("2026-01-01");
    expect(result.end.toISOString()).toContain("2026-06-30");
  });
});

describe("calculateObjectiveValue (functional)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 0 for unknown objective type", async () => {
    const obj = makeObjective({
      objectiveType: "unknown" as unknown as PersonalObjective["objectiveType"],
    });
    const result = await calculateObjectiveValue(obj);
    expect(result).toBe(0);
  });

  it("calls prisma contact.count for new_contacts type", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.contact.count).mockResolvedValue(15);

    const obj = makeObjective({ objectiveType: "new_contacts" });
    const result = await calculateObjectiveValue(obj);
    expect(prisma.contact.count).toHaveBeenCalled();
    expect(result).toBe(15);
  });

  it("calls prisma contact.count for contacts_by_status type", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.contact.count).mockResolvedValue(5);

    const obj = makeObjective({
      objectiveType: "contacts_by_status",
      contactStatusFilter: "client",
    });
    const result = await calculateObjectiveValue(obj);
    expect(prisma.contact.count).toHaveBeenCalled();
    expect(result).toBe(5);
  });

  it("calculates revenue from won opportunities", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.contactOpportunity.findMany).mockResolvedValue([
      { id: "1", amount: 1000, currency: "EUR" } as never,
      { id: "2", amount: 500, currency: "EUR" } as never,
    ]);

    const obj = makeObjective({ objectiveType: "revenue", currency: "EUR" });
    const result = await calculateObjectiveValue(obj);
    expect(prisma.contactOpportunity.findMany).toHaveBeenCalled();
    expect(result).toBe(1500);
  });
});
