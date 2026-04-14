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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-center justify-between rounded-t-2xl z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Target className="w-5 h-5 text-blue-600" /></div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{editObjective ? "Modifier l'objectif" : 'Nouvel objectif'}</h2>
                            <p className="text-xs text-gray-500">Définissez un objectif mesurable</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
                </div>

                <div className="p-5 space-y-5">
                    {!editObjective && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Type d&apos;objectif</label>
                            <div className="grid grid-cols-1 gap-2">
                                {Object.entries(OBJECTIVE_TYPE_CONFIG).map(([key, config]) => {
                                    const Icon = ICONS[config.icon] || Target;
                                    const isSelected = objectiveType === key;
                                    return (
                                        <button key={key} onClick={() => setObjectiveType(key)} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                                            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${config.color}15` }}><Icon className="w-4 h-4" style={{ color: config.color }} /></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-sm text-gray-900">{config.label}</div>
                                                <div className="text-xs text-gray-500 truncate">{config.description}</div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
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
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Statut à suivre</label>
                                    <div className="relative">
                                        <select value={contactStatusFilter} onChange={(e) => setContactStatusFilter(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                                            {Object.entries(CONTACT_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Titre</label>
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" placeholder="Ex: Atteindre 50 000 EUR de CA" />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description (optionnel)</label>
                                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none" rows={2} placeholder="Décrivez votre objectif..." />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Objectif cible{selectedConfig?.unit === 'percentage' && ' (%)'}{selectedConfig?.unit === 'currency' && ` (${currency})`}</label>
                                    <input type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" placeholder={selectedConfig?.unit === 'percentage' ? '80' : '100'} min="0" step={selectedConfig?.unit === 'currency' ? '100' : '1'} />
                                </div>
                                {selectedConfig?.unit === 'currency' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Devise</label>
                                        <div className="relative">
                                            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                                                {SUPPORTED_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} - {c.symbol}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Période</label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                                        <button key={key} onClick={() => setPeriodType(key as typeof periodType)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${periodType === key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{label.replace('par ', '').replace('au ', '')}</button>
                                    ))}
                                    <button onClick={() => setPeriodType('custom')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${periodType === 'custom' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>personnalisé</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date de début</label>
                                    <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPeriodType('custom'); }} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date de fin</label>
                                    <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPeriodType('custom'); }} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                                </div>
                            </div>

                            {objectiveType === 'participation_rate' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Événement spécifique (optionnel)</label>
                                    <div className="relative">
                                        <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                                            <option value="">Tous les événements</option>
                                            {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Priorité</label>
                                <div className="flex gap-2">
                                    {[
                                        { value: 'low', label: 'Basse', color: 'bg-gray-100 text-gray-600' },
                                        { value: 'medium', label: 'Moyenne', color: 'bg-amber-100 text-amber-700' },
                                        { value: 'high', label: 'Haute', color: 'bg-red-100 text-red-700' },
                                    ].map((p) => (
                                        <button key={p.value} onClick={() => setPriority(p.value as 'low' | 'medium' | 'high')} className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${priority === p.value ? (p.value === 'low' ? 'bg-gray-800 text-white' : p.value === 'medium' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white') : p.color}`}>{p.label}</button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="sticky bottom-0 bg-white border-t border-gray-100 p-5 flex gap-3 rounded-b-2xl">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">Annuler</button>
                    <button onClick={handleSave} disabled={!objectiveType || !targetValue || !title || saving} className="flex-1 px-4 py-2.5 bg-[#0E3A5D] text-white rounded-xl text-sm font-semibold hover:bg-[#1e5a8e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {saving ? 'Enregistrement...' : editObjective ? 'Modifier' : "Créer l'objectif"}
                    </button>
                </div>
            </div>
        </div>
    );
}
