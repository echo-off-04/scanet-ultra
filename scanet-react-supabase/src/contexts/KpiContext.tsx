import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { convertAllToBaseCurrency } from '../lib/currency';
import { notifyOpportunityStatusChanged, notifyHighValueOpportunity } from '../lib/notifications';
import { sendOpportunityWonEmail } from '../lib/emailService';

interface Opportunity {
  id: string;
  amount: number | null;
  currency: string | null;
  status: string;
}

interface Event {
  id: string;
  name: string;
  contacts_added: number;
  leads_generated: number;
  conversion_rate: number;
  performance_score: number;
  people_approached: number;
  target_participants: number;
  budget: number;
  revenue: number;
}

interface GlobalKpis {
  totalContacts: number;
  totalLeads: number;
  totalProspects: number;
  totalClients: number;
  totalPartners: number;
  totalCollaborateurs: number;
  totalAmis: number;
  totalFournisseurs: number;
  totalPipeline: number;
  wonAmount: number;
  activeOpportunities: number;
  totalEvents: number;
  userCurrency: string;
}

interface KpiContextType {
  globalKpis: GlobalKpis;
  opportunities: Opportunity[];
  events: Event[];
  loading: boolean;
  refreshKpis: () => Promise<void>;
  refreshOpportunities: () => Promise<void>;
  refreshEvents: () => Promise<void>;
}

const KpiContext = createContext<KpiContextType | undefined>(undefined);

