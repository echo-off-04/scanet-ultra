'use client';

import { useState, useEffect } from 'react';
import { Workflow, Plus, Play, Pause, Trash2, ChevronDown, ChevronUp, MoreVertical, X, Users, Mail, Clock, Hash } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { EmailSequence } from '@/types';
import { MaterialButton } from './material/MaterialButton';
import { MaterialIconButton } from './material/MaterialIconButton';

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
    sends?: Array<{ id: string; step_id: string; status: string; scheduled_for: string | null; sent_at: string | null }>;
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

    if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                    <Workflow className="h-5 w-5 text-slate-700" />Séquences ({sequences.length})
                </h3>
                <MaterialButton onClick={onCreateNew} icon={<Plus className="h-4 w-4" />} className="text-sm">
                    Nouvelle séquence
                </MaterialButton>
            </div>

            {sequences.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                    <Workflow className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                    <h3 className="mb-2 text-xl font-semibold text-slate-900">Aucune séquence</h3>
                    <p className="mb-6 text-slate-500">Créez des séquences d'emails automatiques.</p>
                    <MaterialButton onClick={onCreateNew} icon={<Plus className="h-5 w-5" />}>
                        Créer une séquence
                    </MaterialButton>
                </div>
            ) : (
                <div className="space-y-3">
                    {sequences.map((seq) => (
                        <div key={seq.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
                            <div className="mb-3 flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                                        <Workflow className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900">{seq.name}</h4>
                                        {seq.description && <p className="mt-0.5 text-sm text-slate-500">{seq.description}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MaterialIconButton ariaLabel={seq.status === 'active' ? 'Mettre en pause' : 'Activer'} onClick={() => toggleActive(seq)} icon={seq.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} />
                                    <MaterialIconButton ariaLabel="Modifier la séquence" onClick={() => onEdit(seq)} icon={<MoreVertical className="h-4 w-4" />} />
                                    <MaterialIconButton ariaLabel="Supprimer la séquence" onClick={() => handleDelete(seq.id)} variant="outlined" icon={<Trash2 className="h-4 w-4 text-red-600" />} />
                                </div>
                            </div>

                            <div className="mb-3 flex items-center gap-4 text-sm text-slate-500">
                                <span className="flex items-center gap-1"><Hash className="h-3.5 w-3.5" />{seq.steps?.length || 0} étapes</span>
                                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{seq.enrollments_count || seq._count?.enrollments || 0} inscrits</span>
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${seq.status === 'active' ? 'bg-slate-100 text-slate-800' : 'bg-slate-100 text-slate-600'}`}>
                                    {seq.status === 'active' ? 'Actif' : 'En pause'}
                                </span>
                            </div>

                            <div className="mb-3 flex flex-wrap gap-2 text-xs text-slate-500">
                                {seq.trigger_status && <span className="rounded-full bg-slate-100 px-2 py-1">Déclencheur: {seq.trigger_status}</span>}
                                {seq.source_filter && <span className="rounded-full bg-slate-100 px-2 py-1">Source: {seq.source_filter}</span>}
                                {seq.exclude_statuses?.length ? <span className="rounded-full bg-slate-100 px-2 py-1">Exclut: {seq.exclude_statuses.join(', ')}</span> : null}
                            </div>

                            <button onClick={() => loadEnrollments(seq.id)} className="flex items-center gap-1.5 text-sm font-medium text-slate-700 transition-colors hover:text-slate-900">
                                {loadingEnrollments === seq.id ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
                                ) : expandedId === seq.id ? (
                                    <><ChevronUp className="h-4 w-4" />Masquer les inscrits</>
                                ) : (
                                    <><ChevronDown className="h-4 w-4" />Voir les inscrits</>
                                )}
                            </button>

                            {expandedId === seq.id && enrollments[seq.id] && (
                                <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                                    {enrollments[seq.id].length === 0 ? (
                                        <p className="py-4 text-center text-sm text-slate-400">Aucun inscrit</p>
                                    ) : (
                                        enrollments[seq.id].map((enr) => (
                                            <div key={enr.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{enr.contact?.full_name || 'Contact inconnu'}</p>
                                                    <p className="text-xs text-slate-500">{enr.contact?.email} • Étape {enr.current_step}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`rounded-full px-2 py-0.5 text-xs ${enr.status === 'active' ? 'bg-slate-100 text-slate-800' : enr.status === 'completed' ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-600'}`}>
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
