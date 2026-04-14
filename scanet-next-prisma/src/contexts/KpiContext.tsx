'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { convertAllToBaseCurrency } from '@/lib/currency';

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

    const userCurrency = profile?.preferred_currency || 'EUR';

    const loadContacts = useCallback(async () => {
        if (!user) return { total: 0, leads: 0, prospects: 0, clients: 0, partners: 0, collaborateurs: 0, amis: 0, fournisseurs: 0 };

        try {
            const res = await fetch('/api/contacts');
            if (!res.ok) throw new Error('Failed to fetch contacts');
            const data = await res.json();
            const contacts = data.contacts || data || [];

            return {
                total: contacts.length,
                leads: contacts.filter((c: any) => c.status === 'lead').length,
                prospects: contacts.filter((c: any) => c.status === 'prospect').length,
                clients: contacts.filter((c: any) => c.status === 'client').length,
                partners: contacts.filter((c: any) => c.status === 'partner').length,
                collaborateurs: contacts.filter((c: any) => c.status === 'collaborateur').length,
                amis: contacts.filter((c: any) => c.status === 'ami').length,
                fournisseurs: contacts.filter((c: any) => c.status === 'fournisseur').length,
            };
        } catch (error) {
            console.error('Error loading contacts:', error);
            return { total: 0, leads: 0, prospects: 0, clients: 0, partners: 0, collaborateurs: 0, amis: 0, fournisseurs: 0 };
        }
    }, [user]);

    const loadOpportunities = useCallback(async () => {
        if (!user) return [];

        try {
            const res = await fetch('/api/opportunities');
            if (!res.ok) throw new Error('Failed to fetch opportunities');
            const data = await res.json();
            return data.map((o: any) => ({
                id: o.id,
                amount: o.amount,
                currency: o.currency,
                status: o.status,
            }));
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
            const res = await fetch('/api/events');
            if (!res.ok) throw new Error('Failed to fetch events');
            const json = await res.json();
            const data = json.events || json || [];
            return data.map((e: any) => ({
                id: e.id,
                name: e.name,
                contacts_added: e.contacts_added ?? e.contactsAdded ?? 0,
                leads_generated: e.leads_generated ?? e.leadsGenerated ?? 0,
                conversion_rate: e.conversion_rate ?? e.conversionRate ?? 0,
                performance_score: e.performance_score ?? e.performanceScore ?? 0,
                people_approached: e.people_approached ?? e.peopleApproached ?? 0,
                target_participants: e.target_participants ?? e.targetParticipants ?? 0,
                budget: e.budget ?? 0,
                revenue: e.revenue ?? 0,
            }));
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

    // Poll for updates every 15 seconds (replacing Supabase realtime)
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(refreshKpis, 15000);
        return () => clearInterval(interval);
    }, [user, refreshKpis]);

    return (
        <KpiContext.Provider value={{ globalKpis, opportunities, events, loading, refreshKpis, refreshOpportunities, refreshEvents }}>
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
