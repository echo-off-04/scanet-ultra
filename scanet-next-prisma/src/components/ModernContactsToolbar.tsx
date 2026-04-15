'use client';

import { useState, useEffect } from 'react';
import { SlidersHorizontal, ArrowUpDown, ChevronDown, X } from 'lucide-react';
import { FilterDropdown } from './FilterDropdown';

type SortOption = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'rating_desc' | 'rating_asc';

interface ModernContactsToolbarProps {
    sortBy: SortOption;
    onSortChange: (sort: SortOption) => void;
    filters: {
        events: string[];
        tags: string[];
        relationships: string[];
        cities: string[];
        regions: string[];
        countries: string[];
        opportunityMin?: number;
        opportunityMax?: number;
    };
    onFiltersChange: (filters: any) => void;
    availableTags: string[];
}

export function ModernContactsToolbar({ sortBy, onSortChange, filters, onFiltersChange, availableTags }: ModernContactsToolbarProps) {
    const [showFilters, setShowFilters] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [events, setEvents] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const res = await fetch('/api/events');
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
            }
        } catch (error) {
            console.error('Error loading events:', error);
        }
    };

    const sortOptions: { value: SortOption; label: string }[] = [
        { value: 'date_desc', label: 'Plus récent' },
        { value: 'date_asc', label: 'Plus ancien' },
        { value: 'name_asc', label: 'Nom (A-Z)' },
        { value: 'name_desc', label: 'Nom (Z-A)' },
        { value: 'rating_desc', label: 'Note (haute)' },
        { value: 'rating_asc', label: 'Note (basse)' },
    ];

    const activeFilterCount = Object.entries(filters).reduce((count, [key, value]) => {
        if (Array.isArray(value) && value.length > 0) return count + 1;
        if (typeof value === 'number' && value > 0) return count + 1;
        return count;
    }, 0);

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
                <button
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                >
                    <ArrowUpDown className="h-4 w-4" />
                    <span className="hidden sm:inline">{sortOptions.find(s => s.value === sortBy)?.label}</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                </button>

                {showSortDropdown && (
                    <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-xl border border-slate-200 bg-white py-1 shadow-sm">
                        {sortOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => { onSortChange(opt.value); setShowSortDropdown(false); }}
                                className={`w-full px-4 py-2 text-left text-sm transition-colors ${sortBy === opt.value ? 'bg-slate-100 font-medium text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-sm transition-all ${activeFilterCount > 0
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
            >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Filtres</span>
                {activeFilterCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-900">
                        {activeFilterCount}
                    </span>
                )}
            </button>

            {showFilters && (
                <div className="mt-2 w-full space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-slate-900">Filtres avancés</h4>
                        <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <FilterDropdown
                        label="Événements"
                        options={events.map(e => ({ value: e.id, label: e.name }))}
                        selectedValues={filters.events}
                        onChange={(values) => onFiltersChange({ ...filters, events: values })}
                    />

                    <FilterDropdown
                        label="Tags"
                        options={availableTags.map(t => ({ value: t, label: t }))}
                        selectedValues={filters.tags}
                        onChange={(values) => onFiltersChange({ ...filters, tags: values })}
                    />

                    <FilterDropdown
                        label="Relation"
                        options={[
                            { value: 'colleague', label: 'Collègue' },
                            { value: 'friend', label: 'Ami' },
                            { value: 'business', label: 'Business' },
                            { value: 'other', label: 'Autre' },
                        ]}
                        selectedValues={filters.relationships}
                        onChange={(values) => onFiltersChange({ ...filters, relationships: values })}
                    />

                    {activeFilterCount > 0 && (
                        <button
                            onClick={() => onFiltersChange({ events: [], tags: [], relationships: [], cities: [], regions: [], countries: [] })}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                            Réinitialiser les filtres
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
