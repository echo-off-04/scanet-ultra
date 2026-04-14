import { prisma } from "./prisma";
import { convertAllToBaseCurrency } from "./currency";

export interface PersonalObjective {
  id: string;
  userId: string;
  objectiveType:
    | "revenue"
    | "new_contacts"
    | "contacts_by_status"
    | "win_rate"
    | "participation_rate";
  title: string;
  description: string | null;
  targetValue: number;
  currentValue: number;
  unit: "currency" | "number" | "percentage";
  currency: string;
  contactStatusFilter: string | null;
  periodType: "day" | "week" | "month" | "year" | "all_time" | "custom";
  periodStart: Date | null;
  periodEnd: Date | null;
  eventId: string | null;
  status: "active" | "achieved" | "failed" | "cancelled";
  achievedAt: Date | null;
  notified: boolean;
  priority: "low" | "medium" | "high";
  createdAt: Date;
  updatedAt: Date;
}

export function getPeriodDates(
  periodType: string,
  customStart?: Date | null,
  customEnd?: Date | null,
): { start: Date; end: Date } {
  const now = new Date();

  if (customStart && customEnd) {
    return { start: customStart, end: customEnd };
  }

  switch (periodType) {
    case "day": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { start, end };
    }
    case "week": {
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + mondayOffset,
      );
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return { start, end };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { start, end };
    }
    case "year": {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear() + 1, 0, 1);
      return { start, end };
    }
    case "all_time":
    default:
      return { start: new Date(2000, 0, 1), end: new Date(2100, 0, 1) };
  }
}

