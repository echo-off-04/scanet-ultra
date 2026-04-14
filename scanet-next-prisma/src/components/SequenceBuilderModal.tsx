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
    const [triggerStatus, setTriggerStatus] = useState('lead');
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
                delay_hours: 0,
                subject: s.subject,
                body: s.body,
                channel: 'email' as const,
                include_offer_id: null,
            })));
        }
    }, [editSequence]);

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

    const handleSave = async () => {
        if (!name.trim()) { toast.error('Nom requis'); return; }
        if (steps.some(s => !s.subject.trim() || !s.body.trim())) { toast.error('Tous les emails doivent avoir un objet et un contenu'); return; }

        setSaving(true);
        try {
            const payload = {
                name,
                description,
                trigger_status: triggerStatus,
                steps: steps.map(s => ({
                    step_order: s.step_order,
                    delay_days: s.delay_days,
                    subject: s.subject,
                    body: s.body,
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
        return steps.slice(0, index + 1).reduce((sum, s) => sum + s.delay_days, 0);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
                    <h2 className="text-2xl font-bold text-gray-900">{editSequence ? 'Modifier la séquence' : 'Nouvelle séquence'}</h2>
                    <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom de la séquence *</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E3A5D]" placeholder="Ex: Suivi après événement" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Déclencheur</label>
                            <select value={triggerStatus} onChange={(e) => setTriggerStatus(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E3A5D]">
                                <option value="lead">Nouveau lead</option>
                                <option value="prospect">Nouveau prospect</option>
                                <option value="client">Nouveau client</option>
                                <option value="all">Tout nouveau contact</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E3A5D]" placeholder="Courte description..." />
                    </div>

                    {/* Template Variables */}
                    <div className="bg-blue-50 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">Variables disponibles</h4>
                        <div className="flex flex-wrap gap-2">
                            {TEMPLATE_VARS.map(v => (
                                <span key={v.var} className="px-2 py-1 bg-white rounded-lg text-xs font-mono text-blue-700 border border-blue-200 cursor-pointer hover:bg-blue-100" title={v.label}>
                                    {v.var}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Steps */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Étapes ({steps.length})</h3>
                            <button onClick={addStep} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#0E3A5D] text-white rounded-lg hover:bg-[#1E5A8E]">
                                <Plus className="w-4 h-4" />Ajouter une étape
                            </button>
                        </div>

                        <div className="space-y-3">
                            {steps.map((step, index) => (
                                <div key={index} className={`border rounded-xl overflow-hidden ${activeStepIndex === index ? 'border-[#0E3A5D] shadow-md' : 'border-gray-200'}`}>
                                    <button onClick={() => setActiveStepIndex(activeStepIndex === index ? -1 : index)}
                                        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <GripVertical className="w-4 h-4 text-gray-400" />
                                        <div className="w-8 h-8 rounded-full bg-[#0E3A5D] text-white flex items-center justify-center text-sm font-bold">{index + 1}</div>
                                        <div className="flex-1 text-left">
                                            <p className="text-sm font-medium text-gray-900">{step.subject || `Étape ${index + 1}`}</p>
                                            <p className="text-xs text-gray-500">
                                                <Clock className="w-3 h-3 inline mr-1" />
                                                J+{getCumulativeDelay(index)} ({step.delay_days}j après étape précédente)
                                            </p>
                                        </div>
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        {activeStepIndex === index ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>

                                    {activeStepIndex === index && (
                                        <div className="p-4 space-y-4 border-t border-gray-200">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Délai (jours)</label>
                                                    <input type="number" min={0} value={step.delay_days} onChange={(e) => updateStep(index, { delay_days: Number(e.target.value) })}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Offre jointe</label>
                                                    <select value={step.include_offer_id || ''} onChange={(e) => updateStep(index, { include_offer_id: e.target.value || null })}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl">
                                                        <option value="">Aucune</option>
                                                        {offers.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Objet *</label>
                                                <input type="text" value={step.subject} onChange={(e) => updateStep(index, { subject: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl" placeholder="Objet de l'email" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Contenu *</label>
                                                <textarea value={step.body} onChange={(e) => updateStep(index, { body: e.target.value })}
                                                    rows={5} className="w-full px-4 py-2 border border-gray-300 rounded-xl resize-none" placeholder="Contenu de l'email..." />
                                            </div>
                                            {steps.length > 1 && (
                                                <button onClick={() => removeStep(index)} className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700">
                                                    <Trash2 className="w-4 h-4" />Supprimer cette étape
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t rounded-b-3xl">
                    <button onClick={onClose} className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100">Annuler</button>
                    <button onClick={handleSave} disabled={saving || !name.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-[#0E3A5D] to-[#1E5A8E] text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50">
                        {saving ? 'Enregistrement...' : editSequence ? 'Modifier' : 'Créer la séquence'}
                    </button>
                </div>
            </div>
        </div>
    );
}
