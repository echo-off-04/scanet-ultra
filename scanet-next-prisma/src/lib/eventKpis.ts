import { prisma } from "./prisma";

export async function syncEventKpis(eventId: string): Promise<void> {
  try {
    const eventContacts = await prisma.contactEvent.findMany({
      where: { eventId },
      include: {
        contact: { select: { status: true } },
      },
    });

    const contactsCount = eventContacts.length;
    const leadsCount = eventContacts.filter(
      (ec: { contact: { status: string | null } }) =>
        ec.contact.status === "lead",
    ).length;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { peopleApproached: true, targetParticipants: true },
    });

    if (!event) return;

    const peopleApproached = event.peopleApproached || 0;
    const conversionRate =
      peopleApproached > 0 ? (contactsCount / peopleApproached) * 100 : 0;

    const targetParticipants = event.targetParticipants || 0;
    const participationRate =
      targetParticipants > 0 ? (contactsCount / targetParticipants) * 100 : 0;

    const performanceScore = calculatePerformanceScore({
      conversionRate,
      participationRate,
      contactsCount,
      targetParticipants,
    });

    await prisma.event.update({
      where: { id: eventId },
      data: {
        contactsAdded: contactsCount,
        leadsGenerated: leadsCount,
        conversionRate,
        performanceScore,
      },
    });
  } catch (error) {
    console.error("Error syncing event KPIs:", error);
    throw error;
  }
}

function calculatePerformanceScore(params: {
  conversionRate: number;
  participationRate: number;
  contactsCount: number;
  targetParticipants: number;
}): number {
  const {
    conversionRate,
    participationRate,
    contactsCount,
    targetParticipants,
  } = params;

  let score = 0;
  score += Math.min(conversionRate * 0.4, 40);
  score += Math.min(participationRate * 0.3, 30);

  if (contactsCount >= targetParticipants * 0.9) {
    score += 20;
  } else if (contactsCount >= targetParticipants * 0.7) {
    score += 15;
  } else if (contactsCount >= targetParticipants * 0.5) {
    score += 10;
  } else if (contactsCount >= targetParticipants * 0.3) {
    score += 5;
  }

  if (contactsCount > 0) {
    score += 10;
  }

  return Math.min(Math.round(score), 100);
}

export async function updateEventPeopleApproached(
  eventId: string,
  newValue: number,
): Promise<void> {
  try {
    await prisma.event.update({
      where: { id: eventId },
      data: { peopleApproached: Math.max(0, newValue) },
    });
    await syncEventKpis(eventId);
  } catch (error) {
    console.error("Error updating people approached:", error);
    throw error;
  }
}
