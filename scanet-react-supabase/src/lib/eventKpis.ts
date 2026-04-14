import { supabase } from './supabase';

export async function syncEventKpis(eventId: string): Promise<void> {
  try {
    const { data: eventContacts, error: contactsError } = await supabase
      .from('contact_events')
      .select('contacts(status)')
      .eq('event_id', eventId);

    if (contactsError) throw contactsError;

    const contactsCount = eventContacts?.length || 0;

    const leadsCount = eventContacts?.filter(
      ec => ec.contacts && (ec.contacts as any).status === 'lead'
    ).length || 0;

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('people_approached, target_participants')
      .eq('id', eventId)
      .maybeSingle();

    if (eventError) throw eventError;

    const peopleApproached = event?.people_approached || 0;
    const conversionRate = peopleApproached > 0
      ? (contactsCount / peopleApproached) * 100
      : 0;

    const targetParticipants = event?.target_participants || 0;
    const participationRate = targetParticipants > 0
      ? (contactsCount / targetParticipants) * 100
      : 0;

    const performanceScore = calculatePerformanceScore({
      conversionRate,
      participationRate,
      contactsCount,
      targetParticipants,
    });

    const { error: updateError } = await supabase
      .from('events')
      .update({
        contacts_added: contactsCount,
        leads_generated: leadsCount,
        conversion_rate: conversionRate,
        performance_score: performanceScore,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error syncing event KPIs:', error);
    throw error;
  }
}

function calculatePerformanceScore(params: {
  conversionRate: number;
  participationRate: number;
  contactsCount: number;
  targetParticipants: number;
}): number {
  const { conversionRate, participationRate, contactsCount, targetParticipants } = params;

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
  newValue: number
): Promise<void> {
  try {
    const { error } = await supabase
      .from('events')
      .update({
        people_approached: Math.max(0, newValue),
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (error) throw error;

    await syncEventKpis(eventId);
  } catch (error) {
    console.error('Error updating people approached:', error);
    throw error;
  }
}
