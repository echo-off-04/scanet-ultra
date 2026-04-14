import type {
  EmailSequence,
  EmailSequenceEnrollment,
  EmailSequenceStep,
  Prisma,
} from "@prisma/client";

type SequenceState = {
  isActive: boolean;
  status: "draft" | "active" | "paused" | "archived";
};

type SequenceInput = Record<string, unknown>;

type ContactForSequence = {
  id: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  company: string | null;
  jobTitle: string | null;
  source: string | null;
  status: string | null;
};

type SequenceForMatch = Pick<
  EmailSequence,
  | "id"
  | "isActive"
  | "status"
  | "triggerType"
  | "triggerStatus"
  | "sourceFilter"
  | "excludeStatuses"
> & {
  steps: Pick<
    EmailSequenceStep,
    | "id"
    | "stepOrder"
    | "delayDays"
    | "delayHours"
    | "subject"
    | "body"
    | "channel"
    | "includeOfferId"
  >[];
};

type PrismaLike = Prisma.TransactionClient;

export function normalizeSequenceState(
  input: SequenceInput,
  existing?: Pick<EmailSequence, "isActive" | "status">,
): SequenceState {
  const explicitStatus =
    typeof input.status === "string" ? input.status.toLowerCase() : undefined;

  if (explicitStatus === "active") {
    return { isActive: true, status: "active" };
  }

  if (explicitStatus === "paused") {
    return { isActive: false, status: "paused" };
  }

  if (explicitStatus === "archived") {
    return { isActive: false, status: "archived" };
  }

  if (explicitStatus === "draft") {
    return { isActive: false, status: "draft" };
  }

  const rawIsActive = input.is_active ?? input.isActive;
  if (typeof rawIsActive === "boolean") {
    return {
      isActive: rawIsActive,
      status: rawIsActive ? "active" : "paused",
    };
  }

  if (existing) {
    return {
      isActive: existing.isActive,
      status: existing.status,
    };
  }

  return { isActive: true, status: "active" };
}

export function normalizeSequencePayload(
  input: SequenceInput,
  existing?: Pick<
    EmailSequence,
    | "name"
    | "description"
    | "triggerType"
    | "triggerStatus"
    | "sourceFilter"
    | "excludeStatuses"
    | "isActive"
    | "status"
  >,
) {
  const state = normalizeSequenceState(input, existing);

  const triggerStatus =
    typeof (input.trigger_status ?? input.triggerStatus) === "string"
      ? String(input.trigger_status ?? input.triggerStatus)
      : existing?.triggerStatus ?? null;

  const sourceFilter =
    typeof (input.source_filter ?? input.sourceFilter) === "string"
      ? String(input.source_filter ?? input.sourceFilter) || null
      : existing?.sourceFilter ?? null;

  const rawExcludeStatuses = input.exclude_statuses ?? input.excludeStatuses;
  const excludeStatuses = Array.isArray(rawExcludeStatuses)
    ? rawExcludeStatuses.filter(
        (value): value is string => typeof value === "string" && value.length > 0,
      )
    : existing?.excludeStatuses ?? [];

  const rawTriggerType = input.trigger_type ?? input.triggerType;
  const triggerType =
    rawTriggerType === "manual" ||
    rawTriggerType === "on_event" ||
    rawTriggerType === "on_status"
      ? rawTriggerType
      : triggerStatus
        ? "on_status"
        : sourceFilter === "event"
          ? "on_event"
          : existing?.triggerType ?? "manual";

  return {
    name:
      typeof input.name === "string"
        ? input.name
        : existing?.name ?? "",
    description:
      typeof input.description === "string"
        ? input.description || null
        : existing?.description ?? null,
    triggerType,
    triggerStatus,
    sourceFilter,
    excludeStatuses,
    isActive: state.isActive,
    status: state.status,
  };
}

export function contactMatchesSequence(
  contact: Pick<ContactForSequence, "status" | "source">,
  sequence: Pick<
    SequenceForMatch,
    | "isActive"
    | "status"
    | "triggerType"
    | "triggerStatus"
    | "sourceFilter"
    | "excludeStatuses"
  >,
) {
  if (!sequence.isActive || sequence.status !== "active") {
    return false;
  }

  if (sequence.triggerType === "manual") {
    return false;
  }

  if (sequence.triggerStatus && sequence.triggerStatus !== "all") {
    if ((contact.status ?? null) !== sequence.triggerStatus) {
      return false;
    }
  }

  if (sequence.sourceFilter && (contact.source ?? null) !== sequence.sourceFilter) {
    return false;
  }

  if (contact.status && sequence.excludeStatuses.includes(contact.status)) {
    return false;
  }

  return true;
}

