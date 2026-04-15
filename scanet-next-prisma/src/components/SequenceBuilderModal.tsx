'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, GripVertical, Mail, MessageSquare, Clock, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { EmailSequence } from '@/types';

interface StepDraft {
    id?: string;
    step_order: number;
    delay_days: number;
    delay_hours: number;
    subject: string;
    body: string;
    channel: 'email' | 'whatsapp';
    include_offer_id: string | null;
}

interface SequenceBuilderModalProps {
    onClose: () => void;
    onSuccess: () => void;
    editSequence?: EmailSequence | null;
}

const TEMPLATE_VARS = [
    { var: '{{full_name}}', label: 'Nom complet' },
    { var: '{{first_name}}', label: 'Prénom' },
    { var: '{{company}}', label: 'Entreprise' },
    { var: '{{job_title}}', label: 'Poste' },
    { var: '{{email}}', label: 'Email' },
    { var: '{{sender_name}}', label: 'Votre nom' },
    { var: '{{sender_company}}', label: 'Votre entreprise' },
];

export default function SequenceBuilderModal({ onClose, onSuccess, editSequence }: SequenceBuilderModalProps) {
    const { user } = useAuth();
    const [name, setName] = useState(editSequence?.name || '');
    const [description, setDescription] = useState(editSequence?.description || '');
    const [triggerStatus, setTriggerStatus] = useState(editSequence?.trigger_status || 'lead');
    const [sourceFilter, setSourceFilter] = useState(editSequence?.source_filter || '');
    const [excludeStatuses, setExcludeStatuses] = useState<string[]>(
        (editSequence?.exclude_statuses || []).filter((status) => status !== (editSequence?.trigger_status || 'lead')),
    );
    const [steps, setSteps] = useState<StepDraft[]>([
        { step_order: 1, delay_days: 1, delay_hours: 0, subject: '', body: '', channel: 'email', include_offer_id: null },
    ]);
    const [offers, setOffers] = useState<{ id: string; title: string; price: number; currency: string }[]>([]);
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadOffers();
        if (editSequence?.steps) {
            setSteps(editSequence.steps.map(s => ({
                id: s.id,
                step_order: s.step_order,
                delay_days: s.delay_days,
                delay_hours: s.delay_hours,
                subject: s.subject,
                body: s.body,
                channel: s.channel,
                include_offer_id: s.include_offer_id,
            })));
        }
    }, [editSequence]);

    useEffect(() => {
        setExcludeStatuses((current) => current.filter((status) => status !== triggerStatus));
    }, [triggerStatus]);

    const loadOffers = async () => {
        try {
            const res = await fetch('/api/offers?status=active');
            if (res.ok) {
                const data = await res.json();
                setOffers(data);
            }
        } catch (error) {
            console.error('Error loading offers:', error);
        }
    };

    const addStep = () => {
        setSteps([...steps, {
            step_order: steps.length + 1,
            delay_days: 3,
            delay_hours: 0,
            subject: '',
            body: '',
            channel: 'email',
            include_offer_id: null,
        }]);
        setActiveStepIndex(steps.length);
    };

    const removeStep = (index: number) => {
        if (steps.length <= 1) return;
        const newSteps = steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, step_order: i + 1 }));
        setSteps(newSteps);
        setActiveStepIndex(Math.min(activeStepIndex, newSteps.length - 1));
    };

    const updateStep = (index: number, updates: Partial<StepDraft>) => {
        setSteps(steps.map((s, i) => i === index ? { ...s, ...updates } : s));
    };

    const toggleExcludeStatus = (status: string) => {
        setExcludeStatuses((current) =>
            current.includes(status)
                ? current.filter((value) => value !== status)
                : [...current, status],
        );
    };

    const handleSave = async () => {
        if (!name.trim()) { toast.error('Nom requis'); return; }
        if (steps.some(s => !s.subject.trim() || !s.body.trim())) { toast.error('Tous les emails doivent avoir un objet et un contenu'); return; }

        setSaving(true);
        try {
            const payload = {
                name,
                description,
                trigger_status: triggerStatus,
                source_filter: sourceFilter || null,
                exclude_statuses: excludeStatuses,
                status: editSequence?.status === 'archived' ? 'archived' : 'active',
                steps: steps.map(s => ({
                    step_order: s.step_order,
                    delay_days: s.delay_days,
                    delay_hours: s.delay_hours,
                    subject: s.subject,
                    body: s.body,
                    channel: s.channel,
                    include_offer_id: s.include_offer_id,
                })),
            };

            const url = editSequence ? `/api/email/sequences/${editSequence.id}` : '/api/email/sequences';
            const method = editSequence ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Erreur');
            toast.success(editSequence ? 'Séquence modifiée' : 'Séquence créée');
            onSuccess();
        } catch (error) {
            console.error('Error saving sequence:', error);
            toast.error('Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    const getCumulativeDelay = (index: number) => {
        const totals = steps.slice(0, index + 1).reduce((acc, step) => {
            acc.days += step.delay_days;
            acc.hours += step.delay_hours;
            acc.days += Math.floor(acc.hours / 24);
            acc.hours = acc.hours % 24;
            return acc;
        }, { days: 0, hours: 0 });

        if (totals.days === 0 && totals.hours === 0) {
            return 'Immédiat';
        }

        return `${totals.days > 0 ? `J+${totals.days}` : ''}${totals.hours > 0 ? `${totals.days > 0 ? ' ' : ''}+${totals.hours}h` : ''}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-slate-200 bg-white px-6 py-4">
                    <h2 className="text-2xl font-semibold text-slate-900">{editSequence ? 'Modifier la séquence' : 'Nouvelle séquence'}</h2>
                    <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Nom de la séquence *</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-modern" placeholder="Ex: Suivi après événement" />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Déclencheur</label>
                            <select value={triggerStatus} onChange={(e) => setTriggerStatus(e.target.value)} className="input-modern">
                                <option value="lead">Nouveau lead</option>
                                <option value="prospect">Nouveau prospect</option>
                                <option value="client">Nouveau client</option>
                                <option value="partner">Nouveau partenaire</option>
                                <option value="collaborateur">Nouveau collaborateur</option>
                                <option value="ami">Nouveau contact ami</option>
                                <option value="fournisseur">Nouveau fournisseur</option>
                                <option value="all">Tout nouveau contact</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Description</label>
                        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="input-modern" placeholder="Courte description..." />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Source du contact</label>
                            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="input-modern">
                                <option value="">Toutes les sources</option>
                                <option value="event">Événement</option>
                                <option value="referral">Recommandation</option>
                                <option value="cold_outreach">Prospection</option>
                                <option value="team">Équipe</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Exclure ces statuts</label>
                            <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 p-3">
                                {['lead', 'prospect', 'client', 'partner', 'collaborateur', 'ami', 'fournisseur']
                                    .filter((status) => status !== triggerStatus)
                                    .map((status) => (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => toggleExcludeStatus(status)}
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${excludeStatuses.includes(status)
                                                ? 'bg-slate-900 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                            </div>
                        </div>
                    </div>

                    {/* Template Variables */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <h4 className="mb-2 text-sm font-semibold text-slate-900">Variables disponibles</h4>
                        <div className="flex flex-wrap gap-2">
                            {TEMPLATE_VARS.map(v => (
                                <span key={v.var} className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-xs text-slate-700 hover:bg-slate-100" title={v.label}>
                                    {v.var}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Steps */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-900">Étapes ({steps.length})</h3>
                            <button onClick={addStep} className="btn-primary px-3 py-1.5 text-sm">
                                <Plus className="h-4 w-4" />Ajouter une étape
                            </button>
                        </div>

                        <div className="space-y-3">
                            {steps.map((step, index) => (
                                <div key={index} className={`overflow-hidden rounded-xl border ${activeStepIndex === index ? 'border-slate-400 shadow-sm' : 'border-slate-200'}`}>
                                    <button onClick={() => setActiveStepIndex(activeStepIndex === index ? -1 : index)}
                                        className="flex w-full items-center gap-3 bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100">
                                        <GripVertical className="h-4 w-4 text-slate-400" />
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">{index + 1}</div>
                                        <div className="flex-1 text-left">
                                            <p className="text-sm font-medium text-slate-900">{step.subject || `Étape ${index + 1}`}</p>
                                            <p className="text-xs text-slate-500">
                                                <Clock className="mr-1 inline h-3 w-3" />
                                                {getCumulativeDelay(index)} ({step.delay_days}j / {step.delay_hours}h après étape précédente)
                                            </p>
                                        </div>
                                        <Mail className="h-4 w-4 text-slate-400" />
                                        {activeStepIndex === index ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </button>

                                    {activeStepIndex === index && (
                                        <div className="space-y-4 border-t border-slate-200 p-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-slate-700">Délai (jours)</label>
                                                    <input type="number" min={0} value={step.delay_days} onChange={(e) => updateStep(index, { delay_days: Number(e.target.value) })}
                                                        className="input-modern py-2" />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-slate-700">Délai (heures)</label>
                                                    <input type="number" min={0} value={step.delay_hours} onChange={(e) => updateStep(index, { delay_hours: Number(e.target.value) })}
                                                        className="input-modern py-2" />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-slate-700">Offre jointe</label>
                                                    <select value={step.include_offer_id || ''} onChange={(e) => updateStep(index, { include_offer_id: e.target.value || null })}
                                                        className="input-modern py-2">
                                                        <option value="">Aucune</option>
                                                        {offers.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-slate-700">Objet *</label>
                                                <input type="text" value={step.subject} onChange={(e) => updateStep(index, { subject: e.target.value })}
                                                    className="input-modern py-2" placeholder="Objet de l'email" />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-slate-700">Contenu *</label>
                                                <textarea value={step.body} onChange={(e) => updateStep(index, { body: e.target.value })}
                                                    rows={5} className="input-modern resize-none py-2" placeholder="Contenu de l'email..." />
                                            </div>
                                            {steps.length > 1 && (
                                                <button onClick={() => removeStep(index)} className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700">
                                                    <Trash2 className="h-4 w-4" />Supprimer cette étape
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 flex justify-end gap-3 rounded-b-2xl border-t border-slate-200 bg-slate-50 px-6 py-4">
                    <button onClick={onClose} className="btn-secondary">Annuler</button>
                    <button onClick={handleSave} disabled={saving || !name.trim()}
                        className="btn-primary disabled:opacity-50">
                        {saving ? 'Enregistrement...' : editSequence ? 'Modifier' : 'Créer la séquence'}
                    </button>
                </div>
            </div>
        </div>
    );
}
