import { supabase } from './supabase';
import type { NotificationCategory, NotificationPriority } from '../contexts/NotificationContext';

interface CreateNotificationParams {
  userId: string;
  type: string;
  category: NotificationCategory;
  title: string;
  message: string;
  actionUrl?: string;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
  expiresAt?: string;
}

export async function createNotification({
  userId,
  type,
  category,
  title,
  message,
  actionUrl,
  priority = 'medium',
  metadata,
  expiresAt
}: CreateNotificationParams) {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    category,
    title,
    message,
    action_url: actionUrl,
    priority,
    metadata,
    expires_at: expiresAt
  });

  if (error) {
    console.error('Error creating notification:', error);
  }
}

export async function notifyContactCreated(userId: string, contactName: string, contactId: string) {
  await createNotification({
    userId,
    type: 'contact_created',
    category: 'contacts',
    title: 'Nouveau contact ajouté',
    message: `Le contact ${contactName} a été ajouté avec succès`,
    actionUrl: `/contacts/${contactId}`,
    priority: 'low',
    metadata: { contact_id: contactId, contact_name: contactName }
  });
}

export async function notifyContactUpdated(userId: string, contactName: string, contactId: string) {
  await createNotification({
    userId,
    type: 'contact_updated',
    category: 'contacts',
    title: 'Contact mis à jour',
    message: `Les informations de ${contactName} ont été mises à jour`,
    actionUrl: `/contacts/${contactId}`,
    priority: 'low',
    metadata: { contact_id: contactId, contact_name: contactName }
  });
}

export async function notifyOpportunityStatusChanged(
  userId: string,
  opportunityTitle: string,
  newStatus: string,
  opportunityId: string,
  value?: number
) {
  const priority: NotificationPriority = newStatus === 'won' ? 'high' : newStatus === 'lost' ? 'medium' : 'low';
  const isHighValue = value && value > 10000;

  await createNotification({
    userId,
    type: 'opportunity_status_changed',
    category: 'opportunities',
    title: newStatus === 'won' ? '🎉 Opportunité gagnée !' : newStatus === 'lost' ? 'Opportunité perdue' : 'Statut d\'opportunité modifié',
    message: isHighValue
      ? `L'opportunité "${opportunityTitle}" (${value}€) est maintenant en statut "${newStatus}"`
      : `L'opportunité "${opportunityTitle}" est maintenant en statut "${newStatus}"`,
    actionUrl: `/opportunities/${opportunityId}`,
    priority: isHighValue ? 'urgent' : priority,
    metadata: {
      opportunity_id: opportunityId,
      opportunity_title: opportunityTitle,
      status: newStatus,
      value
    }
  });
}

export async function notifyHighValueOpportunity(
  userId: string,
  opportunityTitle: string,
  value: number,
  opportunityId: string
) {
  await createNotification({
    userId,
    type: 'high_value_opportunity',
    category: 'opportunities',
    title: '💰 Opportunité à haute valeur',
    message: `Une opportunité de ${value}€ a été créée : ${opportunityTitle}`,
    actionUrl: `/opportunities/${opportunityId}`,
    priority: 'high',
    metadata: {
      opportunity_id: opportunityId,
      opportunity_title: opportunityTitle,
      value
    }
  });
}

export async function notifyEventCreated(userId: string, eventName: string, eventDate: string, eventId: string) {
  await createNotification({
    userId,
    type: 'event_created',
    category: 'events',
    title: 'Nouvel événement créé',
    message: `L'événement "${eventName}" prévu le ${new Date(eventDate).toLocaleDateString('fr-FR')}`,
    actionUrl: `/events/${eventId}`,
    priority: 'medium',
    metadata: {
      event_id: eventId,
      event_name: eventName,
      event_date: eventDate
    }
  });
}

export async function notifyEventStartingSoon(userId: string, eventName: string, eventDate: string, eventId: string) {
  await createNotification({
    userId,
    type: 'event_starting_soon',
    category: 'events',
    title: '📅 Événement imminent',
    message: `L'événement "${eventName}" commence demain`,
    actionUrl: `/events/${eventId}`,
    priority: 'high',
    metadata: {
      event_id: eventId,
      event_name: eventName,
      event_date: eventDate
    }
  });
}

export async function notifyFollowUpDue(userId: string, contactName: string, followUpNote: string, contactId: string) {
  await createNotification({
    userId,
    type: 'follow_up_due',
    category: 'follow_ups',
    title: '⏰ Relance à effectuer',
    message: `Relance pour ${contactName} : ${followUpNote}`,
    actionUrl: `/contacts/${contactId}`,
    priority: 'high',
    metadata: {
      contact_id: contactId,
      contact_name: contactName,
      follow_up_note: followUpNote
    }
  });
}

export async function notifyOpportunityClosingSoon(
  userId: string,
  opportunityTitle: string,
  closeDate: string,
  opportunityId: string,
  value?: number
) {
  await createNotification({
    userId,
    type: 'opportunity_closing_soon',
    category: 'opportunities',
    title: '📊 Clôture d\'opportunité proche',
    message: `L'opportunité "${opportunityTitle}"${value ? ` (${value}€)` : ''} arrive à échéance cette semaine`,
    actionUrl: `/opportunities/${opportunityId}`,
    priority: 'medium',
    metadata: {
      opportunity_id: opportunityId,
      opportunity_title: opportunityTitle,
      close_date: closeDate,
      value
    }
  });
}

export async function notifyContactRegisteredViaQR(
  userId: string,
  contactName: string,
  eventName: string,
  contactId: string,
  eventId: string
) {
  await createNotification({
    userId,
    type: 'contact_registered_qr',
    category: 'events',
    title: 'Nouveau contact enregistré',
    message: `${contactName} s'est enregistré via le code QR de l'événement "${eventName}"`,
    actionUrl: `/contacts/${contactId}`,
    priority: 'medium',
    metadata: {
      contact_id: contactId,
      contact_name: contactName,
      event_id: eventId,
      event_name: eventName
    }
  });
}