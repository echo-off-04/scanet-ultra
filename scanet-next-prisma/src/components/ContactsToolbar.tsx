'use client';

import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Grid3x3, List, Images, X, ChevronDown, Plus } from 'lucide-react';
import { FilterDropdown } from './FilterDropdown';
import { MaterialButton } from './material/MaterialButton';
import { MaterialIconButton } from './material/MaterialIconButton';
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
        <div className="mb-6 space-y-4 rounded-xl border border-slate-200 bg-white p-4 lg:p-6">
            <div className="flex flex-col gap-3">
                <div className="w-full relative">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text" value={searchTerm} onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Rechercher un contact (nom, email, entreprise...)"
                        className="input-modern py-3 pl-12 pr-4 text-sm lg:text-base"
                    />
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5">
                        {(['grid', 'list', 'photos'] as ViewMode[]).map((mode) => {
                            const Icon = mode === 'grid' ? Grid3x3 : mode === 'list' ? List : Images;
                            return (
                                <MaterialIconButton
                                    key={mode}
                                    ariaLabel={mode === 'grid' ? 'Vue en cartes' : mode === 'list' ? 'Vue en liste' : 'Vue en photos'}
                                    onClick={() => onViewModeChange(mode)}
                                    variant={viewMode === mode ? 'filled' : 'outlined'}
                                    icon={<Icon className="h-4 w-4 lg:h-5 lg:w-5" />}
                                />
                            );
                        })}
                    </div>

                    <div className="relative flex-1 min-w-[140px]">
                        <select value={sortBy} onChange={(e) => onSortChange(e.target.value as SortOption)}
                            className="input-modern cursor-pointer appearance-none py-2.5 pl-3 pr-9 text-sm font-medium lg:text-base"
                        >
                            {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>

                    <button onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors lg:text-base ${showFilters || activeFiltersCount > 0
                            ? 'border border-[rgba(0,87,184,0.2)] bg-[#eef5fe] text-[#0057b8]'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <SlidersHorizontal className="h-4 w-4 lg:h-5 lg:w-5" /><span className="hidden sm:inline">Filtres</span>
                        {activeFiltersCount > 0 && (
                            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#0057b8] px-1.5 text-xs font-semibold text-white">{activeFiltersCount}</span>
                        )}
                    </button>

                    {onAddContact && (
                        <MaterialButton onClick={onAddContact} icon={<Plus className="h-5 w-5" />} className="ml-auto hidden lg:flex">
                            Ajouter un contact
                        </MaterialButton>
                    )}
                </div>
            </div>

            {showFilters && (
                <div className="space-y-5 border-t border-slate-200 pt-5">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-semibold text-slate-900 lg:text-lg">Filtres avancés</h3>
                        {activeFiltersCount > 0 && (
                            <button onClick={clearFilters}
                                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 lg:text-base"
                            >
                                <X className="h-4 w-4" />Réinitialiser
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FilterDropdown label="Événements" options={events.map(e => ({ value: e.id, label: e.name }))} selectedValues={filters.events} onChange={(v) => onFiltersChange({ ...filters, events: v })} placeholder="Sélectionner des événements" />
                        <FilterDropdown label="Tags" options={availableTags.map(t => ({ value: t, label: t }))} selectedValues={filters.tags} onChange={(v) => onFiltersChange({ ...filters, tags: v })} placeholder="Sélectionner des tags" />
                        <FilterDropdown label="Type de relation" options={relationshipOptions} selectedValues={filters.relationships} onChange={(v) => onFiltersChange({ ...filters, relationships: v })} placeholder="Sélectionner des relations" />
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Ville</label>
                            <input type="text" placeholder="Entrer une ville" value={filters.cities[0] || ''} onChange={(e) => onFiltersChange({ ...filters, cities: e.target.value ? [e.target.value] : [] })} className="input-modern" />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Région</label>
                            <input type="text" placeholder="Entrer une région" value={filters.regions[0] || ''} onChange={(e) => onFiltersChange({ ...filters, regions: e.target.value ? [e.target.value] : [] })} className="input-modern" />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Pays</label>
                            <input type="text" placeholder="Entrer un pays" value={filters.countries[0] || ''} onChange={(e) => onFiltersChange({ ...filters, countries: e.target.value ? [e.target.value] : [] })} className="input-modern" />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Montant d&apos;opportunité (min)</label>
                            <input type="number" placeholder="0" value={filters.opportunityMin || ''} onChange={(e) => onFiltersChange({ ...filters, opportunityMin: e.target.value ? parseFloat(e.target.value) : null })} className="input-modern" />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Montant d&apos;opportunité (max)</label>
                            <input type="number" placeholder="∞" value={filters.opportunityMax || ''} onChange={(e) => onFiltersChange({ ...filters, opportunityMax: e.target.value ? parseFloat(e.target.value) : null })} className="input-modern" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
