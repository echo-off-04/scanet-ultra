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

    const filterAndSortContacts = useCallback(async () => {
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
        <div className="flex h-screen bg-white overflow-hidden relative">
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

            <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
                <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                            <img src="https://i.ibb.co/q3YDjGLC/Scanetwork.png" alt="Scanetwork" className="h-8 sm:h-9 lg:hidden object-contain flex-shrink-0" />
                            <div className="min-w-0">
                                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                                    {view === 'dashboard' && 'Tableau de bord'}
                                    {view === 'contacts' && 'Mes Contacts'}
                                    {view === 'events' && 'Événements'}
                                    {view === 'followups' && 'Relances'}
                                    {view === 'opportunities' && 'Opportunités'}
                                    {view === 'offers' && 'Offres'}
                                    {view === 'enterprise' && 'Entreprise'}
                                    {view === 'settings' && 'Paramètres'}
                                </h2>
                                <p className="text-xs sm:text-sm text-muted mt-0.5 truncate hidden sm:block">Bienvenue, {profile?.full_name || 'User'}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 pb-32 lg:pb-8">
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
                                <div className="text-center py-16 glass-card">
                                    <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-500 border-t-transparent mx-auto" />
                                    <p className="mt-4 text-gray-700 font-semibold">Chargement des contacts...</p>
                                </div>
                            ) : filteredContacts.length === 0 ? (
                                <div className="text-center py-16 glass-card">
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                                        <Users className="w-10 h-10 text-blue-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">Aucun contact trouvé</h3>
                                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                        {searchTerm || filterStatus !== 'all' || filters.events.length > 0 || filters.tags.length > 0
                                            ? "Essayez d'ajuster vos filtres pour voir plus de résultats"
                                            : 'Commencez à construire votre réseau en ajoutant votre premier contact'}
                                    </p>
                                    {!searchTerm && filterStatus === 'all' && filters.events.length === 0 && (
                                        <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold shadow-lg shadow-blue-200">
                                            <Plus className="w-5 h-5" />Ajouter votre premier contact
                                        </button>
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
                                <HeroText>Pilotez votre</HeroText>
                                <HeroText highlight highlightColor="blue">activité commerciale</HeroText>
                                <HeroText>en temps réel</HeroText>
                            </Hero>

                            {/* KPI Cards */}
                            <div className="bg-white/90 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-5 lg:p-6 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6 lg:gap-8">
                                    <div className="grid grid-cols-2 gap-3 lg:gap-4">
                                        {/* Total Contacts - Dark card */}
                                        <div className="group relative overflow-hidden">
                                            <div className="relative rounded-xl lg:rounded-2xl p-4 lg:p-5 border transition-all duration-300 hover:-translate-y-0.5 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700/50 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent opacity-60 rounded-xl lg:rounded-2xl" />
                                                <div className="relative z-10">
                                                    <div className="flex items-center gap-2 mb-2 lg:mb-3">
                                                        <div className="p-1.5 rounded-lg bg-white/10"><Users className="w-3.5 h-3.5 text-white/90" strokeWidth={2} /></div>
                                                        <p className="text-[10px] lg:text-xs font-medium uppercase tracking-wider text-white/70">Total Contacts</p>
                                                    </div>
                                                    <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">{globalKpis.totalContacts}</h3>
                                                </div>
                                            </div>
                                        </div>

                                        {/* CA Gagné */}
                                        <div className="group relative overflow-hidden">
                                            <div className="relative rounded-xl lg:rounded-2xl p-4 lg:p-5 border transition-all duration-300 hover:-translate-y-0.5 bg-white border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                                                <div className="relative z-10">
                                                    <div className="flex items-center gap-2 mb-2 lg:mb-3">
                                                        <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#10b98115' }}><DollarSign className="w-3.5 h-3.5" strokeWidth={2} style={{ color: '#10b981' }} /></div>
                                                        <p className="text-[10px] lg:text-xs font-medium uppercase tracking-wider text-gray-500">CA Gagné</p>
                                                    </div>
                                                    <h3 className="text-xl lg:text-2xl font-bold tracking-tight text-gray-900">{formatCurrency(globalKpis.wonAmount, globalKpis.userCurrency)}</h3>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Opportunités */}
                                        <div className="group relative overflow-hidden">
                                            <div className="relative rounded-xl lg:rounded-2xl p-4 lg:p-5 border transition-all duration-300 hover:-translate-y-0.5 bg-white border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                                                <div className="relative z-10">
                                                    <div className="flex items-center gap-2 mb-2 lg:mb-3">
                                                        <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#8b5cf615' }}><Target className="w-3.5 h-3.5" strokeWidth={2} style={{ color: '#8b5cf6' }} /></div>
                                                        <p className="text-[10px] lg:text-xs font-medium uppercase tracking-wider text-gray-500">Opportunités</p>
                                                    </div>
                                                    <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-gray-900">{globalKpis.activeOpportunities}</h3>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pipeline */}
                                        <div className="group relative overflow-hidden">
                                            <div className="relative rounded-xl lg:rounded-2xl p-4 lg:p-5 border transition-all duration-300 hover:-translate-y-0.5 bg-white border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                                                <div className="relative z-10">
                                                    <div className="flex items-center gap-2 mb-2 lg:mb-3">
                                                        <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#f59e0b15' }}><TrendingUp className="w-3.5 h-3.5" strokeWidth={2} style={{ color: '#f59e0b' }} /></div>
                                                        <p className="text-[10px] lg:text-xs font-medium uppercase tracking-wider text-gray-500">Pipeline</p>
                                                    </div>
                                                    <h3 className="text-xl lg:text-2xl font-bold tracking-tight text-gray-900">{formatCurrency(globalKpis.totalPipeline, globalKpis.userCurrency)}</h3>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-xl lg:rounded-2xl p-5 lg:p-6 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden">
                                        <div className="relative z-10">
                                            <div className="mb-4">
                                                <h3 className="text-sm font-semibold text-gray-700 mb-1">Actions rapides</h3>
                                                <p className="text-xs text-gray-500">Gérez rapidement vos contacts et opportunités</p>
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                {[
                                                    { onClick: () => setShowAddModal(true), icon: Plus, color: 'blue', title: 'Nouveau contact', desc: 'Ajouter un contact à votre réseau' },
                                                    { onClick: () => setShowAddEventModal(true), icon: Calendar, color: 'purple', title: 'Nouvel événement', desc: 'Créer un événement de networking' },
                                                    { onClick: () => setView('opportunities'), icon: Target, color: 'emerald', title: 'Opportunités', desc: 'Gérer vos opportunités commerciales' },
                                                    { onClick: () => setView('offers'), icon: Briefcase, color: 'orange', title: 'Offres', desc: 'Consulter vos offres commerciales' },
                                                ].map((action) => (
                                                    <button key={action.title} onClick={action.onClick} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 group">
                                                        <div className={`w-10 h-10 rounded-lg bg-${action.color}-50 flex items-center justify-center group-hover:bg-${action.color}-100 transition-colors`}>
                                                            <action.icon className={`w-5 h-5 text-${action.color}-600`} />
                                                        </div>
                                                        <div className="flex-1 text-left">
                                                            <div className="font-semibold text-gray-900 text-sm">{action.title}</div>
                                                            <div className="text-xs text-gray-500">{action.desc}</div>
                                                        </div>
                                                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <PersonalObjectives />

                            {/* Derniers contacts ajoutés */}
                            <div className="relative overflow-hidden glass-card p-5 lg:p-6">
                                <div className="relative flex items-center justify-between mb-5">
                                    <h3 className="text-xl font-bold text-gray-900">Derniers contacts ajoutés</h3>
                                    <button onClick={() => setView('contacts')} className="text-sm font-semibold text-[#0E3A5D] hover:text-[#1e5a8e] flex items-center gap-1 transition-all">
                                        Voir tous <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                                {contacts.length === 0 ? (
                                    <div className="relative text-center py-12 px-4">
                                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">Aucun contact trouvé</p>
                                    </div>
                                ) : (
                                    <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                        {contacts.slice(0, 5).map((contact) => (
                                            <div key={contact.id} onClick={() => handleContactClick(contact)} className="glass-card p-4 cursor-pointer group">
                                                <div className="flex flex-col items-center text-center">
                                                    {contact.avatar_url ? (
                                                        <img src={contact.avatar_url} alt={contact.full_name} className="w-16 h-16 rounded-full object-cover ring-2 ring-white/50 shadow-lg mb-3" />
                                                    ) : (
                                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-semibold ring-2 ring-white/50 shadow-lg mb-3">
                                                            {contact.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                                                        </div>
                                                    )}
                                                    <h3 className="font-bold text-gray-900 text-sm truncate w-full mb-1">{contact.full_name}</h3>
                                                    {contact.company && <p className="text-xs text-gray-600 truncate w-full mb-2">{contact.company}</p>}
                                                    {contact.rating && contact.rating > 0 && (
                                                        <div className="flex gap-0.5">
                                                            {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < contact.rating! ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-300'}`} />)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Derniers événements */}
                            <div className="relative overflow-hidden glass-card p-5 lg:p-6">
                                <div className="relative flex items-center justify-between mb-5">
                                    <h3 className="text-xl font-bold text-gray-900">Derniers événements</h3>
                                    <button onClick={() => setView('events')} className="text-sm font-semibold text-[#0E3A5D] hover:text-[#1e5a8e] flex items-center gap-1 transition-all">
                                        Voir tous <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                                {eventsLoading ? (
                                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                        {[...Array(4)].map((_, i) => <div key={i} className="flex-shrink-0 w-64 h-40 rounded-3xl bg-gray-100 animate-pulse" />)}
                                    </div>
                                ) : events.length === 0 ? (
                                    <div className="relative text-center py-12 px-4">
                                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">Aucun événement trouvé</p>
                                    </div>
                                ) : (
                                    <div className="relative flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                        {events.slice(0, 6).map((event) => (
                                            <div key={event.id} onClick={() => setSelectedEventId(event.id)} className="flex-shrink-0 w-64 glass-card p-4 cursor-pointer group text-left">
                                                {event.image_url ? (
                                                    <div className="w-full h-24 rounded-2xl mb-3 overflow-hidden bg-gray-100 ring-2 ring-white/50 shadow-lg">
                                                        <img src={event.image_url} alt={event.name} className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-24 rounded-2xl mb-3 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center ring-2 ring-white/50 shadow-lg">
                                                        <Calendar className="w-8 h-8 text-white" />
                                                    </div>
                                                )}
                                                <h4 className="font-bold text-gray-900 line-clamp-1 mb-2">{event.name}</h4>
                                                <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                                                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                                                    {event.start_date ? new Date(event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Date non définie'}
                                                </div>
                                                {event.location && (
                                                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                                                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" /><span className="line-clamp-1">{event.location}</span>
                                                    </div>
                                                )}
                                                <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">{event.contact_count || 0} contacts</span>
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
