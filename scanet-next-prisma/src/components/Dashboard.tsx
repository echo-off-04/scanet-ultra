'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, TrendingUp, Users, Target, Briefcase, Calendar, DollarSign, Star, ArrowRight, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useKpis } from '@/contexts/KpiContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { ContactProfile } from './ContactProfile';
import { AddContactModal } from './AddContactModal';
import { AddEventModal } from './AddEventModal';
import { ScanContactModal } from './ScanContactModal';
import { AddContactOptionsModal } from './AddContactOptionsModal';
import { EventQRCodeModal } from './EventQRCodeModal';
import { Sidebar } from './Sidebar';
import { EventsList } from './EventsList';
import { EventProfile } from './EventProfile';
import { ContactsToolbar } from './ContactsToolbar';
import { ContactsListView } from './ContactsListView';
import { ContactsGridView } from './ContactsGridView';
import { ContactsPhotoView } from './ContactsPhotoView';
import { Opportunities } from './Opportunities';
import { Offers } from './Offers';
import { Settings } from './Settings';
import { Enterprise } from './Entreprise';
import { StatsCards } from './StatsCards';
import { StatusTabs } from './StatusTabs';
import { RecentContactsCarousel } from './RecentContactsCarousel';
import { Hero, HeroText } from './Hero';
import { Navbar } from './Navbar';
import Relances from './Relances';
import ScheduleEmailModal from './ScheduleEmailModal';
import { PersonalObjectives } from './PersonalObjectives';
import { MaterialButton } from './material/MaterialButton';
import { formatCurrency } from '@/lib/currency';
import type { Contact, Event, ViewType, ViewMode, SortOption } from '@/types';