export function KpiProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [globalKpis, setGlobalKpis] = useState<GlobalKpis>({
    totalContacts: 0,
    totalLeads: 0,
    totalProspects: 0,
    totalClients: 0,
    totalPartners: 0,
    totalCollaborateurs: 0,
    totalAmis: 0,
    totalFournisseurs: 0,
    totalPipeline: 0,
    wonAmount: 0,
    activeOpportunities: 0,
    totalEvents: 0,
    userCurrency: 'EUR',
  });
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const userCurrency = (profile as any)?.preferred_currency || 'EUR';

  const loadContacts = useCallback(async () => {
    if (!user) return { total: 0, leads: 0, prospects: 0, clients: 0, partners: 0, collaborateurs: 0, amis: 0, fournisseurs: 0 };

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('status')
        .eq('user_id', user.id);

      if (error) throw error;

      const contacts = data || [];
      return {
        total: contacts.length,
        leads: contacts.filter(c => c.status === 'lead').length,
        prospects: contacts.filter(c => c.status === 'prospect').length,
        clients: contacts.filter(c => c.status === 'client').length,
        partners: contacts.filter(c => c.status === 'partner').length,
        collaborateurs: contacts.filter(c => c.status === 'collaborateur').length,
        amis: contacts.filter(c => c.status === 'ami').length,
        fournisseurs: contacts.filter(c => c.status === 'fournisseur').length,
      };
    } catch (error) {
      console.error('Error loading contacts:', error);
      return { total: 0, leads: 0, prospects: 0, clients: 0, partners: 0, collaborateurs: 0, amis: 0, fournisseurs: 0 };
    }
  }, [user]);

  const loadOpportunities = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('contact_opportunities')
        .select('id, amount, currency, status');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading opportunities:', error);
      return [];
    }
  }, [user]);

  const calculateFinancialMetrics = useCallback(async (opps: Opportunity[]) => {
    if (opps.length === 0) {
      return { totalPipeline: 0, wonAmount: 0, activeOpportunities: 0 };
    }

    const pipelineOpps = opps.filter(o => o.status === 'prospect' || o.status === 'negotiation');
    const pipelineItems = pipelineOpps.map(o => ({ amount: o.amount, currency: o.currency }));
    const pipelineTotal = await convertAllToBaseCurrency(pipelineItems, userCurrency);

    const wonOpps = opps.filter(o => o.status === 'won');
    const wonItems = wonOpps.map(o => ({ amount: o.amount, currency: o.currency }));
    const wonTotal = await convertAllToBaseCurrency(wonItems, userCurrency);

    return {
      totalPipeline: pipelineTotal,
      wonAmount: wonTotal,
      activeOpportunities: pipelineOpps.length,
    };
  }, [userCurrency]);

  const loadEvents = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, contacts_added, leads_generated, conversion_rate, performance_score, people_approached, target_participants, budget, revenue')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading events:', error);
      return [];
    }
  }, [user]);

  const refreshKpis = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [contactStats, opps, eventsData] = await Promise.all([
        loadContacts(),
        loadOpportunities(),
        loadEvents(),
      ]);

      setOpportunities(opps);
      setEvents(eventsData);

      const financialMetrics = await calculateFinancialMetrics(opps);

      setGlobalKpis({
        totalContacts: contactStats.total,
        totalLeads: contactStats.leads,
        totalProspects: contactStats.prospects,
        totalClients: contactStats.clients,
        totalPartners: contactStats.partners,
        totalCollaborateurs: contactStats.collaborateurs,
        totalAmis: contactStats.amis,
        totalFournisseurs: contactStats.fournisseurs,
        totalPipeline: financialMetrics.totalPipeline,
        wonAmount: financialMetrics.wonAmount,
        activeOpportunities: financialMetrics.activeOpportunities,
        totalEvents: eventsData.length,
        userCurrency,
      });
    } catch (error) {
      console.error('Error refreshing KPIs:', error);
    } finally {
      setLoading(false);
    }
  }, [user, userCurrency, loadContacts, loadOpportunities, loadEvents, calculateFinancialMetrics]);

  const refreshOpportunities = useCallback(async () => {
    const opps = await loadOpportunities();
    setOpportunities(opps);

    const financialMetrics = await calculateFinancialMetrics(opps);
    setGlobalKpis(prev => ({
      ...prev,
      totalPipeline: financialMetrics.totalPipeline,
      wonAmount: financialMetrics.wonAmount,
      activeOpportunities: financialMetrics.activeOpportunities,
    }));
  }, [loadOpportunities, calculateFinancialMetrics]);

  const refreshEvents = useCallback(async () => {
    const eventsData = await loadEvents();
    setEvents(eventsData);
    setGlobalKpis(prev => ({
      ...prev,
      totalEvents: eventsData.length,
    }));
  }, [loadEvents]);

  useEffect(() => {
    if (user) {
      refreshKpis();
    }
  }, [user, refreshKpis]);

  useEffect(() => {
    if (!user) return;

    const contactsChannel = supabase
      .channel('contacts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refreshKpis();
        }
      )
      .subscribe();

    const opportunitiesChannel = supabase
      .channel('opportunities-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contact_opportunities',
        },
        async (payload) => {
          const newOpp = payload.new as any;
          if (newOpp.amount && newOpp.amount > 10000) {
            await notifyHighValueOpportunity(
              user.id,
              newOpp.title || 'Opportunité sans titre',
              newOpp.amount,
              newOpp.id
            );
          }
          refreshOpportunities();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contact_opportunities',
        },
        async (payload) => {
          const oldOpp = payload.old as any;
          const newOpp = payload.new as any;

          if (oldOpp.status !== newOpp.status && (newOpp.status === 'won' || newOpp.status === 'lost')) {
            await notifyOpportunityStatusChanged(
              user.id,
              newOpp.title || 'Opportunité sans titre',
              newOpp.status,
              newOpp.id,
              newOpp.amount
            );

            if (newOpp.status === 'won' && profile?.email) {
              try {
                await sendOpportunityWonEmail(
                  profile.email,
                  newOpp.title || 'Opportunité sans titre',
                  newOpp.amount || 0,
                  newOpp.id
                );
              } catch (emailError) {
                console.error('Failed to send opportunity won email:', emailError);
              }
            }
          }
          refreshOpportunities();
        }
      )
      .subscribe();

    const eventsChannel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refreshEvents();
        }
      )
      .subscribe();

    return () => {
      contactsChannel.unsubscribe();
      opportunitiesChannel.unsubscribe();
      eventsChannel.unsubscribe();
    };
  }, [user, refreshKpis, refreshOpportunities, refreshEvents]);

  return (
    <KpiContext.Provider value={{
      globalKpis,
      opportunities,
      events,
      loading,
      refreshKpis,
      refreshOpportunities,
      refreshEvents,
    }}>
      {children}
    </KpiContext.Provider>
  );
}

export function useKpis() {
  const context = useContext(KpiContext);
  if (context === undefined) {
    throw new Error('useKpis must be used within a KpiProvider');
  }
  return context;
}
