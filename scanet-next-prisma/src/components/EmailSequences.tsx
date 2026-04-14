'use client';

import { useState, useEffect } from 'react';
import { Workflow, Plus, Play, Pause, Trash2, ChevronDown, ChevronUp, MoreVertical, X, Users, Mail, Clock, Hash } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { EmailSequence } from '@/types';

interface EmailSequencesProps {
    onCreateNew: () => void;
    onEdit: (sequence: EmailSequence) => void;
}

interface EnrollmentDetail {
    id: string;
    contact: { full_name: string; email: string } | null;
    status: string;
    current_step: number;
    enrolled_at: string;
}

export default function EmailSequences({ onCreateNew, onEdit }: EmailSequencesProps) {
    const { user } = useAuth();
    const [sequences, setSequences] = useState<(EmailSequence & { enrollments_count?: number; active_enrollments?: number })[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [enrollments, setEnrollments] = useState<Record<string, EnrollmentDetail[]>>({});
    const [loadingEnrollments, setLoadingEnrollments] = useState<string | null>(null);

    useEffect(() => {
        if (user) loadSequences();
    }, [user]);

    const loadSequences = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/email/sequences');
            if (res.ok) {
                const data = await res.json();
                setSequences(data);
            }
        } catch (error) {
            console.error('Error loading sequences:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleActive = async (seq: EmailSequence & { enrollments_count?: number }) => {
        try {
            const newStatus = seq.status === 'active' ? 'paused' : 'active';
            const res = await fetch(`/api/email/sequences/${seq.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error('Erreur');
            toast.success(newStatus === 'active' ? 'Séquence activée' : 'Séquence mise en pause');
            loadSequences();
        } catch (error) {
            console.error('Error:', error);
            toast.error('Erreur lors de la mise à jour');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer cette séquence ?')) return;
        try {
            const res = await fetch(`/api/email/sequences/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Erreur');
            toast.success('Séquence supprimée');
            loadSequences();
        } catch (error) {
            console.error('Error:', error);
            toast.error('Erreur lors de la suppression');
        }
    };

    const loadEnrollments = async (sequenceId: string) => {
        if (enrollments[sequenceId]) {
            setExpandedId(expandedId === sequenceId ? null : sequenceId);
            return;
        }
        setLoadingEnrollments(sequenceId);
        try {
            const res = await fetch(`/api/email/sequences/${sequenceId}/enrollments`);
            if (res.ok) {
                const data = await res.json();
                setEnrollments(prev => ({ ...prev, [sequenceId]: data }));
                setExpandedId(sequenceId);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoadingEnrollments(null);
        }
    };

    const cancelEnrollment = async (enrollmentId: string, sequenceId: string) => {
        try {
            const res = await fetch(`/api/email/sequences/${sequenceId}/enrollments`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enrollmentId, status: 'cancelled' }),
            });
            if (!res.ok) throw new Error('Erreur');
            toast.success('Inscription annulée');
            setEnrollments(prev => ({
                ...prev,
                [sequenceId]: prev[sequenceId]?.map(e => e.id === enrollmentId ? { ...e, status: 'cancelled' } : e) || [],
            }));
        } catch (error) {
            console.error('Error:', error);
            toast.error('Erreur');
        }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0E3A5D]" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Workflow className="w-5 h-5 text-[#0E3A5D]" />Séquences ({sequences.length})
                </h3>
                <button onClick={onCreateNew} className="flex items-center gap-2 px-4 py-2 bg-[#0E3A5D] text-white rounded-full text-sm font-medium hover:bg-[#1E5A8E]">
                    <Plus className="w-4 h-4" />Nouvelle séquence
                </button>
            </div>

            {sequences.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <Workflow className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune séquence</h3>
                    <p className="text-gray-500 mb-6">Créez des séquences d'emails automatiques.</p>
                    <button onClick={onCreateNew} className="inline-flex items-center gap-2 px-6 py-3 bg-[#0E3A5D] text-white rounded-full hover:bg-[#1E5A8E]">
                        <Plus className="w-5 h-5" />Créer une séquence
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {sequences.map((seq) => (
                        <div key={seq.id} className="glass-card p-4 md:p-6">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${seq.status === 'active' ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                                        <Workflow className={`w-5 h-5 ${seq.status === 'active' ? 'text-emerald-600' : 'text-gray-400'}`} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{seq.name}</h4>
                                        {seq.description && <p className="text-sm text-gray-500 mt-0.5">{seq.description}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => toggleActive(seq)} className={`p-2 rounded-lg ${seq.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'} hover:bg-opacity-80`}>
                                        {seq.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                    </button>
                                    <button onClick={() => onEdit(seq)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"><MoreVertical className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(seq.id)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" />{seq.steps?.length || 0} étapes</span>
                                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{seq.enrollments_count || seq._count?.enrollments || 0} inscrits</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${seq.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {seq.status === 'active' ? 'Actif' : 'En pause'}
                                </span>
                            </div>

                            <button onClick={() => loadEnrollments(seq.id)} className="flex items-center gap-1.5 text-sm text-[#0E3A5D] font-medium hover:underline">
                                {loadingEnrollments === seq.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0E3A5D]" />
                                ) : expandedId === seq.id ? (
                                    <><ChevronUp className="w-4 h-4" />Masquer les inscrits</>
                                ) : (
                                    <><ChevronDown className="w-4 h-4" />Voir les inscrits</>
                                )}
                            </button>

                            {expandedId === seq.id && enrollments[seq.id] && (
                                <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                                    {enrollments[seq.id].length === 0 ? (
                                        <p className="text-sm text-gray-400 text-center py-4">Aucun inscrit</p>
                                    ) : (
                                        enrollments[seq.id].map((enr) => (
                                            <div key={enr.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                                <div>
                                                    <p className="font-medium text-sm text-gray-900">{enr.contact?.full_name || 'Contact inconnu'}</p>
                                                    <p className="text-xs text-gray-500">{enr.contact?.email} • Étape {enr.current_step}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${enr.status === 'active' ? 'bg-emerald-100 text-emerald-700' : enr.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                                        {enr.status}
                                                    </span>
                                                    {enr.status === 'active' && (
                                                        <button onClick={() => cancelEnrollment(enr.id, seq.id)} className="text-xs text-red-600 hover:underline">Annuler</button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
