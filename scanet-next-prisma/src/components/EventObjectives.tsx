'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, Edit2, Trash2, Users, DollarSign, Award, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MaterialButton } from './material/MaterialButton';
import { MaterialIconButton } from './material/MaterialIconButton';

interface Objective {
    id: string;
    event_id: string;
    user_id: string;
    objective_type: 'primary' | 'secondary';
    metric_type: 'people_count' | 'opportunity_value' | 'quality_score';
    title: string;
    description: string | null;
    target_value: number;
    current_value: number;
    unit: string | null;
    achieved: boolean;
    priority: number;
}

interface EventObjectivesProps {
    eventId: string;
}

export function EventObjectives({ eventId }: EventObjectivesProps) {
    const { user } = useAuth();
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        objective_type: 'primary' as 'primary' | 'secondary',
        metric_type: 'people_count' as 'people_count' | 'opportunity_value' | 'quality_score',
        target_value: 10,
        current_value: 0,
        unit: '',
    });

    useEffect(() => {
        loadObjectives();
    }, [eventId]);

    const loadObjectives = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/events/${eventId}/objectives`);
            if (res.ok) {
                const data = await res.json();
                setObjectives(data);
            }
        } catch (error) {
            console.error('Error loading objectives:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!user || !formData.title.trim()) return;

        try {
            if (editingId) {
                const res = await fetch(`/api/events/${eventId}/objectives/${editingId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });
                if (!res.ok) throw new Error('Erreur');
                toast.success('Objectif modifié');
            } else {
                const res = await fetch(`/api/events/${eventId}/objectives`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...formData,
                        priority: objectives.length + 1,
                    }),
                });
                if (!res.ok) throw new Error('Erreur');
                toast.success('Objectif créé');
            }

            resetForm();
            loadObjectives();
        } catch (error) {
            console.error('Error saving objective:', error);
            toast.error('Erreur lors de la sauvegarde');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer cet objectif ?')) return;
        try {
            const res = await fetch(`/api/events/${eventId}/objectives/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Erreur');
            toast.success('Objectif supprimé');
            loadObjectives();
        } catch (error) {
            console.error('Error deleting objective:', error);
            toast.error('Erreur lors de la suppression');
        }
    };

    const startEdit = (obj: Objective) => {
        setEditingId(obj.id);
        setFormData({
            title: obj.title,
            description: obj.description || '',
            objective_type: obj.objective_type,
            metric_type: obj.metric_type,
            target_value: obj.target_value,
            current_value: obj.current_value,
            unit: obj.unit || '',
        });
        setShowAddModal(true);
    };

    const resetForm = () => {
        setShowAddModal(false);
        setEditingId(null);
        setFormData({ title: '', description: '', objective_type: 'primary', metric_type: 'people_count', target_value: 10, current_value: 0, unit: '' });
    };

    const getMetricIcon = (type: string) => {
        switch (type) {
            case 'people_count': return Users;
            case 'opportunity_value': return DollarSign;
            case 'quality_score': return Award;
            default: return Target;
        }
    };

    if (loading) {
        return <div className="flex h-32 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"></div></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                    <Target className="h-5 w-5 text-slate-700" />
                    Objectifs ({objectives.length})
                </h3>
                <MaterialButton onClick={() => { resetForm(); setShowAddModal(true); }} icon={<Plus className="h-4 w-4" />} className="text-sm">
                    Ajouter
                </MaterialButton>
            </div>

            {objectives.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 py-8 text-center">
                    <Target className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                    <p className="text-slate-500">Aucun objectif défini</p>
                    <MaterialButton onClick={() => setShowAddModal(true)} variant="text" className="mt-3">Définir un objectif</MaterialButton>
                </div>
            ) : (
                <div className="space-y-3">
                    {objectives.map((obj) => {
                        const progress = obj.target_value > 0 ? Math.min(100, (obj.current_value / obj.target_value) * 100) : 0;
                        const MetricIcon = getMetricIcon(obj.metric_type);
                        return (
                            <div key={obj.id} className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                                            <MetricIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900">{obj.title}</h4>
                                            {obj.description && <p className="mt-0.5 text-xs text-slate-500">{obj.description}</p>}
                                            <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                                                {obj.objective_type === 'primary' ? 'Principal' : 'Secondaire'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MaterialIconButton ariaLabel="Modifier l'objectif" onClick={() => startEdit(obj)} icon={<Edit2 className="h-4 w-4" />} className="h-8 w-8" />
                                        <MaterialIconButton ariaLabel="Supprimer l'objectif" onClick={() => handleDelete(obj.id)} variant="outlined" icon={<Trash2 className="h-4 w-4 text-red-600" />} className="h-8 w-8" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-600">{obj.current_value} / {obj.target_value} {obj.unit || ''}</span>
                                        <span className="font-semibold text-slate-900">{Math.round(progress)}%</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                                        <div
                                            className="h-full rounded-full bg-slate-700 transition-all"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={resetForm}>
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-slate-900">{editingId ? 'Modifier l\'objectif' : 'Nouvel objectif'}</h3>
                            <MaterialIconButton ariaLabel="Fermer" onClick={resetForm} icon={<X className="h-5 w-5" />} className="h-8 w-8" />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Titre *</label>
                                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="input-modern" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
                                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="input-modern resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
                                    <select value={formData.objective_type} onChange={(e) => setFormData({ ...formData, objective_type: e.target.value as any })} className="input-modern">
                                        <option value="primary">Principal</option>
                                        <option value="secondary">Secondaire</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Métrique</label>
                                    <select value={formData.metric_type} onChange={(e) => setFormData({ ...formData, metric_type: e.target.value as any })} className="input-modern">
                                        <option value="people_count">Nombre de personnes</option>
                                        <option value="opportunity_value">Valeur opportunité</option>
                                        <option value="quality_score">Score qualité</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Valeur cible</label>
                                    <input type="number" value={formData.target_value} onChange={(e) => setFormData({ ...formData, target_value: Number(e.target.value) })} className="input-modern" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Valeur actuelle</label>
                                    <input type="number" value={formData.current_value} onChange={(e) => setFormData({ ...formData, current_value: Number(e.target.value) })} className="input-modern" />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Unité</label>
                                <input type="text" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="input-modern" placeholder="ex: contacts, €, %" />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <MaterialButton onClick={resetForm} variant="outlined" className="flex-1 justify-center">Annuler</MaterialButton>
                            <MaterialButton onClick={handleSubmit} disabled={!formData.title.trim()} className="flex-1 justify-center">
                                {editingId ? 'Modifier' : 'Créer'}
                            </MaterialButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
