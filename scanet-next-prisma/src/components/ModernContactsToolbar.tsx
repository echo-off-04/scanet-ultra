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
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-all"
                >
                    <ArrowUpDown className="w-4 h-4" />
                    <span className="hidden sm:inline">{sortOptions.find(s => s.value === sortBy)?.label}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {showSortDropdown && (
                    <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1 min-w-[160px]">
                        {sortOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => { onSortChange(opt.value); setShowSortDropdown(false); }}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${sortBy === opt.value ? 'bg-[#0E3A5D]/10 text-[#0E3A5D] font-medium' : 'text-gray-700 hover:bg-gray-50'
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
                    ? 'bg-[#0E3A5D] text-white border-[#0E3A5D]'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
            >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filtres</span>
                {activeFilterCount > 0 && (
                    <span className="w-5 h-5 bg-white text-[#0E3A5D] rounded-full text-xs flex items-center justify-center font-bold">
                        {activeFilterCount}
                    </span>
                )}
            </button>

            {showFilters && (
                <div className="w-full mt-2 p-4 bg-white border border-gray-200 rounded-xl shadow-lg space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">Filtres avancés</h4>
                        <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
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
