'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, Edit2, Trash2, Users, DollarSign, Award, ChevronUp, ChevronDown, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
        return <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0E3A5D]"></div></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#0E3A5D]" />
                    Objectifs ({objectives.length})
                </h3>
                <button
                    onClick={() => { resetForm(); setShowAddModal(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#0E3A5D] text-white rounded-lg hover:bg-[#1E5A8E]"
                >
                    <Plus className="w-4 h-4" />
                    Ajouter
                </button>
            </div>

            {objectives.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <Target className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aucun objectif défini</p>
                    <button onClick={() => setShowAddModal(true)} className="mt-3 text-sm text-[#0E3A5D] font-medium hover:underline">
                        Définir un objectif
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {objectives.map((obj) => {
                        const progress = obj.target_value > 0 ? Math.min(100, (obj.current_value / obj.target_value) * 100) : 0;
                        const MetricIcon = getMetricIcon(obj.metric_type);
                        return (
                            <div key={obj.id} className={`p-4 rounded-xl border ${obj.achieved ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'}`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${obj.achieved ? 'bg-emerald-100' : 'bg-blue-100'}`}>
                                            <MetricIcon className={`w-5 h-5 ${obj.achieved ? 'text-emerald-600' : 'text-blue-600'}`} />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{obj.title}</h4>
                                            {obj.description && <p className="text-xs text-gray-500 mt-0.5">{obj.description}</p>}
                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${obj.objective_type === 'primary' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {obj.objective_type === 'primary' ? 'Principal' : 'Secondaire'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => startEdit(obj)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                                            <Edit2 className="w-4 h-4 text-gray-400" />
                                        </button>
                                        <button onClick={() => handleDelete(obj.id)} className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center">
                                            <Trash2 className="w-4 h-4 text-red-400" />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">{obj.current_value} / {obj.target_value} {obj.unit || ''}</span>
                                        <span className={`font-semibold ${obj.achieved ? 'text-emerald-600' : 'text-gray-900'}`}>{Math.round(progress)}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${obj.achieved ? 'bg-emerald-500' : progress >= 75 ? 'bg-blue-500' : progress >= 50 ? 'bg-amber-500' : 'bg-gray-400'}`}
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={resetForm}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">{editingId ? 'Modifier l\'objectif' : 'Nouvel objectif'}</h3>
                            <button onClick={resetForm} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E3A5D]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E3A5D] resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select value={formData.objective_type} onChange={(e) => setFormData({ ...formData, objective_type: e.target.value as any })} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl">
                                        <option value="primary">Principal</option>
                                        <option value="secondary">Secondaire</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Métrique</label>
                                    <select value={formData.metric_type} onChange={(e) => setFormData({ ...formData, metric_type: e.target.value as any })} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl">
                                        <option value="people_count">Nombre de personnes</option>
                                        <option value="opportunity_value">Valeur opportunité</option>
                                        <option value="quality_score">Score qualité</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Valeur cible</label>
                                    <input type="number" value={formData.target_value} onChange={(e) => setFormData({ ...formData, target_value: Number(e.target.value) })} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Valeur actuelle</label>
                                    <input type="number" value={formData.current_value} onChange={(e) => setFormData({ ...formData, current_value: Number(e.target.value) })} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
                                <input type="text" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl" placeholder="ex: contacts, €, %" />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={resetForm} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50">Annuler</button>
                            <button onClick={handleSubmit} disabled={!formData.title.trim()} className="flex-1 px-4 py-2.5 bg-[#0E3A5D] text-white rounded-xl hover:bg-[#1E5A8E] disabled:opacity-50">
                                {editingId ? 'Modifier' : 'Créer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
