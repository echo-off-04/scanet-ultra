import { prisma } from "./prisma";
import type {
  NotificationCategory,
  NotificationPriority,
} from "@prisma/client";

interface CreateNotificationParams {
  userId: string;
  type: string;
  category: NotificationCategory;
  title: string;
  message: string;
  actionUrl?: string;
  priority?: NotificationPriority;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
}

export async function createNotification({
  userId,
  type,
  category,
  title,
  message,
  actionUrl,
  priority = "medium",
  metadata,
  expiresAt,
}: CreateNotificationParams) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        category,
        title,
        message,
        actionUrl,
        priority,
        metadata: (metadata ?? undefined) as
          | import("@prisma/client").Prisma.InputJsonValue
          | undefined,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

export async function notifyContactCreated(
  userId: string,
  contactName: string,
  contactId: string,
) {
  await createNotification({
    userId,
    type: "contact_created",
    category: "contacts",
    title: "Nouveau contact ajouté",
    message: `Le contact ${contactName} a été ajouté avec succès`,
    actionUrl: `/contacts/${contactId}`,
    priority: "low",
    metadata: { contact_id: contactId, contact_name: contactName },
  });
}

export async function notifyContactUpdated(
  userId: string,
  contactName: string,
  contactId: string,
) {
  await createNotification({
    userId,
    type: "contact_updated",
    category: "contacts",
    title: "Contact mis à jour",
    message: `Les informations de ${contactName} ont été mises à jour`,
    actionUrl: `/contacts/${contactId}`,
    priority: "low",
    metadata: { contact_id: contactId, contact_name: contactName },
  });
}

export async function notifyOpportunityStatusChanged(
  userId: string,
  opportunityTitle: string,
  newStatus: string,
  opportunityId: string,
  value?: number,
) {
  const priority: NotificationPriority =
    newStatus === "won" ? "high" : newStatus === "lost" ? "medium" : "low";
  const isHighValue = value && value > 10000;

  await createNotification({
    userId,
    type: "opportunity_status_changed",
    category: "opportunities",
    title:
      newStatus === "won"
        ? "🎉 Opportunité gagnée !"
        : newStatus === "lost"
          ? "Opportunité perdue"
          : "Statut d'opportunité modifié",
    message: isHighValue
      ? `L'opportunité "${opportunityTitle}" (${value}€) a été ${newStatus === "won" ? "gagnée" : "perdue"}`
      : `L'opportunité "${opportunityTitle}" est maintenant ${newStatus}`,
    actionUrl: `/opportunities/${opportunityId}`,
    priority,
    metadata: { opportunity_id: opportunityId, status: newStatus, value },
  });
}

export async function notifyHighValueOpportunity(
  userId: string,
  opportunityTitle: string,
  value: number,
  opportunityId: string,
) {
  await createNotification({
    userId,
    type: "high_value_opportunity",
    category: "opportunities",
    title: "💰 Opportunité haute valeur",
    message: `Nouvelle opportunité "${opportunityTitle}" d'une valeur de ${value}€`,
    actionUrl: `/opportunities/${opportunityId}`,
    priority: "high",
    metadata: { opportunity_id: opportunityId, value },
  });
}

export async function notifyEventCreated(
  userId: string,
  eventName: string,
  eventId: string,
) {
  await createNotification({
    userId,
    type: "event_created",
    category: "events",
    title: "📅 Nouvel événement",
    message: `L'événement "${eventName}" a été créé`,
    actionUrl: `/events/${eventId}`,
    priority: "low",
    metadata: { event_id: eventId },
  });
}

export async function notifyEventStartingSoon(
  userId: string,
  eventName: string,
  eventId: string,
) {
  await createNotification({
    userId,
    type: "event_starting_soon",
    category: "events",
    title: "📅 Événement imminent",
    message: `L'événement "${eventName}" commence bientôt`,
    actionUrl: `/events/${eventId}`,
    priority: "high",
    metadata: { event_id: eventId },
  });
}

export async function notifyFollowUpDue(
  userId: string,
  title: string,
  contactName: string,
  followUpId: string,
) {
  await createNotification({
    userId,
    type: "follow_up_due",
    category: "follow_ups",
    title: "⏰ Relance à effectuer",
    message: `"${title}" pour ${contactName}`,
    actionUrl: `/follow-ups/${followUpId}`,
    priority: "medium",
    metadata: { follow_up_id: followUpId },
  });
}

export async function notifyOpportunityClosingSoon(
  userId: string,
  opportunityTitle: string,
  opportunityId: string,
  amount?: number,
) {
  await createNotification({
    userId,
    type: "opportunity_closing_soon",
    category: "opportunities",
    title: "📊 Clôture proche",
    message: `L'opportunité "${opportunityTitle}"${amount ? ` (${amount}€)` : ""} arrive à échéance cette semaine`,
    actionUrl: `/opportunities/${opportunityId}`,
    priority: "medium",
    metadata: { opportunity_id: opportunityId, amount },
  });
}

export async function notifyContactRegisteredViaQR(
  userId: string,
  contactName: string,
  eventName: string,
  contactId: string,
) {
  await createNotification({
    userId,
    type: "contact_registered_qr",
    category: "contacts",
    title: "📱 Inscription QR",
    message: `${contactName} s'est inscrit(e) via QR code à "${eventName}"`,
    actionUrl: `/contacts/${contactId}`,
    priority: "medium",
    metadata: { contact_id: contactId, event_name: eventName },
  });
}
