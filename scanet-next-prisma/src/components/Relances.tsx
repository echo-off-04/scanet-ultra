'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Mail, Users, Plus, Trash2, Edit2, Send, CheckCircle, XCircle, AlertCircle, RefreshCw, X, Zap, Workflow } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import EmailSequences from './EmailSequences';
import SequenceBuilderModal from './SequenceBuilderModal';
import type { EmailSequence } from '@/types';

interface ScheduledEmail {
    id: string;
    user_id: string;
    subject: string;
    body: string;
    scheduled_for: string;
    status: 'pending' | 'sent' | 'failed' | 'cancelled';
    sent_at: string | null;
    error_message: string | null;
    created_at: string;
    updated_at: string;
    recipients: { id: string; email: string; contact_id: string | null; status: string; sent_at: string | null }[];
}

interface RelancesProps {
    onScheduleNew: () => void;
}

type RelancesTab = 'scheduled' | 'sequences';

export default function Relances({ onScheduleNew }: RelancesProps) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<RelancesTab>('scheduled');
    const [showSequenceBuilder, setShowSequenceBuilder] = useState(false);
    const [editingSequence, setEditingSequence] = useState<EmailSequence | null>(null);
    const [sequencesKey, setSequencesKey] = useState(0);
    const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'sent' | 'failed'>('all');
    const [processing, setProcessing] = useState(false);
    const [editingEmail, setEditingEmail] = useState<ScheduledEmail | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        if (user) loadScheduledEmails();
    }, [user]);

    // Poll for status updates every 30 seconds (replacing Supabase realtime)
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(loadScheduledEmails, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const loadScheduledEmails = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const res = await fetch('/api/email/scheduled');
            if (res.ok) {
                const data = await res.json();
                setScheduledEmails(data);
            }
        } catch (error) {
            console.error('Error loading scheduled emails:', error);
            toast.error('Erreur lors du chargement des relances');
        } finally {
            setLoading(false);
        }
    };

    const handleManualProcess = async () => {
        setProcessing(true);
        try {
            const res = await fetch('/api/email/process-scheduled', { method: 'POST' });
            const result = await res.json();
            if (result.sent > 0) toast.success(`${result.sent} email(s) envoyé(s)`);
            else toast.info('Aucun email en attente');
            if (result.failed > 0) toast.error(`${result.failed} email(s) en échec`);
            loadScheduledEmails();
        } catch (error) {
            console.error('Error processing emails:', error);
            toast.error('Erreur lors de l\'envoi');
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer cette relance ?')) return;
        try {
            const res = await fetch(`/api/email/scheduled/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Erreur');
            toast.success('Relance supprimée');
            loadScheduledEmails();
        } catch (error) {
            console.error('Error:', error);
            toast.error('Erreur lors de la suppression');
        }
    };

    const handleCancel = async (id: string) => {
        try {
            const res = await fetch(`/api/email/scheduled/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'cancelled' }),
            });
            if (!res.ok) throw new Error('Erreur');
            toast.success('Relance annulée');
            loadScheduledEmails();
        } catch (error) {
            console.error('Error:', error);
            toast.error('Erreur lors de l\'annulation');
        }
    };

    const handleSaveEdit = async () => {
        if (!editingEmail) return;
        try {
            const res = await fetch(`/api/email/scheduled/${editingEmail.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: editingEmail.subject,
                    body: editingEmail.body,
                    scheduled_for: editingEmail.scheduled_for,
                }),
            });
            if (!res.ok) throw new Error('Erreur');
            toast.success('Relance modifiée');
            setShowEditModal(false);
            setEditingEmail(null);
            loadScheduledEmails();
        } catch (error) {
            console.error('Error:', error);
            toast.error('Erreur lors de la modification');
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { icon: any; label: string; cls: string }> = {
            pending: { icon: Clock, label: 'En attente', cls: 'bg-blue-100 text-blue-700' },
            sent: { icon: CheckCircle, label: 'Envoyé', cls: 'bg-emerald-100 text-emerald-700' },
            failed: { icon: XCircle, label: 'Échec', cls: 'bg-red-100 text-red-700' },
            cancelled: { icon: AlertCircle, label: 'Annulé', cls: 'bg-gray-100 text-gray-700' },
        };
        const b = badges[status];
        if (!b) return null;
        const Icon = b.icon;
        return <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${b.cls}`}><Icon className="w-3.5 h-3.5" />{b.label}</span>;
    };

    const formatDate = (ds: string) => new Date(ds).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const isPast = (ds: string) => new Date(ds) < new Date();

    const filteredEmails = scheduledEmails.filter(e => filter === 'all' || e.status === filter);
    const stats = {
        total: scheduledEmails.length,
        pending: scheduledEmails.filter(e => e.status === 'pending').length,
        sent: scheduledEmails.filter(e => e.status === 'sent').length,
        failed: scheduledEmails.filter(e => e.status === 'failed').length,
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex w-fit items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
                <button onClick={() => setActiveTab('scheduled')}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${activeTab === 'scheduled' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Mail className="h-4 w-4" />Emails programmés
                </button>
                <button onClick={() => setActiveTab('sequences')}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${activeTab === 'sequences' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Workflow className="h-4 w-4" />Séquences automatiques
                </button>
            </div>

            {activeTab === 'sequences' ? (
                <EmailSequences key={sequencesKey} onCreateNew={() => { setEditingSequence(null); setShowSequenceBuilder(true); }} onEdit={(seq) => { setEditingSequence(seq); setShowSequenceBuilder(true); }} />
            ) : (
                <>
                    {loading ? (
                        <div className="flex h-64 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-slate-700" /></div>
                    ) : (
                        <div className="space-y-4 md:space-y-6">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                                {[
                                    { label: 'Total', value: stats.total, icon: Mail, color: 'gray', f: 'all' as const },
                                    { label: 'En attente', value: stats.pending, icon: Clock, color: 'blue', f: 'pending' as const },
                                    { label: 'Envoyés', value: stats.sent, icon: CheckCircle, color: 'emerald', f: 'sent' as const },
                                    { label: 'Échoués', value: stats.failed, icon: XCircle, color: 'red', f: 'failed' as const },
                                ].map(({ label, value, icon: Icon, color, f }) => (
                                    <div key={f} className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50 md:p-6" onClick={() => setFilter(f)}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-slate-600 md:text-sm">{label}</p>
                                                <p className="mt-1 text-2xl font-semibold text-slate-900 md:text-3xl">{value}</p>
                                            </div>
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 md:h-12 md:w-12">
                                                <Icon className="h-5 w-5 text-slate-700 md:h-6 md:w-6" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white">
                                        <Zap className="h-5 w-5 text-slate-700" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-900">Envoi automatique actif</h4>
                                        <p className="mt-0.5 text-xs text-slate-600">Vos relances sont envoyées automatiquement à l'heure prévue.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 md:gap-4">
                                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                    {(['all', 'pending', 'sent', 'failed'] as const).map(f => (
                                        <button key={f} onClick={() => setFilter(f)}
                                            className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium transition-colors md:px-4 md:text-sm ${filter === f ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>
                                            {f === 'all' ? 'Tous' : f === 'pending' ? 'En attente' : f === 'sent' ? 'Envoyés' : 'Échoués'}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button onClick={onScheduleNew} className="btn-primary justify-center rounded-full px-4 py-3 text-sm md:px-6 md:text-base">
                                        <Plus className="h-4 w-4 md:h-5 md:w-5" /><span className="font-semibold">Planifier une relance</span>
                                    </button>
                                    {stats.failed > 0 && (
                                        <button onClick={handleManualProcess} disabled={processing}
                                            className="btn-secondary justify-center rounded-full px-4 py-3 text-sm text-slate-700 md:px-6 md:text-base disabled:opacity-50">
                                            <RefreshCw className={`h-4 w-4 md:h-5 md:w-5 ${processing ? 'animate-spin' : ''}`} />
                                            <span className="font-medium">{processing ? 'Traitement...' : 'Relancer les échecs'}</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {filteredEmails.length === 0 ? (
                                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-slate-50"><Mail className="h-10 w-10 text-slate-700" /></div>
                                    <h3 className="mb-3 text-2xl font-semibold text-slate-900">
                                        {filter === 'all' ? 'Aucune relance planifiée' : `Aucune relance ${filter === 'pending' ? 'en attente' : filter === 'sent' ? 'envoyée' : 'échouée'}`}
                                    </h3>
                                    <p className="mx-auto mb-6 max-w-md text-slate-600">Planifiez des relances pour vos contacts.</p>
                                    <button onClick={onScheduleNew} className="btn-primary inline-flex rounded-full px-6 py-3">
                                        <Plus className="h-5 w-5" /><span className="font-semibold">Planifier ma première relance</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 md:gap-4">
                                    {filteredEmails.map((email) => (
                                        <div key={email.id} className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50 md:p-6">
                                            <div className="flex flex-col lg:flex-row lg:items-start gap-3 md:gap-4">
                                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 md:h-14 md:w-14">
                                                    <Send className="h-6 w-6 text-slate-700 md:h-7 md:w-7" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="mb-1 truncate text-lg font-semibold text-slate-900">{email.subject}</h3>
                                                            <p className="line-clamp-3 text-sm text-slate-600">{email.body}</p>
                                                        </div>
                                                        {getStatusBadge(email.status)}
                                                    </div>
                                                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="h-4 w-4" />
                                                            <span>{email.status === 'sent' && email.sent_at ? `Envoyé le ${formatDate(email.sent_at)}` : `Prévu le ${formatDate(email.scheduled_for)}`}</span>
                                                            {email.status === 'pending' && isPast(email.scheduled_for) && (
                                                                <span className="ml-2 flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"><RefreshCw className="h-3 w-3 animate-spin" />Envoi en cours</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1.5"><Users className="h-4 w-4" /><span>{email.recipients?.length || 0} destinataire(s)</span></div>
                                                    </div>
                                                    {email.recipients && email.recipients.length > 0 && (
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {email.recipients.slice(0, 3).map(r => (
                                                                <span key={r.id} className="max-w-[200px] truncate rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">{r.email}</span>
                                                            ))}
                                                            {email.recipients.length > 3 && <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">+{email.recipients.length - 3} autre(s)</span>}
                                                        </div>
                                                    )}
                                                    {email.error_message && (
                                                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"><strong>Erreur:</strong> {email.error_message}</div>
                                                    )}
                                                </div>
                                                {email.status === 'pending' ? (
                                                    <div className="flex lg:flex-col gap-2">
                                                        <button onClick={() => { setEditingEmail(email); setShowEditModal(true); }} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200" title="Modifier"><Edit2 className="h-5 w-5" /></button>
                                                        <button onClick={() => handleCancel(email.id)} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200" title="Annuler"><AlertCircle className="h-5 w-5" /></button>
                                                        <button onClick={() => handleDelete(email.id)} className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100" title="Supprimer"><Trash2 className="h-5 w-5" /></button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => handleDelete(email.id)} className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100"><Trash2 className="h-5 w-5" /></button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {showEditModal && editingEmail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="sticky top-0 flex items-center justify-between rounded-t-2xl border-b border-slate-200 bg-white px-6 py-4">
                            <h2 className="text-2xl font-semibold text-slate-900">Modifier la relance</h2>
                            <button onClick={() => { setShowEditModal(false); setEditingEmail(null); }} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Objet</label>
                                <input type="text" value={editingEmail.subject} onChange={(e) => setEditingEmail({ ...editingEmail, subject: e.target.value })} className="input-modern" />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Message</label>
                                <textarea value={editingEmail.body} onChange={(e) => setEditingEmail({ ...editingEmail, body: e.target.value })} rows={8} className="input-modern resize-none" />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Date et heure d'envoi</label>
                                <input type="datetime-local"
                                    value={(() => { const d = new Date(editingEmail.scheduled_for); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; })()}
                                    onChange={(e) => setEditingEmail({ ...editingEmail, scheduled_for: new Date(e.target.value).toISOString() })}
                                    className="input-modern" />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Destinataires</label>
                                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    {editingEmail.recipients.map(r => (
                                        <div key={r.id} className="flex items-center gap-2 text-sm text-slate-700"><Mail className="h-4 w-4 text-slate-400" /><span>{r.email}</span></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="sticky bottom-0 flex justify-end gap-3 rounded-b-2xl border-t border-slate-200 bg-slate-50 px-6 py-4">
                            <button onClick={() => { setShowEditModal(false); setEditingEmail(null); }} className="btn-secondary">Annuler</button>
                            <button onClick={handleSaveEdit} className="btn-primary">Enregistrer</button>
                        </div>
                    </div>
                </div>
            )}

            {showSequenceBuilder && (
                <SequenceBuilderModal onClose={() => { setShowSequenceBuilder(false); setEditingSequence(null); }} onSuccess={() => { setShowSequenceBuilder(false); setEditingSequence(null); setSequencesKey(k => k + 1); }} editSequence={editingSequence} />
            )}
        </div>
    );
}