export function buildTemplateVariables(args: {
  contact: Pick<ContactForSequence, "fullName" | "email" | "company" | "jobTitle" | "source">;
  senderName?: string | null;
  senderCompany?: string | null;
  eventName?: string | null;
  metAtDate?: string | null;
}) {
  const fullName = args.contact.fullName ?? "";
  const firstName = fullName.split(" ").filter(Boolean)[0] ?? fullName;

  return {
    prenom: firstName,
    first_name: firstName,
    nom_complet: fullName,
    full_name: fullName,
    entreprise: args.contact.company ?? "",
    company: args.contact.company ?? "",
    poste: args.contact.jobTitle ?? "",
    job_title: args.contact.jobTitle ?? "",
    email: args.contact.email ?? "",
    source: args.contact.source ?? "",
    evenement: args.eventName ?? "",
    event: args.eventName ?? "",
    date_rencontre: args.metAtDate ?? "",
    meeting_date: args.metAtDate ?? "",
    mon_nom: args.senderName ?? "",
    expediteur: args.senderName ?? "",
    sender_name: args.senderName ?? "",
    sender_company: args.senderCompany ?? "",
  };
}

export function renderTemplate(
  template: string,
  variables: Record<string, string>,
) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => {
    return variables[key] ?? "";
  });
}

export async function scheduleSequenceSends(
  db: PrismaLike,
  args: {
    enrollmentId: string;
    enrolledAt: Date;
    steps: Pick<
      EmailSequenceStep,
      "id" | "stepOrder" | "delayDays" | "delayHours"
    >[];
  },
) {
  if (args.steps.length === 0) {
    return;
  }

  let cumulativeMs = 0;
  const sends = args.steps
    .sort((left, right) => left.stepOrder - right.stepOrder)
    .map((step) => {
      cumulativeMs +=
        step.delayDays * 24 * 60 * 60 * 1000 +
        step.delayHours * 60 * 60 * 1000;

      return {
        enrollmentId: args.enrollmentId,
        stepId: step.id,
        status: "pending" as const,
        scheduledFor: new Date(args.enrolledAt.getTime() + cumulativeMs),
      };
    });

  await db.emailSequenceSend.createMany({ data: sends });
}

export async function enrollContactInMatchingSequences(
  db: PrismaLike,
  contact: ContactForSequence,
) {
  const sequences = await db.emailSequence.findMany({
    where: {
      userId: contact.userId,
      isActive: true,
      status: "active",
    },
    include: {
      steps: {
        orderBy: { stepOrder: "asc" },
        select: {
          id: true,
          stepOrder: true,
          delayDays: true,
          delayHours: true,
          subject: true,
          body: true,
          channel: true,
          includeOfferId: true,
        },
      },
    },
  });

  const matchingSequences = sequences.filter((sequence) =>
    contactMatchesSequence(contact, sequence),
  );

  for (const sequence of matchingSequences) {
    const existing = await db.emailSequenceEnrollment.findFirst({
      where: {
        sequenceId: sequence.id,
        contactId: contact.id,
        status: { in: ["active", "paused"] },
      },
      select: { id: true },
    });

    if (existing) {
      continue;
    }

    const enrolledAt = new Date();
    const enrollment = await db.emailSequenceEnrollment.create({
      data: {
        sequenceId: sequence.id,
        contactId: contact.id,
        userId: contact.userId,
        status: "active",
        currentStep: 0,
        enrolledAt,
        triggerContext: {
          status: contact.status,
          source: contact.source,
          enrolled_at: enrolledAt.toISOString(),
        },
      },
    });

    await scheduleSequenceSends(db, {
      enrollmentId: enrollment.id,
      enrolledAt,
      steps: sequence.steps,
    });
  }
}

export function normalizeEnrollment(
  enrollment: EmailSequenceEnrollment & {
    contact?: {
      fullName: string | null;
      email: string | null;
      phone: string | null;
      company: string | null;
    } | null;
    sends?: Array<{
      id: string;
      stepId: string;
      status: string;
      scheduledFor: Date | null;
      sentAt: Date | null;
    }>;
  },
) {
  return {
    id: enrollment.id,
    sequence_id: enrollment.sequenceId,
    contact_id: enrollment.contactId,
    user_id: enrollment.userId,
    status: enrollment.status,
    current_step: enrollment.currentStep,
    enrolled_at: enrollment.enrolledAt.toISOString(),
    completed_at: enrollment.completedAt?.toISOString() ?? null,
    trigger_context: enrollment.triggerContext,
    created_at: enrollment.createdAt.toISOString(),
    contact: enrollment.contact
      ? {
          full_name: enrollment.contact.fullName,
          email: enrollment.contact.email,
          phone: enrollment.contact.phone,
          company: enrollment.contact.company,
        }
      : null,
    sends:
      enrollment.sends?.map((send) => ({
        id: send.id,
        step_id: send.stepId,
        status: send.status,
        scheduled_for: send.scheduledFor?.toISOString() ?? null,
        sent_at: send.sentAt?.toISOString() ?? null,
      })) ?? [],
  };
}