async function calculateRevenue(
  userId: string,
  currency: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<number> {
  const opportunities = await prisma.contactOpportunity.findMany({
    where: {
      userId,
      status: "won",
      createdAt: { gte: periodStart, lte: periodEnd },
    },
    select: { amount: true, currency: true },
  });

  const items = opportunities.map(
    (o: { amount: number | null; currency: string | null }) => ({
      amount: o.amount,
      currency: o.currency || currency,
    }),
  );
  return convertAllToBaseCurrency(items, currency);
}

async function calculateNewContacts(
  userId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<number> {
  return prisma.contact.count({
    where: {
      userId,
      createdAt: { gte: periodStart, lte: periodEnd },
    },
  });
}

async function calculateContactsByStatus(
  userId: string,
  statusFilter: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<number> {
  return prisma.contact.count({
    where: {
      userId,
      status: statusFilter as any,
      createdAt: { gte: periodStart, lte: periodEnd },
    },
  });
}

async function calculateWinRate(
  userId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<number> {
  const opportunities = await prisma.contactOpportunity.findMany({
    where: {
      userId,
      status: { in: ["won", "lost"] },
      createdAt: { gte: periodStart, lte: periodEnd },
    },
    select: { status: true },
  });

  if (opportunities.length === 0) return 0;

  const won = opportunities.filter(
    (o: { status: string }) => o.status === "won",
  ).length;
  return Math.round((won / opportunities.length) * 100);
}

async function calculateParticipationRate(
  userId: string,
  periodStart: Date,
  periodEnd: Date,
  eventId?: string | null,
): Promise<number> {
  const where: Record<string, unknown> = {
    userId,
    targetParticipants: { gt: 0 },
  };

  if (eventId) where.id = eventId;
  if (periodStart) where.startDate = { gte: periodStart, lte: periodEnd };

  const events = await prisma.event.findMany({
    where: where as any,
    select: { actualParticipants: true, targetParticipants: true },
  });

  if (events.length === 0) return 0;

  const totalActual = events.reduce(
    (sum: number, e: { actualParticipants: number | null }) =>
      sum + (e.actualParticipants || 0),
    0,
  );
  const totalTarget = events.reduce(
    (sum: number, e: { targetParticipants: number | null }) =>
      sum + (e.targetParticipants || 0),
    0,
  );

  if (totalTarget === 0) return 0;
  return Math.round((totalActual / totalTarget) * 100);
}

export function getEffectivePeriodDates(objective: PersonalObjective): {
  start: Date;
  end: Date;
} {
  if (objective.periodType === "custom") {
    return {
      start: objective.periodStart || new Date(2000, 0, 1),
      end: objective.periodEnd || new Date(2100, 0, 1),
    };
  }
  return getPeriodDates(objective.periodType);
}

export async function calculateObjectiveValue(
  objective: PersonalObjective,
): Promise<number> {
  const { start, end } = getEffectivePeriodDates(objective);

  switch (objective.objectiveType) {
    case "revenue":
      return calculateRevenue(objective.userId, objective.currency, start, end);
    case "new_contacts":
      return calculateNewContacts(objective.userId, start, end);
    case "contacts_by_status":
      return calculateContactsByStatus(
        objective.userId,
        objective.contactStatusFilter || "lead",
        start,
        end,
      );
    case "win_rate":
      return calculateWinRate(objective.userId, start, end);
    case "participation_rate":
      return calculateParticipationRate(
        objective.userId,
        start,
        end,
        objective.eventId,
      );
    default:
      return 0;
  }
}

export async function refreshAllObjectives(
  userId: string,
): Promise<PersonalObjective[]> {
  const objectives = await prisma.personalObjective.findMany({
    where: { userId, status: "active" },
  });

  const updated: PersonalObjective[] = [];

  for (const obj of objectives) {
    const mapped = obj as unknown as PersonalObjective;
    const currentValue = await calculateObjectiveValue(mapped);
    const isAchieved = currentValue >= obj.targetValue;
    const wasAlreadyAchieved = obj.status === "achieved";

    if (
      currentValue !== obj.currentValue ||
      (isAchieved && !wasAlreadyAchieved)
    ) {
      const updateData: Record<string, unknown> = { currentValue };

      if (isAchieved && !wasAlreadyAchieved) {
        updateData.status = "achieved";
        updateData.achievedAt = new Date();
      }

      await prisma.personalObjective.update({
        where: { id: obj.id },
        data: updateData as any,
      });

      updated.push({
        ...mapped,
        currentValue,
        status: isAchieved ? "achieved" : mapped.status,
        achievedAt: isAchieved ? new Date() : mapped.achievedAt,
      });
    } else {
      updated.push(mapped);
    }
  }

  return updated;
}

export function getObjectiveProgress(objective: PersonalObjective): number {
  if (objective.targetValue <= 0) return 0;
  return Math.min(
    100,
    Math.round((objective.currentValue / objective.targetValue) * 100),
  );
}

export const OBJECTIVE_TYPE_CONFIG = {
  revenue: {
    label: "Chiffre d'affaires",
    description: "Revenus des opportunités gagnées",
    unit: "currency" as const,
    icon: "DollarSign",
    color: "#10b981",
  },
  new_contacts: {
    label: "Nouveaux contacts",
    description: "Nombre de contacts ajoutés",
    unit: "number" as const,
    icon: "Users",
    color: "#3b82f6",
  },
  contacts_by_status: {
    label: "Contacts par statut",
    description: "Nombre de contacts d'un statut spécifique",
    unit: "number" as const,
    icon: "UserPlus",
    color: "#f59e0b",
  },
  win_rate: {
    label: "Taux de victoire",
    description: "Pourcentage d'opportunités gagnées",
    unit: "percentage" as const,
    icon: "Trophy",
    color: "#ef4444",
  },
  participation_rate: {
    label: "Taux de participation",
    description: "Participation moyenne aux événements",
    unit: "percentage" as const,
    icon: "Calendar",
    color: "#8b5cf6",
  },
} as const;

export const CONTACT_STATUS_LABELS: Record<string, string> = {
  lead: "Leads",
  prospect: "Prospects",
  client: "Clients",
  partner: "Partenaires",
  collaborateur: "Collaborateurs",
  ami: "Ami(e)s",
  fournisseur: "Fournisseurs",
};

export const PERIOD_LABELS: Record<string, string> = {
  day: "par jour",
  week: "par semaine",
  month: "par mois",
  year: "par an",
  all_time: "au total",
};
