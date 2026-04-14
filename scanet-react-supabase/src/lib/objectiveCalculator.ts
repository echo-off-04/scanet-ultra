import { supabase } from './supabase';
import { convertAllToBaseCurrency } from './currency';

export interface PersonalObjective {
  id: string;
  user_id: string;
  objective_type: 'revenue' | 'new_contacts' | 'contacts_by_status' | 'win_rate' | 'participation_rate';
  title: string;
  description: string | null;
  target_value: number;
  current_value: number;
  unit: 'currency' | 'number' | 'percentage';
  currency: string;
  contact_status_filter: string | null;
  period_type: 'day' | 'week' | 'month' | 'year' | 'all_time' | 'custom';
  period_start: string | null;
  period_end: string | null;
  event_id: string | null;
  status: 'active' | 'achieved' | 'failed' | 'cancelled';
  achieved_at: string | null;
  notified: boolean;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

export function getPeriodDates(periodType: string, customStart?: string | null, customEnd?: string | null): { start: Date; end: Date } {
  const now = new Date();

  if (customStart && customEnd) {
    return { start: new Date(customStart), end: new Date(customEnd) };
  }

  switch (periodType) {
    case 'day': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { start, end };
    }
    case 'week': {
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return { start, end };
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { start, end };
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear() + 1, 0, 1);
      return { start, end };
    }
    case 'all_time':
    default:
      return { start: new Date(2000, 0, 1), end: new Date(2100, 0, 1) };
  }
}

async function calculateRevenue(userId: string, currency: string, periodStart?: string | null, periodEnd?: string | null): Promise<number> {
  let query = supabase
    .from('contact_opportunities')
    .select('amount, currency, created_at')
    .eq('user_id', userId)
    .eq('status', 'won');

  if (periodStart) {
    query = query.gte('created_at', periodStart);
  }
  if (periodEnd) {
    query = query.lte('created_at', periodEnd);
  }

  const { data, error } = await query;

  if (error || !data) return 0;

  const items = data.map(o => ({ amount: o.amount, currency: o.currency }));
  return convertAllToBaseCurrency(items, currency);
}

async function calculateNewContacts(userId: string, periodStart?: string | null, periodEnd?: string | null): Promise<number> {
  let query = supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (periodStart) {
    query = query.gte('created_at', periodStart);
  }
  if (periodEnd) {
    query = query.lte('created_at', periodEnd);
  }

  const { count, error } = await query;

  if (error) return 0;
  return count || 0;
}

async function calculateContactsByStatus(
  userId: string,
  statusFilter: string,
  periodStart?: string | null,
  periodEnd?: string | null
): Promise<number> {
  let query = supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', statusFilter);

  if (periodStart) {
    query = query.gte('created_at', periodStart);
  }
  if (periodEnd) {
    query = query.lte('created_at', periodEnd);
  }

  const { count, error } = await query;

  if (error) return 0;
  return count || 0;
}

async function calculateWinRate(userId: string, periodStart?: string | null, periodEnd?: string | null): Promise<number> {
  let query = supabase
    .from('contact_opportunities')
    .select('status, created_at')
    .eq('user_id', userId)
    .in('status', ['won', 'lost']);

  if (periodStart) {
    query = query.gte('created_at', periodStart);
  }
  if (periodEnd) {
    query = query.lte('created_at', periodEnd);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) return 0;

  const won = data.filter(o => o.status === 'won').length;
  const total = data.length;
  return Math.round((won / total) * 100);
}

async function calculateParticipationRate(userId: string, periodStart?: string | null, periodEnd?: string | null, eventId?: string | null): Promise<number> {
  let query = supabase
    .from('events')
    .select('actual_participants, target_participants, start_date')
    .eq('user_id', userId)
    .gt('target_participants', 0);

  if (eventId) {
    query = query.eq('id', eventId);
  }
  if (periodStart) {
    query = query.gte('start_date', periodStart);
  }
  if (periodEnd) {
    query = query.lte('start_date', periodEnd);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) return 0;

  const totalActual = data.reduce((sum, e) => sum + (e.actual_participants || 0), 0);
  const totalTarget = data.reduce((sum, e) => sum + (e.target_participants || 0), 0);

  if (totalTarget === 0) return 0;
  return Math.round((totalActual / totalTarget) * 100);
}

