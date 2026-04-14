'use client';

import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Grid3x3, List, Images, X, ChevronDown, Plus } from 'lucide-react';
import { FilterDropdown } from './FilterDropdown';
import type { ViewMode, SortOption, Event } from '@/types';

interface ContactsToolbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    sortBy: SortOption;
    onSortChange: (sort: SortOption) => void;
    filters: {
        events: string[];
        tags: string[];
        relationships: string[];
        cities: string[];
        regions: string[];
        countries: string[];
        opportunityMin: number | null;
        opportunityMax: number | null;
    };
    onFiltersChange: (filters: any) => void;
    availableTags: string[];
    onAddContact?: () => void;
}

export function ContactsToolbar({
    searchTerm, onSearchChange, viewMode, onViewModeChange, sortBy, onSortChange,
    filters, onFiltersChange, availableTags, onAddContact,
}: ContactsToolbarProps) {
    const [showFilters, setShowFilters] = useState(false);
    const [events, setEvents] = useState<Event[]>([]);

    useEffect(() => {
        fetch('/api/events').then(r => r.json()).then(data => setEvents(data.events || [])).catch(console.error);
    }, []);

    const sortOptions = [
        { value: 'name_asc', label: 'Nom (A-Z)' }, { value: 'name_desc', label: 'Nom (Z-A)' },
        { value: 'date_desc', label: 'Plus récents' }, { value: 'date_asc', label: 'Plus anciens' },
        { value: 'rating_desc', label: 'Meilleure note' }, { value: 'rating_asc', label: 'Note la plus basse' },
    ];

    const relationshipOptions = [
        { value: 'colleague', label: 'Collègue' }, { value: 'client', label: 'Client' },
        { value: 'vendor', label: 'Fournisseur' }, { value: 'partner', label: 'Partenaire' },
        { value: 'friend', label: 'Ami' }, { value: 'other', label: 'Autre' },
    ];

    const activeFiltersCount =
        filters.events.length + filters.tags.length + filters.relationships.length +
        filters.cities.length + filters.regions.length + filters.countries.length +
        (filters.opportunityMin !== null ? 1 : 0) + (filters.opportunityMax !== null ? 1 : 0);

    const clearFilters = () => {
        onFiltersChange({ events: [], tags: [], relationships: [], cities: [], regions: [], countries: [], opportunityMin: null, opportunityMax: null });
    };

    return (
        <div className="glass-card p-4 lg:p-6 space-y-4 mb-6">
            <div className="flex flex-col gap-3">
                <div className="w-full relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text" value={searchTerm} onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Rechercher un contact (nom, email, entreprise...)"
                        className="w-full pl-12 pr-4 py-3 text-sm lg:text-base bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all shadow-sm"
                    />
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex gap-2 bg-white/40 backdrop-blur-sm rounded-2xl p-1.5 border border-white/60">
                        {(['grid', 'list', 'photos'] as ViewMode[]).map((mode) => {
                            const Icon = mode === 'grid' ? Grid3x3 : mode === 'list' ? List : Images;
                            return (
                                <button key={mode} onClick={() => onViewModeChange(mode)}
                                    className={`p-2 rounded-xl transition-all ${viewMode === mode ? 'bg-gradient-to-br from-white to-blue-50 shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
                                    title={mode === 'grid' ? 'Vue en cartes' : mode === 'list' ? 'Vue en liste' : 'Vue en photos'}
                                >
                                    <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative flex-1 min-w-[140px]">
                        <select value={sortBy} onChange={(e) => onSortChange(e.target.value as SortOption)}
                            className="appearance-none w-full pl-3 pr-9 py-2.5 text-sm lg:text-base bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-sm border border-white/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all shadow-sm cursor-pointer font-medium hover:shadow-md"
                        >
                            {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    <button onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm lg:text-base rounded-2xl transition-all whitespace-nowrap font-semibold shadow-sm hover:shadow-md ${showFilters || activeFiltersCount > 0
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200 hover:from-blue-600 hover:to-blue-700'
                                : 'bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-sm text-gray-700 hover:from-white hover:to-white/80 border border-white/60'
                            }`}
                    >
                        <SlidersHorizontal className="w-4 h-4 lg:w-5 lg:h-5" /><span className="hidden sm:inline">Filtres</span>
                        {activeFiltersCount > 0 && (
                            <span className="bg-white/25 rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-bold">{activeFiltersCount}</span>
                        )}
                    </button>

                    {onAddContact && (
                        <button onClick={onAddContact}
                            className="hidden lg:flex items-center gap-2 px-5 py-2.5 text-sm lg:text-base rounded-full transition-all whitespace-nowrap font-semibold shadow-lg hover:shadow-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white ml-auto"
                        >
                            <Plus className="w-5 h-5" /><span>Ajouter un contact</span>
                        </button>
                    )}
                </div>
            </div>

            {showFilters && (
                <div className="pt-5 border-t border-white/40 space-y-5">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-gray-900 text-base lg:text-lg">Filtres avancés</h3>
                        {activeFiltersCount > 0 && (
                            <button onClick={clearFilters}
                                className="text-sm lg:text-base text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-blue-50 to-white hover:from-blue-100 hover:to-blue-50 transition-all shadow-sm hover:shadow-md"
                            >
                                <X className="w-4 h-4" />Réinitialiser
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FilterDropdown label="Événements" options={events.map(e => ({ value: e.id, label: e.name }))} selectedValues={filters.events} onChange={(v) => onFiltersChange({ ...filters, events: v })} placeholder="Sélectionner des événements" />
                        <FilterDropdown label="Tags" options={availableTags.map(t => ({ value: t, label: t }))} selectedValues={filters.tags} onChange={(v) => onFiltersChange({ ...filters, tags: v })} placeholder="Sélectionner des tags" />
                        <FilterDropdown label="Type de relation" options={relationshipOptions} selectedValues={filters.relationships} onChange={(v) => onFiltersChange({ ...filters, relationships: v })} placeholder="Sélectionner des relations" />
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Ville</label>
                            <input type="text" placeholder="Entrer une ville" value={filters.cities[0] || ''} onChange={(e) => onFiltersChange({ ...filters, cities: e.target.value ? [e.target.value] : [] })} className="w-full bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Région</label>
                            <input type="text" placeholder="Entrer une région" value={filters.regions[0] || ''} onChange={(e) => onFiltersChange({ ...filters, regions: e.target.value ? [e.target.value] : [] })} className="w-full bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Pays</label>
                            <input type="text" placeholder="Entrer un pays" value={filters.countries[0] || ''} onChange={(e) => onFiltersChange({ ...filters, countries: e.target.value ? [e.target.value] : [] })} className="w-full bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Montant d&apos;opportunité (min)</label>
                            <input type="number" placeholder="0" value={filters.opportunityMin || ''} onChange={(e) => onFiltersChange({ ...filters, opportunityMin: e.target.value ? parseFloat(e.target.value) : null })} className="w-full bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Montant d&apos;opportunité (max)</label>
                            <input type="number" placeholder="∞" value={filters.opportunityMax || ''} onChange={(e) => onFiltersChange({ ...filters, opportunityMax: e.target.value ? parseFloat(e.target.value) : null })} className="w-full bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm transition-all" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
