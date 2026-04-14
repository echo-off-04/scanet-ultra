import { useState, useEffect } from 'react';
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { FilterDropdown } from './FilterDropdown';

type Event = Database['public']['Tables']['events']['Row'];

export type ViewMode = 'grid' | 'list' | 'photos';
export type SortOption = 'name_asc' | 'name_desc' | 'date_asc' | 'date_desc' | 'rating_asc' | 'rating_desc';

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
    opportunityMin: number | null;
    opportunityMax: number | null;
  };
  onFiltersChange: (filters: any) => void;
  availableTags: string[];
}

export function ModernContactsToolbar({
  sortBy,
  onSortChange,
  filters,
  onFiltersChange,
  availableTags,
}: ModernContactsToolbarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const relationshipOptions = [
    { value: 'colleague', label: 'Collègue' },
    { value: 'client', label: 'Client' },
    { value: 'vendor', label: 'Fournisseur' },
    { value: 'partner', label: 'Partenaire' },
    { value: 'friend', label: 'Ami' },
    { value: 'other', label: 'Autre' },
  ];

  const sortOptions = [
    { value: 'date_desc', label: 'Plus récents' },
    { value: 'date_asc', label: 'Plus anciens' },
    { value: 'name_asc', label: 'Nom (A-Z)' },
    { value: 'name_desc', label: 'Nom (Z-A)' },
    { value: 'rating_desc', label: 'Meilleure note' },
    { value: 'rating_asc', label: 'Note la plus basse' },
  ];

  const activeFiltersCount =
    filters.events.length +
    filters.tags.length +
    filters.relationships.length +
    filters.cities.length +
    filters.regions.length +
    filters.countries.length +
    (filters.opportunityMin !== null ? 1 : 0) +
    (filters.opportunityMax !== null ? 1 : 0);

  const clearFilters = () => {
    onFiltersChange({
      events: [],
      tags: [],
      relationships: [],
      cities: [],
      regions: [],
      countries: [],
      opportunityMin: null,
      opportunityMax: null,
    });
  };

  const currentSortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || 'Plus récents';

  return (
    <div className="mb-4">
      {/* Dropdowns de tri et filtres */}
      <div className="flex items-center gap-2">
        {/* Dropdown tri */}
        <div className="relative flex-1">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
          >
            <span>{currentSortLabel}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showSortDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowSortDropdown(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20 max-h-60 overflow-y-auto">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onSortChange(option.value as SortOption);
                      setShowSortDropdown(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors ${
                      sortBy === option.value ? 'text-[#0E3A5D] font-medium bg-blue-50' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bouton Filtres */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="relative px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 whitespace-nowrap"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filtres</span>
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#0E3A5D] text-white text-xs rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Panneau de filtres avancés */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filtres avancés</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FilterDropdown
              label="Événements"
              options={events.map(event => ({ value: event.id, label: event.name }))}
              selectedValues={filters.events}
              onChange={(values) => onFiltersChange({ ...filters, events: values })}
              placeholder="Sélectionner des événements"
            />

            <FilterDropdown
              label="Tags"
              options={availableTags.map(tag => ({ value: tag, label: tag }))}
              selectedValues={filters.tags}
              onChange={(values) => onFiltersChange({ ...filters, tags: values })}
              placeholder="Sélectionner des tags"
            />

            <FilterDropdown
              label="Type de relation"
              options={relationshipOptions}
              selectedValues={filters.relationships}
              onChange={(values) => onFiltersChange({ ...filters, relationships: values })}
              placeholder="Sélectionner des relations"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville
              </label>
              <input
                type="text"
                placeholder="Entrer une ville"
                value={filters.cities[0] || ''}
                onChange={(e) => {
                  onFiltersChange({ ...filters, cities: e.target.value ? [e.target.value] : [] });
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Région
              </label>
              <input
                type="text"
                placeholder="Entrer une région"
                value={filters.regions[0] || ''}
                onChange={(e) => {
                  onFiltersChange({ ...filters, regions: e.target.value ? [e.target.value] : [] });
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pays
              </label>
              <input
                type="text"
                placeholder="Entrer un pays"
                value={filters.countries[0] || ''}
                onChange={(e) => {
                  onFiltersChange({ ...filters, countries: e.target.value ? [e.target.value] : [] });
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant d'opportunité (min)
              </label>
              <input
                type="number"
                placeholder="0"
                value={filters.opportunityMin || ''}
                onChange={(e) => {
                  onFiltersChange({
                    ...filters,
                    opportunityMin: e.target.value ? parseFloat(e.target.value) : null
                  });
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant d'opportunité (max)
              </label>
              <input
                type="number"
                placeholder="∞"
                value={filters.opportunityMax || ''}
                onChange={(e) => {
                  onFiltersChange({
                    ...filters,
                    opportunityMax: e.target.value ? parseFloat(e.target.value) : null
                  });
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Réinitialiser
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="px-6 py-2 bg-[#0E3A5D] text-white rounded-xl hover:bg-blue-800 transition-colors text-sm font-semibold"
            >
              Appliquer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