export function Dashboard() {
    const { profile, signOut } = useAuth();
    const { globalKpis, refreshKpis, loading: kpisLoading } = useKpis();
    const { refreshNotifications } = useNotifications();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAddEventModal, setShowAddEventModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<ViewType>('dashboard');
    const [events, setEvents] = useState<Event[]>([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortBy, setSortBy] = useState<SortOption>('date_desc');
    const [filters, setFilters] = useState({
        events: [] as string[], tags: [] as string[], relationships: [] as string[],
        cities: [] as string[], regions: [] as string[], countries: [] as string[],
        opportunityMin: null as number | null, opportunityMax: null as number | null,
    });
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showScanModal, setShowScanModal] = useState(false);
    const [showAddOptionsModal, setShowAddOptionsModal] = useState(false);
    const [showEventQRModal, setShowEventQRModal] = useState(false);
    const [currentEventForQR, setCurrentEventForQR] = useState<Event | null>(null);
    const [showScheduleEmailModal, setShowScheduleEmailModal] = useState(false);
    const [eventsRefreshKey, setEventsRefreshKey] = useState(0);

    useEffect(() => {
        loadContacts();
    }, []);

    // Poll contacts for updates every 20 seconds (replacing Supabase realtime)
    useEffect(() => {
        const interval = setInterval(loadContacts, 20000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (view !== 'events' && view !== 'dashboard') return;

        const interval = setInterval(loadEvents, 20000);
        return () => clearInterval(interval);
    }, [view]);

    useEffect(() => {
        filterAndSortContacts();
    }, [contacts, searchTerm, filterStatus, sortBy, filters]);

    useEffect(() => {
        extractAvailableTags();
    }, [contacts]);

    useEffect(() => {
        if (view === 'events' || view === 'dashboard') {
            loadEvents();
        }
    }, [view]);

    const loadContacts = async () => {
        try {
            const res = await fetch('/api/contacts');
            if (!res.ok) throw new Error('Failed to load contacts');
            const data = await res.json();
            setContacts(data.contacts || []);
        } catch (error) {
            console.error('Error loading contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadEvents = async () => {
        setEventsLoading(true);
        try {
            const res = await fetch('/api/events');
            if (!res.ok) throw new Error('Failed to load events');
            const data = await res.json();
            setEvents(data.events || []);
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            setEventsLoading(false);
        }
    };

    const extractAvailableTags = () => {
        const tagsSet = new Set<string>();
        contacts.forEach((contact) => {
            if (contact.tags && Array.isArray(contact.tags)) {
                contact.tags.forEach((tag) => tagsSet.add(tag));
            }
        });
        setAvailableTags(Array.from(tagsSet).sort());
    };

    const filterAndSortContacts = useCallback(() => {
        let filtered = contacts;

        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (c) =>
                    c.full_name.toLowerCase().includes(searchLower) ||
                    c.company?.toLowerCase().includes(searchLower) ||
                    c.email?.toLowerCase().includes(searchLower) ||
                    c.job_title?.toLowerCase().includes(searchLower) ||
                    c.phone?.toLowerCase().includes(searchLower) ||
                    c.city?.toLowerCase().includes(searchLower) ||
                    c.region?.toLowerCase().includes(searchLower) ||
                    c.country?.toLowerCase().includes(searchLower) ||
                    c.industry?.toLowerCase().includes(searchLower) ||
                    c.address?.toLowerCase().includes(searchLower) ||
                    c.website?.toLowerCase().includes(searchLower) ||
                    (c.tags && c.tags.some(tag => tag.toLowerCase().includes(searchLower)))
            );
        }

        if (filterStatus !== 'all') {
            filtered = filtered.filter((c) => c.status === filterStatus);
        }

        if (filters.events.length > 0) {
            filtered = filtered.filter((c) =>
                c.events?.some((event) => filters.events.includes(event.id))
            );
        }

        if (filters.tags.length > 0) {
            filtered = filtered.filter((c) => c.tags && filters.tags.some((tag) => c.tags?.includes(tag)));
        }

        if (filters.relationships.length > 0) {
            filtered = filtered.filter((c) => c.relationship && filters.relationships.includes(c.relationship));
        }

        if (filters.cities.length > 0 && filters.cities[0]) {
            filtered = filtered.filter((c) => c.city?.toLowerCase().includes(filters.cities[0].toLowerCase()));
        }

        if (filters.regions.length > 0 && filters.regions[0]) {
            filtered = filtered.filter((c) => c.region?.toLowerCase().includes(filters.regions[0].toLowerCase()));
        }

        if (filters.countries.length > 0 && filters.countries[0]) {
            filtered = filtered.filter((c) => c.country?.toLowerCase().includes(filters.countries[0].toLowerCase()));
        }

        if (filters.opportunityMin !== null) {
            filtered = filtered.filter((c) => (c.opportunity_amount || 0) >= filters.opportunityMin!);
        }

        if (filters.opportunityMax !== null) {
            filtered = filtered.filter((c) => (c.opportunity_amount || 0) <= filters.opportunityMax!);
        }

        filtered = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'name_asc': return a.full_name.localeCompare(b.full_name);
                case 'name_desc': return b.full_name.localeCompare(a.full_name);
                case 'date_asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'date_desc': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                case 'rating_asc': return (a.rating || 0) - (b.rating || 0);
                case 'rating_desc': return (b.rating || 0) - (a.rating || 0);
                default: return 0;
            }
        });

        setFilteredContacts(filtered);
    }, [contacts, searchTerm, filterStatus, sortBy, filters]);

    const handleContactAdded = () => {
        loadContacts();
        refreshKpis();
        refreshNotifications();
        if (view === 'events') loadEvents();
        setShowAddModal(false);
    };

    const handleContactClick = (contact: Contact) => setSelectedContactId(contact.id);
    const handleSendOffer = (contact: Contact) => { setSelectedContactId(contact.id); setView('offers'); };

    if (selectedContactId) {
        return (
            <ContactProfile
                contactId={selectedContactId}
                onBack={() => { setSelectedContactId(null); loadContacts(); }}
                onNavigateToEnterprise={() => { setSelectedContactId(null); setView('enterprise'); }}
            />
        );
    }

    if (selectedEventId) {
        return (
            <EventProfile
                eventId={selectedEventId}
                onBack={() => { setSelectedEventId(null); loadEvents(); }}
                onContactSelect={(contactId) => { setSelectedContactId(contactId); setSelectedEventId(null); setView('contacts'); }}
            />
        );
    }

    return (
        <div className="relative flex h-screen overflow-hidden bg-slate-50 text-slate-900">
            <Sidebar
                view={view}
                onViewChange={(newView) => { setView(newView); setIsSidebarOpen(false); if (newView === 'events') loadEvents(); }}
                filterStatus={filterStatus}
                onFilterChange={setFilterStatus}
                onSignOut={signOut}
                stats={{
                    total: globalKpis.totalContacts, leads: globalKpis.totalLeads, prospects: globalKpis.totalProspects,
                    clients: globalKpis.totalClients, partners: globalKpis.totalPartners,
                    collaborateurs: globalKpis.totalCollaborateurs, amis: globalKpis.totalAmis, fournisseurs: globalKpis.totalFournisseurs,
                }}
                eventsCount={globalKpis.totalEvents}
                userName={profile?.full_name || 'Utilisateur'}
                userEmail={profile?.email || ''}
                isMobileOpen={isSidebarOpen}
                onMobileClose={() => setIsSidebarOpen(false)}
            />

            <div className="flex flex-1 flex-col overflow-hidden lg:ml-0">
                <header className="sticky top-0 z-20 border-slate-200 bg-slate-50 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-900 lg:hidden">S</div>
                            <div className="min-w-0">
                                <h2 className="truncate text-base font-semibold text-slate-900 sm:text-lg md:text-xl lg:text-2xl">
                                    {view === 'dashboard' && 'Tableau de bord'}
                                    {view === 'contacts' && 'Mes Contacts'}
                                    {view === 'events' && 'Événements'}
                                    {view === 'followups' && 'Relances'}
                                    {view === 'opportunities' && 'Opportunités'}
                                    {view === 'offers' && 'Offres'}
                                    {view === 'enterprise' && 'Entreprise'}
                                    {view === 'settings' && 'Paramètres'}
                                </h2>
                                <p className="mt-0.5 hidden truncate text-xs text-slate-500 sm:block sm:text-sm">Bienvenue, {profile?.full_name || 'User'}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto px-4 py-4 pb-32 sm:px-6 sm:py-5 lg:px-8 lg:py-6 lg:pb-8">
                    {view === 'contacts' && (
                        <div className="max-w-7xl mx-auto w-full">
                            <Hero label="Networking" imageUrl="https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg" imageAlt="Networking contacts">
                                <HeroText>Gérez et développez</HeroText>
                                <HeroText highlight highlightColor="purple">votre réseau</HeroText>
                                <HeroText>professionnel</HeroText>
                            </Hero>

                            <RecentContactsCarousel contacts={contacts} onContactClick={handleContactClick} />
                            <StatsCards totalContacts={globalKpis.totalContacts} leads={globalKpis.totalLeads} clients={globalKpis.totalClients} partners={globalKpis.totalPartners} />
                            <StatusTabs
                                currentStatus={filterStatus}
                                counts={{ all: globalKpis.totalContacts, lead: globalKpis.totalLeads, prospect: globalKpis.totalProspects, client: globalKpis.totalClients, partner: globalKpis.totalPartners, collaborateur: globalKpis.totalCollaborateurs, ami: globalKpis.totalAmis, fournisseur: globalKpis.totalFournisseurs }}
                                onStatusChange={setFilterStatus}
                            />
                            <ContactsToolbar
                                searchTerm={searchTerm} onSearchChange={setSearchTerm} viewMode={viewMode} onViewModeChange={setViewMode}
                                sortBy={sortBy} onSortChange={setSortBy} filters={filters} onFiltersChange={setFilters}
                                availableTags={availableTags} onAddContact={() => setShowAddModal(true)}
                            />

                            {loading ? (
                                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
                                    <p className="mt-4 font-medium text-slate-600">Chargement des contacts...</p>
                                </div>
                            ) : filteredContacts.length === 0 ? (
                                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl border border-slate-200 bg-slate-100">
                                        <Users className="h-8 w-8 text-slate-600" />
                                    </div>
                                    <h3 className="mb-3 text-xl font-semibold text-slate-900">Aucun contact trouvé</h3>
                                    <p className="mx-auto mb-6 max-w-md text-slate-600">
                                        {searchTerm || filterStatus !== 'all' || filters.events.length > 0 || filters.tags.length > 0
                                            ? "Essayez d'ajuster vos filtres pour voir plus de résultats"
                                            : 'Commencez à construire votre réseau en ajoutant votre premier contact'}
                                    </p>
                                    {!searchTerm && filterStatus === 'all' && filters.events.length === 0 && (
                                        <MaterialButton onClick={() => setShowAddModal(true)} icon={<Plus className="h-5 w-5" />} className="px-5 py-3">
                                            Ajouter votre premier contact
                                        </MaterialButton>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {viewMode === 'grid' && <ContactsGridView contacts={filteredContacts} onContactClick={handleContactClick} onSendOffer={handleSendOffer} />}
                                    {viewMode === 'list' && <ContactsListView contacts={filteredContacts} onContactClick={handleContactClick} />}
                                    {viewMode === 'photos' && <ContactsPhotoView contacts={filteredContacts} onContactClick={handleContactClick} />}
                                </>
                            )}
                        </div>
                    )}

                    {view === 'events' && <EventsList onEventClick={setSelectedEventId} onCreateEvent={() => setShowAddEventModal(true)} refreshKey={eventsRefreshKey} />}
                    {view === 'followups' && <Relances onScheduleNew={() => setShowScheduleEmailModal(true)} />}
                    {view === 'opportunities' && <Opportunities onContactSelect={(contactId) => { setSelectedContactId(contactId); setView('contacts'); }} />}
                    {view === 'offers' && <Offers />}
                    {view === 'settings' && <Settings />}
                    {view === 'enterprise' && <Enterprise />}

                    {view === 'dashboard' && (
                        <div className="space-y-6 lg:space-y-8">
                            <Hero label="Bienvenue" imageUrl="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg" imageAlt="Dashboard business">
                                <HeroText>Pilotez votre </HeroText>
                                <HeroText highlight highlightColor="blue">activité commerciale</HeroText>
                                <HeroText> en temps réel</HeroText>
                            </Hero>

                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.9fr)]">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {[
                                        { label: 'Total contacts', value: globalKpis.totalContacts, icon: Users },
                                        { label: 'CA gagné', value: formatCurrency(globalKpis.wonAmount, globalKpis.userCurrency), icon: DollarSign },
                                        { label: 'Opportunités', value: globalKpis.activeOpportunities, icon: Target },
                                        { label: 'Pipeline', value: formatCurrency(globalKpis.totalPipeline, globalKpis.userCurrency), icon: TrendingUp },
                                    ].map((metric) => {
                                        const Icon = metric.icon;
                                        return (
                                            <div key={metric.label} className="stat-card relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,87,184,0.03),transparent_50%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                                <div className="relative z-10 flex items-start justify-between gap-4">
                                                    <div>
                                                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{metric.label}</p>
                                                        <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 lg:text-3xl">{metric.value}</p>
                                                    </div>
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[rgba(0,87,184,0.12)] bg-[#f4f8fe] text-[#0057b8] transition-colors duration-300 group-hover:bg-[#eef5fe]">
                                                        <Icon className="h-5 w-5" strokeWidth={2} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="stat-card">
                                    <div className="mb-4">
                                        <h3 className="text-sm font-semibold text-slate-900">Actions rapides</h3>
                                        <p className="mt-1 text-xs text-slate-500">Accès direct aux actions principales.</p>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        {[
                                            { onClick: () => setShowAddModal(true), icon: Plus, title: 'Nouveau contact', desc: 'Ajouter un contact à votre réseau' },
                                            { onClick: () => setShowAddEventModal(true), icon: Calendar, title: 'Nouvel événement', desc: 'Créer un événement de networking' },
                                            { onClick: () => setView('opportunities'), icon: Target, title: 'Opportunités', desc: 'Gérer vos opportunités commerciales' },
                                            { onClick: () => setView('offers'), icon: Briefcase, title: 'Offres', desc: 'Consulter vos offres commerciales' },
                                        ].map((action) => {
                                            const Icon = action.icon;
                                            return (
                                                <button key={action.title} onClick={action.onClick} className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left transition-all duration-300 hover:bg-slate-100 hover:shadow-sm hover:scale-[1.02]">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[rgba(0,87,184,0.12)] bg-[#f4f8fe] text-[#0057b8] transition-colors group-hover:bg-[#eef5fe]">
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <div className="text-sm font-medium text-slate-900 transition-colors group-hover:text-[#0057b8]">{action.title}</div>
                                                        <div className="text-xs text-slate-500">{action.desc}</div>
                                                    </div>
                                                    <ArrowRight className="h-4 w-4 text-slate-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#0057b8]" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <PersonalObjectives />

                            {/* Derniers contacts ajoutés */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
                                <div className="relative flex items-center justify-between mb-5">
                                    <h3 className="text-xl font-semibold text-slate-900">Derniers contacts ajoutés</h3>
                                    <button onClick={() => setView('contacts')} className="flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
                                        Voir tous <ArrowRight className="h-4 w-4" />
                                    </button>
                                </div>
                                {contacts.length === 0 ? (
                                    <div className="relative text-center py-12 px-4">
                                        <Users className="mx-auto mb-3 h-16 w-16 text-slate-300" /><p className="font-medium text-slate-500">Aucun contact trouvé</p>
                                    </div>
                                ) : (
                                    <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                        {contacts.slice(0, 5).map((contact) => (
                                            <div key={contact.id} onClick={() => handleContactClick(contact)} className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50">
                                                <div className="flex flex-col items-center text-center">
                                                    {contact.avatar_url ? (
                                                        <img src={contact.avatar_url} alt={contact.full_name} className="mb-3 h-16 w-16 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-slate-300 bg-slate-200 text-lg font-semibold text-slate-900">
                                                            {contact.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                                                        </div>
                                                    )}
                                                    <h3 className="mb-1 w-full truncate text-sm font-semibold text-slate-900">{contact.full_name}</h3>
                                                    {contact.company && <p className="mb-2 w-full truncate text-xs text-slate-600">{contact.company}</p>}
                                                    {contact.rating && contact.rating > 0 && (
                                                        <div className="flex gap-0.5">
                                                            {[...Array(5)].map((_, i) => <Star key={i} className={`h-3 w-3 ${i < contact.rating! ? 'fill-amber-400 text-amber-400' : 'fill-slate-300 text-slate-300'}`} />)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Derniers événements */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
                                <div className="relative flex items-center justify-between mb-5">
                                    <h3 className="text-xl font-semibold text-slate-900">Derniers événements</h3>
                                    <button onClick={() => setView('events')} className="flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
                                        Voir tous <ArrowRight className="h-4 w-4" />
                                    </button>
                                </div>
                                {eventsLoading ? (
                                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                        {[...Array(4)].map((_, i) => <div key={i} className="h-40 w-64 flex-shrink-0 rounded-xl border border-slate-200 bg-slate-100 animate-pulse" />)}
                                    </div>
                                ) : events.length === 0 ? (
                                    <div className="relative text-center py-12 px-4">
                                        <Calendar className="mx-auto mb-3 h-16 w-16 text-slate-300" /><p className="font-medium text-slate-500">Aucun événement trouvé</p>
                                    </div>
                                ) : (
                                    <div className="relative flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                        {events.slice(0, 6).map((event) => (
                                            <div key={event.id} onClick={() => setSelectedEventId(event.id)} className="w-64 flex-shrink-0 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:bg-slate-50">
                                                {event.image_url ? (
                                                    <div className="mb-3 h-24 w-full overflow-hidden rounded-xl bg-slate-100">
                                                        <img src={event.image_url} alt={event.name} className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="mb-3 flex h-24 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-100">
                                                        <Calendar className="h-8 w-8 text-slate-600" />
                                                    </div>
                                                )}
                                                <h4 className="mb-2 line-clamp-1 font-semibold text-slate-900">{event.name}</h4>
                                                <div className="mb-1 flex items-center gap-2 text-xs text-slate-600">
                                                    <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                                                    {event.start_date ? new Date(event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Date non définie'}
                                                </div>
                                                {event.location && (
                                                    <div className="mb-2 flex items-center gap-2 text-xs text-slate-600">
                                                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" /><span className="line-clamp-1">{event.location}</span>
                                                    </div>
                                                )}
                                                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{event.contact_count || 0} contacts</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {showAddModal && <AddContactModal onClose={() => setShowAddModal(false)} onContactAdded={handleContactAdded} onNavigateToEnterprise={() => { setShowAddModal(false); setView('enterprise'); }} />}
            {showAddEventModal && <AddEventModal onClose={() => setShowAddEventModal(false)} onSuccess={() => { setShowAddEventModal(false); loadEvents(); refreshKpis(); refreshNotifications(); setEventsRefreshKey(prev => prev + 1); }} />}
            {showScanModal && <ScanContactModal onClose={() => setShowScanModal(false)} onContactAdded={() => { setShowScanModal(false); loadContacts(); refreshKpis(); refreshNotifications(); }} />}
            {showAddOptionsModal && (
                <AddContactOptionsModal
                    onClose={() => setShowAddOptionsModal(false)}
                    onScanCard={() => setShowScanModal(true)}
                    onShowEventQR={() => {
                        const activeEvent = events.find(e => e.qr_code_token) || null;
                        if (activeEvent) { setCurrentEventForQR(activeEvent); setShowEventQRModal(true); }
                    }}
                    onManualAdd={() => setShowAddModal(true)}
                    hasActiveEvent={events.some(e => e.qr_code_token)}
                />
            )}
            {showEventQRModal && currentEventForQR && (
                <EventQRCodeModal eventName={currentEventForQR.name} qrCodeToken={currentEventForQR.qr_code_token || ''} onClose={() => { setShowEventQRModal(false); setCurrentEventForQR(null); }} />
            )}
            {showScheduleEmailModal && <ScheduleEmailModal onClose={() => setShowScheduleEmailModal(false)} onSuccess={() => { setShowScheduleEmailModal(false); }} />}

            <Navbar
                view={view}
                onViewChange={(newView) => { setView(newView); setIsSidebarOpen(false); if (newView === 'events') loadEvents(); }}
                onSignOut={signOut}
                onAddContact={() => setShowAddOptionsModal(true)}
                userName={profile?.full_name || 'Utilisateur'}
                userEmail={profile?.email || ''}
                stats={{
                    total: globalKpis.totalContacts, leads: globalKpis.totalLeads, prospects: globalKpis.totalProspects,
                    clients: globalKpis.totalClients, partners: globalKpis.totalPartners,
                    collaborateurs: globalKpis.totalCollaborateurs, amis: globalKpis.totalAmis, fournisseurs: globalKpis.totalFournisseurs,
                }}
                eventsCount={globalKpis.totalEvents}
                followUpsCount={0}
            />
        </div>
    );
}
