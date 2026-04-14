'use client';

import { useState, useEffect } from 'react';
import {
    Calendar, MapPin, Users, Plus, Search, Filter,
    TrendingUp, Video, Building2, Globe, X, AlertTriangle, ArrowUpRight, Target, UserPlus
} from 'lucide-react';
import { Hero, HeroText } from './Hero';

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
    { value: 'upcoming', label: 'À venir', gradient: 'from-blue-500 to-blue-600' },
    { value: 'ongoing', label: 'En cours', gradient: 'from-emerald-500 to-emerald-600' },
    { value: 'completed', label: 'Terminé', gradient: 'from-gray-400 to-gray-500' },
    { value: 'cancelled', label: 'Annulé', gradient: 'from-red-500 to-red-600' },
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
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-900 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600 font-semibold">Chargement...</p>
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
                <div><p className="text-lg text-gray-500">{events.length} événement{events.length !== 1 ? 's' : ''}</p></div>
                <button onClick={onCreateEvent} className="group relative overflow-hidden bg-gradient-to-r from-[#0E3A5D] to-[#1e5a8e] text-white px-8 py-4 rounded-full transition-all font-semibold shadow-2xl transform hover:scale-105 flex items-center gap-3">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 group-hover:translate-x-full transition-transform duration-700" />
                    <Plus className="w-5 h-5 relative z-10" /><span className="relative z-10">Créer un événement</span>
                </button>
            </div>

            {events.length > 0 && (
                <div className="grid grid-cols-2 gap-3 lg:gap-4">
                    <div className="group relative overflow-hidden">
                        <div className="relative rounded-xl lg:rounded-2xl p-4 lg:p-5 border transition-all duration-300 hover:-translate-y-0.5 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700/50 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent opacity-60 rounded-xl lg:rounded-2xl" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2 lg:mb-3">
                                    <div className="p-1.5 rounded-lg bg-white/10"><Calendar className="w-3.5 h-3.5 text-white/90" strokeWidth={2} /></div>
                                    <p className="text-[10px] lg:text-xs font-medium uppercase tracking-wider text-white/70">Événements</p>
                                </div>
                                <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">{events.length}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="group relative overflow-hidden">
                        <div className="relative rounded-xl lg:rounded-2xl p-4 lg:p-5 border transition-all duration-300 hover:-translate-y-0.5 bg-white border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2 lg:mb-3">
                                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#3b82f615' }}><Target className="w-3.5 h-3.5" strokeWidth={2} style={{ color: '#3b82f6' }} /></div>
                                    <p className="text-[10px] lg:text-xs font-medium uppercase tracking-wider text-gray-500">Leads</p>
                                </div>
                                <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-gray-900">{totalLeads}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="group relative overflow-hidden">
                        <div className="relative rounded-xl lg:rounded-2xl p-4 lg:p-5 border transition-all duration-300 hover:-translate-y-0.5 bg-white border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2 lg:mb-3">
                                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#10b98115' }}><UserPlus className="w-3.5 h-3.5" strokeWidth={2} style={{ color: '#10b981' }} /></div>
                                    <p className="text-[10px] lg:text-xs font-medium uppercase tracking-wider text-gray-500">Contacts</p>
                                </div>
                                <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-gray-900">{totalContacts}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="group relative overflow-hidden">
                        <div className="relative rounded-xl lg:rounded-2xl p-4 lg:p-5 border transition-all duration-300 hover:-translate-y-0.5 bg-white border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2 lg:mb-3">
                                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#8b5cf615' }}><TrendingUp className="w-3.5 h-3.5" strokeWidth={2} style={{ color: '#8b5cf6' }} /></div>
                                    <p className="text-[10px] lg:text-xs font-medium uppercase tracking-wider text-gray-500">Score</p>
                                </div>
                                <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-gray-900">{avgScore.toFixed(0)}</h3>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-3xl border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all text-gray-900 placeholder-gray-400" />
                    </div>
                    <button onClick={() => setShowFilters(!showFilters)} className={`px-8 py-4 rounded-2xl transition-all font-semibold whitespace-nowrap flex items-center gap-3 ${showFilters || hasActiveFilters ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
                        <Filter className="w-5 h-5" />Filtres
                        {hasActiveFilters && !showFilters && <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>}
                    </button>
                </div>

                {showFilters && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-900 mb-3 uppercase tracking-wider">Catégorie</label>
                                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all text-gray-900">
                                    <option value="">Toutes</option>
                                    {CATEGORIES.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-900 mb-3 uppercase tracking-wider">Type</label>
                                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all text-gray-900">
                                    <option value="">Tous</option>
                                    {EVENT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-900 mb-3 uppercase tracking-wider">Statut</label>
                                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all text-gray-900">
                                    <option value="">Tous</option>
                                    {STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-900 mb-3 uppercase tracking-wider">Trier par</label>
                                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all text-gray-900">
                                    <option value="date">Date</option><option value="name">Nom</option><option value="participants">Participants</option><option value="performance">Performance</option>
                                </select>
                            </div>
                        </div>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="mt-6 flex items-center gap-2 text-sm text-gray-900 hover:text-gray-700 font-semibold transition-colors">
                                <X className="w-4 h-4" />Réinitialiser
                            </button>
                        )}
                    </div>
                )}
            </div>

            {filteredEvents.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6"><Calendar className="w-12 h-12 text-gray-400" /></div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{events.length === 0 ? 'Aucun événement' : 'Aucun résultat'}</h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg">{events.length === 0 ? 'Créez votre premier événement pour commencer.' : 'Modifiez vos filtres pour voir plus de résultats.'}</p>
                    {events.length === 0 && (
                        <button onClick={onCreateEvent} className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#0E3A5D] to-[#1e5a8e] text-white rounded-full transition-all font-semibold shadow-2xl">
                            <Plus className="w-5 h-5" />Créer un événement
                        </button>
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
                            <div key={event.id} onClick={() => onEventClick(event.id)} className="group relative bg-white rounded-3xl border border-gray-200 overflow-hidden hover:border-gray-900 hover:shadow-2xl transition-all duration-300 cursor-pointer">
                                <div className="relative h-48 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
                                    {event.image_url ? (
                                        <>
                                            <img src={event.image_url} alt={event.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        </>
                                    ) : (
                                        <Calendar className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 text-white opacity-20" />
                                    )}
                                    <div className="absolute top-4 left-4 bg-white rounded-2xl p-3 shadow-lg">
                                        <p className="text-3xl font-bold text-gray-900 leading-none">{dateObj.day}</p>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">{dateObj.month}</p>
                                    </div>
                                    <div className="absolute top-4 right-4">
                                        <span className={`px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r ${statusInfo.gradient} shadow-lg backdrop-blur-sm`}>{statusInfo.label}</span>
                                    </div>
                                    {(!event.target_participants || event.target_participants === 0) && (
                                        <div className="absolute bottom-4 left-4">
                                            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-400 text-gray-900 flex items-center gap-1.5 shadow-lg"><AlertTriangle className="w-3.5 h-3.5" />Configurer</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6">
                                    <div className="mb-4">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-700 transition-colors">{event.name}</h3>
                                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{getCategoryLabel(event.category)}</p>
                                    </div>
                                    {event.description && <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">{event.description}</p>}
                                    <div className="space-y-3 mb-5">
                                        {event.location && (
                                            <div className="flex items-center gap-3 text-sm text-gray-700"><TypeIcon className="w-4 h-4 text-gray-400" strokeWidth={2} /><span className="truncate font-medium">{event.location}</span></div>
                                        )}
                                    </div>
                                    <div className="mb-5">
                                        <div className="flex items-center justify-between text-sm mb-2">
                                            <span className="text-gray-500 font-semibold">Participants</span>
                                            <span className="font-bold text-gray-900">{event.actual_participants} / {event.target_participants || 0}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                            <div className="h-full rounded-full bg-gradient-to-r from-gray-900 to-gray-700 transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                                        </div>
                                    </div>
                                    <div className="pt-5 border-t border-gray-100">
                                        <div className="grid grid-cols-3 gap-4">
                                            <div><p className="text-2xl font-bold text-gray-900">{event.leads_generated}</p><p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1">Leads</p></div>
                                            <div><p className="text-2xl font-bold text-gray-900">{event.contacts_added}</p><p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1">Contacts</p></div>
                                            <div><div className="flex items-center gap-1"><p className="text-2xl font-bold text-gray-900">{event.performance_score.toFixed(0)}</p><TrendingUp className="w-4 h-4 text-gray-400" /></div><p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1">Score</p></div>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
                                        <ArrowUpRight className="w-5 h-5 text-white" />
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
