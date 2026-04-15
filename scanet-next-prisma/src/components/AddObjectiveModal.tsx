'use client';

import { useState, useEffect } from 'react';
import { X, Target, DollarSign, Users, Trophy, Calendar, UserPlus, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';
import {
    OBJECTIVE_TYPE_CONFIG,
    CONTACT_STATUS_LABELS,
    PERIOD_LABELS,
    getPeriodDates,
    type PersonalObjective,
} from '@/lib/objectiveCalculator';
import { MaterialButton } from './material/MaterialButton';
import { MaterialIconButton } from './material/MaterialIconButton';

interface AddObjectiveModalProps {
    onClose: () => void;
    onSuccess: () => void;
    editObjective?: PersonalObjective | null;
}

const ICONS: Record<string, typeof Target> = { DollarSign, Users, UserPlus, Trophy, Calendar };

function toLocalDateString(date: Date): string {
    return date.toISOString().split('T')[0];
}

export function AddObjectiveModal({ onClose, onSuccess, editObjective }: AddObjectiveModalProps) {
    const { profile } = useAuth();
    const userCurrency = (profile as any)?.preferred_currency || 'EUR';

    const [objectiveType, setObjectiveType] = useState<string>(editObjective?.objectiveType || '');
    const [title, setTitle] = useState(editObjective?.title || '');
    const [description, setDescription] = useState(editObjective?.description || '');
    const [targetValue, setTargetValue] = useState(editObjective?.targetValue?.toString() || '');
    const [currency, setCurrency] = useState(editObjective?.currency || userCurrency);
    const [contactStatusFilter, setContactStatusFilter] = useState(editObjective?.contactStatusFilter || 'lead');
    const [periodType, setPeriodType] = useState(editObjective?.periodType || 'month');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(editObjective?.priority || 'medium');
    const [eventId, setEventId] = useState(editObjective?.eventId || '');
    const [events, setEvents] = useState<Array<{ id: string; name: string }>>([]);
    const [saving, setSaving] = useState(false);

    const getDefaultDates = (pt: string) => {
        if (pt === 'custom') {
            return { start: toLocalDateString(new Date()), end: toLocalDateString(new Date(new Date().setMonth(new Date().getMonth() + 1))) };
        }
        const { start, end } = getPeriodDates(pt);
        return { start: toLocalDateString(start), end: toLocalDateString(end) };
    };

    const initDates = editObjective?.periodStart && editObjective?.periodEnd
        ? { start: new Date(editObjective.periodStart).toISOString().split('T')[0], end: new Date(editObjective.periodEnd).toISOString().split('T')[0] }
        : getDefaultDates(editObjective?.periodType || 'month');

    const [startDate, setStartDate] = useState(initDates.start);
    const [endDate, setEndDate] = useState(initDates.end);

    useEffect(() => {
        if (objectiveType === 'participation_rate') loadEvents();
    }, [objectiveType]);

    useEffect(() => {
        if (periodType !== 'custom') {
            const dates = getDefaultDates(periodType);
            setStartDate(dates.start);
            setEndDate(dates.end);
        }
    }, [periodType]);

    useEffect(() => {
        if (objectiveType && !editObjective) {
            const config = OBJECTIVE_TYPE_CONFIG[objectiveType as keyof typeof OBJECTIVE_TYPE_CONFIG];
            if (config) {
                if (objectiveType === 'contacts_by_status') setTitle(`${CONTACT_STATUS_LABELS[contactStatusFilter]} ${PERIOD_LABELS[periodType] || 'personnalisé'}`);
                else if (objectiveType === 'new_contacts') setTitle(`Nouveaux contacts ${PERIOD_LABELS[periodType] || 'personnalisé'}`);
                else setTitle(config.label);
            }
        }
    }, [objectiveType, contactStatusFilter, periodType, editObjective]);

    const loadEvents = async () => {
        try {
            const res = await fetch('/api/events');
            if (res.ok) {
                const data = await res.json();
                setEvents((data.events || []).map((e: any) => ({ id: e.id, name: e.name })));
            }
        } catch (error) {
            console.error('Error loading events:', error);
        }
    };

    const handleSave = async () => {
        if (!objectiveType || !targetValue || !title) return;
        setSaving(true);
        try {
            const config = OBJECTIVE_TYPE_CONFIG[objectiveType as keyof typeof OBJECTIVE_TYPE_CONFIG];
            const payload = {
                objective_type: objectiveType,
                title,
                description: description || null,
                target_value: parseFloat(targetValue),
                unit: config.unit,
                currency: config.unit === 'currency' ? currency : 'EUR',
                contact_status_filter: objectiveType === 'contacts_by_status' ? contactStatusFilter : null,
                period_type: periodType,
                period_start: new Date(startDate).toISOString(),
                period_end: new Date(endDate + 'T23:59:59').toISOString(),
                event_id: objectiveType === 'participation_rate' && eventId ? eventId : null,
                priority,
                status: 'active',
            };

            const url = editObjective ? `/api/objectives/${editObjective.id}` : '/api/objectives';
            const method = editObjective ? 'PATCH' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error('Failed to save objective');
            onSuccess();
        } catch (error) {
            console.error('Error saving objective:', error);
        } finally {
            setSaving(false);
        }
    };

    const selectedConfig = objectiveType ? OBJECTIVE_TYPE_CONFIG[objectiveType as keyof typeof OBJECTIVE_TYPE_CONFIG] : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-slate-200 bg-white p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50"><Target className="h-5 w-5 text-slate-700" /></div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">{editObjective ? "Modifier l'objectif" : 'Nouvel objectif'}</h2>
                            <p className="text-xs text-slate-500">Définissez un objectif mesurable</p>
                        </div>
                    </div>
                    <MaterialIconButton ariaLabel="Fermer" onClick={onClose} icon={<X className="h-5 w-5 text-slate-400" />} />
                </div>

                <div className="p-5 space-y-5">
                    {!editObjective && (
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Type d&apos;objectif</label>
                            <div className="grid grid-cols-1 gap-2">
                                {Object.entries(OBJECTIVE_TYPE_CONFIG).map(([key, config]) => {
                                    const Icon = ICONS[config.icon] || Target;
                                    const isSelected = objectiveType === key;
                                    return (
                                        <button key={key} onClick={() => setObjectiveType(key)} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${isSelected ? 'border-slate-400 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700"><Icon className="h-4 w-4" /></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-semibold text-slate-900">{config.label}</div>
                                                <div className="truncate text-xs text-slate-500">{config.description}</div>
                                            </div>
                                            <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${isSelected ? 'border-slate-900 bg-slate-900' : 'border-slate-300'}`}>
                                                {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {objectiveType && (
                        <>
                            {objectiveType === 'contacts_by_status' && (
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Statut à suivre</label>
                                    <div className="relative">
                                        <select value={contactStatusFilter} onChange={(e) => setContactStatusFilter(e.target.value)} className="input-modern appearance-none pr-10 text-sm">
                                            {Object.entries(CONTACT_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Titre</label>
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-modern text-sm" placeholder="Ex: Atteindre 50 000 EUR de CA" />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Description (optionnel)</label>
                                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-modern resize-none text-sm" rows={2} placeholder="Décrivez votre objectif..." />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Objectif cible{selectedConfig?.unit === 'percentage' && ' (%)'}{selectedConfig?.unit === 'currency' && ` (${currency})`}</label>
                                    <input type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className="input-modern text-sm" placeholder={selectedConfig?.unit === 'percentage' ? '80' : '100'} min="0" step={selectedConfig?.unit === 'currency' ? '100' : '1'} />
                                </div>
                                {selectedConfig?.unit === 'currency' && (
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">Devise</label>
                                        <div className="relative">
                                            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input-modern appearance-none pr-10 text-sm">
                                                {SUPPORTED_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} - {c.symbol}</option>)}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Période</label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                                        <MaterialButton
                                            key={key}
                                            onClick={() => setPeriodType(key as typeof periodType)}
                                            variant={periodType === key ? 'filled' : 'text'}
                                            className="min-w-0 text-xs"
                                        >
                                            {label.replace('par ', '').replace('au ', '')}
                                        </MaterialButton>
                                    ))}
                                    <MaterialButton onClick={() => setPeriodType('custom')} variant={periodType === 'custom' ? 'filled' : 'text'} className="min-w-0 text-xs">
                                        personnalisé
                                    </MaterialButton>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Date de début</label>
                                    <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPeriodType('custom'); }} className="input-modern text-sm" />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Date de fin</label>
                                    <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPeriodType('custom'); }} className="input-modern text-sm" />
                                </div>
                            </div>

                            {objectiveType === 'participation_rate' && (
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Événement spécifique (optionnel)</label>
                                    <div className="relative">
                                        <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="input-modern appearance-none pr-10 text-sm">
                                            <option value="">Tous les événements</option>
                                            {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Priorité</label>
                                <div className="flex gap-2">
                                    {[
                                        { value: 'low', label: 'Basse', color: 'bg-slate-100 text-slate-600' },
                                        { value: 'medium', label: 'Moyenne', color: 'bg-slate-100 text-slate-600' },
                                        { value: 'high', label: 'Haute', color: 'bg-slate-100 text-slate-600' },
                                    ].map((p) => (
                                        <MaterialButton
                                            key={p.value}
                                            onClick={() => setPriority(p.value as 'low' | 'medium' | 'high')}
                                            variant={priority === p.value ? 'filled' : 'text'}
                                            className="flex-1 justify-center text-xs"
                                        >
                                            {p.label}
                                        </MaterialButton>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="sticky bottom-0 flex gap-3 rounded-b-2xl border-t border-slate-200 bg-white p-5">
                    <MaterialButton onClick={onClose} variant="outlined" className="flex-1 justify-center text-sm">Annuler</MaterialButton>
                    <MaterialButton onClick={handleSave} disabled={!objectiveType || !targetValue || !title || saving} className="flex-1 justify-center text-sm">
                        {saving ? 'Enregistrement...' : editObjective ? 'Modifier' : "Créer l'objectif"}
                    </MaterialButton>
                </div>
            </div>
        </div>
    );
}