export function getEffectivePeriodDates(objective: PersonalObjective): { start: string; end: string } {
  if (objective.period_type === 'custom') {
    return {
      start: objective.period_start || new Date(2000, 0, 1).toISOString(),
      end: objective.period_end || new Date(2100, 0, 1).toISOString(),
    };
  }
  const { start, end } = getPeriodDates(objective.period_type);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function calculateObjectiveValue(objective: PersonalObjective): Promise<number> {
  const { start: periodStart, end: periodEnd } = getEffectivePeriodDates(objective);

  switch (objective.objective_type) {
    case 'revenue':
      return calculateRevenue(objective.user_id, objective.currency, periodStart, periodEnd);
    case 'new_contacts':
      return calculateNewContacts(objective.user_id, periodStart, periodEnd);
    case 'contacts_by_status':
      return calculateContactsByStatus(
        objective.user_id,
        objective.contact_status_filter || 'lead',
        periodStart,
        periodEnd
      );
    case 'win_rate':
      return calculateWinRate(objective.user_id, periodStart, periodEnd);
    case 'participation_rate':
      return calculateParticipationRate(objective.user_id, periodStart, periodEnd, objective.event_id);
    default:
      return 0;
  }
}

export async function refreshAllObjectives(userId: string): Promise<PersonalObjective[]> {
  const { data: objectives, error } = await supabase
    .from('personal_objectives')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active']);

  if (error || !objectives) return [];

  const updated: PersonalObjective[] = [];

  for (const obj of objectives) {
    const currentValue = await calculateObjectiveValue(obj as PersonalObjective);
    const isAchieved = currentValue >= obj.target_value;
    const wasAlreadyAchieved = obj.status === 'achieved';

    if (currentValue !== obj.current_value || (isAchieved && !wasAlreadyAchieved)) {
      const updateData: Record<string, unknown> = { current_value: currentValue };

      if (isAchieved && !wasAlreadyAchieved) {
        updateData.status = 'achieved';
        updateData.achieved_at = new Date().toISOString();
      }

      await supabase
        .from('personal_objectives')
        .update(updateData)
        .eq('id', obj.id);

      updated.push({
        ...obj,
        current_value: currentValue,
        status: isAchieved ? 'achieved' : obj.status,
        achieved_at: isAchieved ? new Date().toISOString() : obj.achieved_at,
      } as PersonalObjective);
    } else {
      updated.push(obj as PersonalObjective);
    }
  }

  return updated;
}

export function getObjectiveProgress(objective: PersonalObjective): number {
  if (objective.target_value <= 0) return 0;
  return Math.min(100, Math.round((objective.current_value / objective.target_value) * 100));
}

export const OBJECTIVE_TYPE_CONFIG = {
  revenue: {
    label: 'Chiffre d\'affaires',
    description: 'Revenus des opportunites gagnees',
    unit: 'currency' as const,
    icon: 'DollarSign',
    color: '#10b981',
  },
  new_contacts: {
    label: 'Nouveaux contacts',
    description: 'Nombre de contacts ajoutes',
    unit: 'number' as const,
    icon: 'Users',
    color: '#3b82f6',
  },
  contacts_by_status: {
    label: 'Contacts par statut',
    description: 'Nombre de contacts d\'un statut specifique',
    unit: 'number' as const,
    icon: 'UserPlus',
    color: '#f59e0b',
  },
  win_rate: {
    label: 'Taux de victoire',
    description: 'Pourcentage d\'opportunites gagnees',
    unit: 'percentage' as const,
    icon: 'Trophy',
    color: '#ef4444',
  },
  participation_rate: {
    label: 'Taux de participation',
    description: 'Participation moyenne aux evenements',
    unit: 'percentage' as const,
    icon: 'Calendar',
    color: '#8b5cf6',
  },
} as const;

export const CONTACT_STATUS_LABELS: Record<string, string> = {
  lead: 'Leads',
  prospect: 'Prospects',
  client: 'Clients',
  partner: 'Partenaires',
  collaborateur: 'Collaborateurs',
  ami: 'Ami(e)s',
  fournisseur: 'Fournisseurs',
};

export const PERIOD_LABELS: Record<string, string> = {
  day: 'par jour',
  week: 'par semaine',
  month: 'par mois',
  year: 'par an',
  all_time: 'au total',
};
