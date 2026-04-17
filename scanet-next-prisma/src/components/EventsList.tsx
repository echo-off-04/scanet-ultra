'use client';

import { useState, useEffect } from 'react';
import {
    Calendar, MapPin, Users, Plus, Search, Filter,
    TrendingUp, Video, Building2, Globe, X, AlertTriangle, ArrowUpRight, Target, UserPlus
} from 'lucide-react';
import { Hero, HeroText } from './Hero';
import { MaterialButton } from './material/MaterialButton';

interface Event {
    id: string;
    name: string;
    description: string | null;
    category: string;
    event_type: string;
    status: string;
    start_date: string | null;
    end_date: string | null;
    location: string | null;
    image_url: string | null;
    target_participants: number;
    actual_participants: number;
    primary_objective: string | null;
    leads_generated: number;
    contacts_added: number;
    conversion_rate: number;
    performance_score: number;
    created_at: string;
}

const CATEGORIES = [
    { value: 'conference', label: 'Conférence' },
    { value: 'seminar', label: 'Séminaire' },
    { value: 'networking', label: 'Networking' },
    { value: 'salon', label: 'Salon' },
    { value: 'gala', label: 'Soirée gala' },
    { value: 'meetup', label: 'Meetup' },
];

const EVENT_TYPES = [
    { value: 'presentiel', label: 'Présentiel', icon: Building2 },
    { value: 'online', label: 'En ligne', icon: Globe },
    { value: 'hybride', label: 'Hybride', icon: Video },
];

const STATUS_OPTIONS = [
    { value: 'upcoming', label: 'À venir' },
    { value: 'ongoing', label: 'En cours' },
    { value: 'completed', label: 'Terminé' },
    { value: 'cancelled', label: 'Annulé' },
];

const calculateEventStatus = (event: Event): string => {
    if (event.status === 'cancelled') return 'cancelled';
    const now = new Date();
    const startDate = event.start_date ? new Date(event.start_date) : null;
    const endDate = event.end_date ? new Date(event.end_date) : null;
    if (!startDate) return 'upcoming';
    if (endDate && now > endDate) return 'completed';
    if (now >= startDate && (!endDate || now <= endDate)) return 'ongoing';
    if (now < startDate) return 'upcoming';
    return 'upcoming';
};

interface EventsListProps {
    onEventClick: (eventId: string) => void;
    onCreateEvent: () => void;
    refreshKey?: number;
}

export function EventsList({ onEventClick, onCreateEvent, refreshKey = 0 }: EventsListProps) {
    const [events, setEvents] = useState<Event[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedType, setSelectedType] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [sortBy, setSortBy] = useState<string>('date');

    useEffect(() => {
        loadEvents();
    }, [refreshKey]);

    useEffect(() => {
        filterAndSortEvents();
    }, [events, searchQuery, selectedCategory, selectedType, selectedStatus, sortBy]);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/events');
            if (!res.ok) throw new Error('Failed to load events');
            const data = await res.json();
            setEvents(data.events || []);
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortEvents = () => {
        let filtered = [...events];
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (event) =>
                    event.name.toLowerCase().includes(query) ||
                    event.description?.toLowerCase().includes(query) ||
                    event.location?.toLowerCase().includes(query)
            );
        }
        if (selectedCategory) filtered = filtered.filter((event) => event.category === selectedCategory);
        if (selectedType) filtered = filtered.filter((event) => event.event_type === selectedType);
        if (selectedStatus) filtered = filtered.filter((event) => event.status === selectedStatus);
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'date': return new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime();
                case 'participants': return b.actual_participants - a.actual_participants;
                case 'performance': return b.performance_score - a.performance_score;
                case 'name': return a.name.localeCompare(b.name);
                default: return 0;
            }
        });
        setFilteredEvents(filtered);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return { day: '--', month: '---', year: '----' };
        const date = new Date(dateString);
        return {
            day: date.toLocaleDateString('fr-FR', { day: 'numeric' }),
            month: date.toLocaleDateString('fr-FR', { month: 'short' }),
            year: date.toLocaleDateString('fr-FR', { year: 'numeric' })
        };
    };

    const getStatusInfo = (status: string) => STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
    const getCategoryLabel = (category: string) => CATEGORIES.find((c) => c.value === category)?.label || category;
    const getTypeInfo = (type: string) => EVENT_TYPES.find((t) => t.value === type);

    const clearFilters = () => { setSearchQuery(''); setSelectedCategory(''); setSelectedType(''); setSelectedStatus(''); setSortBy('date'); };
    const hasActiveFilters = searchQuery || selectedCategory || selectedType || selectedStatus;

    const totalContacts = events.reduce((sum, e) => sum + e.contacts_added, 0);
    const totalLeads = events.reduce((sum, e) => sum + e.leads_generated, 0);
    const avgScore = events.length > 0 ? events.reduce((sum, e) => sum + e.performance_score, 0) / events.length : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"></div>
                    <p className="font-medium text-slate-600">Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <Hero label="Get Into It" imageUrl="https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg" imageAlt="Événements professionnels">
                <HeroText>Organisez et suivez</HeroText>
                <HeroText highlight highlightColor="green">vos événements</HeroText>
                <HeroText>de networking</HeroText>
            </Hero>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div><p className="text-lg text-slate-500">{events.length} événement{events.length !== 1 ? 's' : ''}</p></div>
                <MaterialButton onClick={onCreateEvent} icon={<Plus className="h-5 w-5" />} className="self-start lg:self-auto">
                    Créer un événement
                </MaterialButton>
            </div>

            {events.length > 0 && (
                <div className="grid grid-cols-2 gap-3 lg:gap-4">
                    <div className="stat-card">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500 lg:text-xs">Événements</p>
                                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 lg:text-3xl">{events.length}</h3>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[rgba(0,87,184,0.12)] bg-[#f4f8fe] text-[#0057b8]"><Calendar className="h-5 w-5" strokeWidth={2} /></div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500 lg:text-xs">Leads</p>
                                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 lg:text-3xl">{totalLeads}</h3>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[rgba(0,87,184,0.12)] bg-[#f4f8fe] text-[#0057b8]"><Target className="h-5 w-5" strokeWidth={2} /></div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500 lg:text-xs">Contacts</p>
                                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 lg:text-3xl">{totalContacts}</h3>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700"><UserPlus className="h-5 w-5" strokeWidth={2} /></div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500 lg:text-xs">Score</p>
                                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 lg:text-3xl">{avgScore.toFixed(0)}</h3>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[rgba(0,87,184,0.12)] bg-[#f4f8fe] text-[#0057b8]"><TrendingUp className="h-5 w-5" strokeWidth={2} /></div>
                        </div>
                    </div>
                </div>
            )}

            <div className="rounded-[24px] border border-[rgba(201,212,223,0.9)] bg-white p-6 shadow-[0_12px_24px_rgba(15,35,58,0.03)]">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-modern py-4 pl-14 pr-6" />
                    </div>
                    <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-3 whitespace-nowrap rounded-xl px-6 py-4 font-medium transition-colors ${showFilters || hasActiveFilters ? 'border border-[rgba(0,87,184,0.2)] bg-[#eef5fe] text-[#0057b8]' : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>
                        <Filter className="h-5 w-5" />Filtres
                        {hasActiveFilters && !showFilters && <span className="h-2 w-2 rounded-full bg-[#0057b8]"></span>}
                    </button>
                </div>

                {showFilters && (
                    <div className="mt-6 border-t border-slate-200 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-slate-700">Catégorie</label>
                                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="input-modern">
                                    <option value="">Toutes</option>
                                    {CATEGORIES.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-slate-700">Type</label>
                                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="input-modern">
                                    <option value="">Tous</option>
                                    {EVENT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-slate-700">Statut</label>
                                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="input-modern">
                                    <option value="">Tous</option>
                                    {STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-slate-700">Trier par</label>
                                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-modern">
                                    <option value="date">Date</option><option value="name">Nom</option><option value="participants">Participants</option><option value="performance">Performance</option>
                                </select>
                            </div>
                        </div>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="mt-6 flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors hover:text-slate-900">
                                <X className="h-4 w-4" />Réinitialiser
                            </button>
                        )}
                    </div>
                )}
            </div>

            {filteredEvents.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100"><Calendar className="h-10 w-10 text-slate-400" /></div>
                    <h3 className="mb-3 text-2xl font-semibold text-slate-900">{events.length === 0 ? 'Aucun événement' : 'Aucun résultat'}</h3>
                    <p className="mx-auto mb-8 max-w-md text-lg text-slate-500">{events.length === 0 ? 'Créez votre premier événement pour commencer.' : 'Modifiez vos filtres pour voir plus de résultats.'}</p>
                    {events.length === 0 && (
                        <MaterialButton onClick={onCreateEvent} icon={<Plus className="h-5 w-5" />}>
                            Créer un événement
                        </MaterialButton>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map((event) => {
                        const calculatedStatus = calculateEventStatus(event);
                        const statusInfo = getStatusInfo(calculatedStatus);
                        const typeInfo = getTypeInfo(event.event_type);
                        const TypeIcon = typeInfo?.icon || Building2;
                        const progressPercentage = event.target_participants > 0 ? Math.min(100, (event.actual_participants / event.target_participants) * 100) : 0;
                        const dateObj = formatDate(event.start_date);

                        return (
                            <div key={event.id} onClick={() => onEventClick(event.id)} className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors hover:bg-slate-50">
                                <div className="relative h-48 overflow-hidden border-b border-slate-200 bg-slate-100">
                                    {event.image_url ? (
                                        <>
                                            <img src={event.image_url} alt={event.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                                        </>
                                    ) : (
                                        <Calendar className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-slate-300" />
                                    )}
                                    <div className="absolute left-4 top-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                        <p className="leading-none text-3xl font-semibold text-slate-900">{dateObj.day}</p>
                                        <p className="text-xs font-semibold uppercase text-slate-500">{dateObj.month}</p>
                                    </div>
                                    <div className="absolute top-4 right-4">
                                        <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm">{statusInfo.label}</span>
                                    </div>
                                    {(!event.target_participants || event.target_participants === 0) && (
                                        <div className="absolute bottom-4 left-4">
                                            <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm"><AlertTriangle className="h-3.5 w-3.5" />Configurer</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6">
                                    <div className="mb-4">
                                        <h3 className="mb-2 line-clamp-2 text-xl font-semibold text-slate-900">{event.name}</h3>
                                        <p className="text-sm font-medium uppercase tracking-wider text-slate-500">{getCategoryLabel(event.category)}</p>
                                    </div>
                                    {event.description && <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-slate-600">{event.description}</p>}
                                    <div className="mb-5 space-y-3">
                                        {event.location && (
                                            <div className="flex items-center gap-3 text-sm text-slate-700"><TypeIcon className="h-4 w-4 text-slate-400" strokeWidth={2} /><span className="truncate font-medium">{event.location}</span></div>
                                        )}
                                    </div>
                                    <div className="mb-5">
                                        <div className="mb-2 flex items-center justify-between text-sm">
                                            <span className="font-medium text-slate-500">Participants</span>
                                            <span className="font-semibold text-slate-900">{event.actual_participants} / {event.target_participants || 0}</span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                            <div className="h-full rounded-full bg-slate-700 transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                                        </div>
                                    </div>
                                    <div className="border-t border-slate-200 pt-5">
                                        <div className="grid grid-cols-3 gap-4">
                                            <div><p className="text-2xl font-semibold text-slate-900">{event.leads_generated}</p><p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">Leads</p></div>
                                            <div><p className="text-2xl font-semibold text-slate-900">{event.contacts_added}</p><p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">Contacts</p></div>
                                            <div><div className="flex items-center gap-1"><p className="text-2xl font-semibold text-slate-900">{event.performance_score.toFixed(0)}</p><TrendingUp className="h-4 w-4 text-slate-400" /></div><p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">Score</p></div>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-6 right-6 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white opacity-0 transition-all duration-200 group-hover:opacity-100">
                                        <ArrowUpRight className="h-5 w-5 text-slate-700" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
