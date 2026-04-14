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
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit">
                <button onClick={() => setActiveTab('scheduled')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'scheduled' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Mail className="w-4 h-4" />Emails programmés
                </button>
                <button onClick={() => setActiveTab('sequences')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'sequences' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Workflow className="w-4 h-4" />Séquences automatiques
                </button>
            </div>

            {activeTab === 'sequences' ? (
                <EmailSequences key={sequencesKey} onCreateNew={() => { setEditingSequence(null); setShowSequenceBuilder(true); }} onEdit={(seq) => { setEditingSequence(seq); setShowSequenceBuilder(true); }} />
            ) : (
                <>
                    {loading ? (
                        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0E3A5D]" /></div>
                    ) : (
                        <div className="space-y-4 md:space-y-6">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                                {[
                                    { label: 'Total', value: stats.total, icon: Mail, color: 'gray', f: 'all' as const },
                                    { label: 'En attente', value: stats.pending, icon: Clock, color: 'blue', f: 'pending' as const },
                                    { label: 'Envoyés', value: stats.sent, icon: CheckCircle, color: 'emerald', f: 'sent' as const },
                                    { label: 'Échoués', value: stats.failed, icon: XCircle, color: 'red', f: 'failed' as const },
                                ].map(({ label, value, icon: Icon, color, f }) => (
                                    <div key={f} className="glass-card p-4 md:p-6 cursor-pointer hover:scale-105 transition-transform" onClick={() => setFilter(f)}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs md:text-sm text-gray-600">{label}</p>
                                                <p className={`text-2xl md:text-3xl font-bold mt-1 text-${color}-600`}>{value}</p>
                                            </div>
                                            <div className={`w-10 h-10 md:w-12 md:h-12 bg-${color}-100 rounded-full flex items-center justify-center`}>
                                                <Icon className={`w-5 h-5 md:w-6 md:h-6 text-${color}-600`} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="glass-card p-4 md:p-5 border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                        <Zap className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-emerald-900">Envoi automatique actif</h4>
                                        <p className="text-xs text-emerald-700 mt-0.5">Vos relances sont envoyées automatiquement à l'heure prévue.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 md:gap-4">
                                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                    {(['all', 'pending', 'sent', 'failed'] as const).map(f => (
                                        <button key={f} onClick={() => setFilter(f)}
                                            className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap ${filter === f ? 'bg-[#0E3A5D] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
                                            {f === 'all' ? 'Tous' : f === 'pending' ? 'En attente' : f === 'sent' ? 'Envoyés' : 'Échoués'}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button onClick={onScheduleNew} className="flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-gradient-to-r from-[#0E3A5D] to-[#1E5A8E] text-white rounded-full hover:shadow-lg transition-all hover:scale-105 text-sm md:text-base">
                                        <Plus className="w-4 h-4 md:w-5 md:h-5" /><span className="font-semibold">Planifier une relance</span>
                                    </button>
                                    {stats.failed > 0 && (
                                        <button onClick={handleManualProcess} disabled={processing}
                                            className="flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 text-sm md:text-base disabled:opacity-50">
                                            <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${processing ? 'animate-spin' : ''}`} />
                                            <span className="font-medium">{processing ? 'Traitement...' : 'Relancer les échecs'}</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {filteredEmails.length === 0 ? (
                                <div className="glass-card p-12 text-center">
                                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6"><Mail className="w-10 h-10 text-[#0E3A5D]" /></div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                        {filter === 'all' ? 'Aucune relance planifiée' : `Aucune relance ${filter === 'pending' ? 'en attente' : filter === 'sent' ? 'envoyée' : 'échouée'}`}
                                    </h3>
                                    <p className="text-gray-600 max-w-md mx-auto mb-6">Planifiez des relances pour vos contacts.</p>
                                    <button onClick={onScheduleNew} className="inline-flex items-center gap-2 px-6 py-3 bg-[#0E3A5D] text-white rounded-full hover:bg-[#1E5A8E]">
                                        <Plus className="w-5 h-5" /><span className="font-semibold">Planifier ma première relance</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 md:gap-4">
                                    {filteredEmails.map((email) => (
                                        <div key={email.id} className="glass-card p-4 md:p-6 hover:shadow-xl transition-all">
                                            <div className="flex flex-col lg:flex-row lg:items-start gap-3 md:gap-4">
                                                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${email.status === 'sent' ? 'bg-emerald-100' : email.status === 'failed' ? 'bg-red-100' : email.status === 'cancelled' ? 'bg-gray-100' : 'bg-blue-100'}`}>
                                                    <Send className={`w-6 h-6 md:w-7 md:h-7 ${email.status === 'sent' ? 'text-emerald-600' : email.status === 'failed' ? 'text-red-600' : email.status === 'cancelled' ? 'text-gray-600' : 'text-blue-600'}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{email.subject}</h3>
                                                            <p className="text-sm text-gray-600 line-clamp-3">{email.body}</p>
                                                        </div>
                                                        {getStatusBadge(email.status)}
                                                    </div>
                                                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>{email.status === 'sent' && email.sent_at ? `Envoyé le ${formatDate(email.sent_at)}` : `Prévu le ${formatDate(email.scheduled_for)}`}</span>
                                                            {email.status === 'pending' && isPast(email.scheduled_for) && (
                                                                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" />Envoi en cours</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1.5"><Users className="w-4 h-4" /><span>{email.recipients?.length || 0} destinataire(s)</span></div>
                                                    </div>
                                                    {email.recipients && email.recipients.length > 0 && (
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {email.recipients.slice(0, 3).map(r => (
                                                                <span key={r.id} className="px-2.5 py-1 bg-white/50 rounded-full text-xs text-gray-700 border border-gray-200 max-w-[200px] truncate">{r.email}</span>
                                                            ))}
                                                            {email.recipients.length > 3 && <span className="px-2.5 py-1 bg-white/50 rounded-full text-xs text-gray-700 border border-gray-200">+{email.recipients.length - 3} autre(s)</span>}
                                                        </div>
                                                    )}
                                                    {email.error_message && (
                                                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"><strong>Erreur:</strong> {email.error_message}</div>
                                                    )}
                                                </div>
                                                {email.status === 'pending' ? (
                                                    <div className="flex lg:flex-col gap-2">
                                                        <button onClick={() => { setEditingEmail(email); setShowEditModal(true); }} className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100" title="Modifier"><Edit2 className="w-5 h-5" /></button>
                                                        <button onClick={() => handleCancel(email.id)} className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-50 text-orange-600 hover:bg-orange-100" title="Annuler"><AlertCircle className="w-5 h-5" /></button>
                                                        <button onClick={() => handleDelete(email.id)} className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-red-600 hover:bg-red-100" title="Supprimer"><Trash2 className="w-5 h-5" /></button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => handleDelete(email.id)} className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-red-600 hover:bg-red-100"><Trash2 className="w-5 h-5" /></button>
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                            <h2 className="text-2xl font-bold text-gray-900">Modifier la relance</h2>
                            <button onClick={() => { setShowEditModal(false); setEditingEmail(null); }} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Objet</label>
                                <input type="text" value={editingEmail.subject} onChange={(e) => setEditingEmail({ ...editingEmail, subject: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E3A5D]" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                                <textarea value={editingEmail.body} onChange={(e) => setEditingEmail({ ...editingEmail, body: e.target.value })} rows={8} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E3A5D] resize-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Date et heure d'envoi</label>
                                <input type="datetime-local"
                                    value={(() => { const d = new Date(editingEmail.scheduled_for); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; })()}
                                    onChange={(e) => setEditingEmail({ ...editingEmail, scheduled_for: new Date(e.target.value).toISOString() })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E3A5D]" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Destinataires</label>
                                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                    {editingEmail.recipients.map(r => (
                                        <div key={r.id} className="flex items-center gap-2 text-sm text-gray-700"><Mail className="w-4 h-4 text-gray-400" /><span>{r.email}</span></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 justify-end rounded-b-2xl border-t">
                            <button onClick={() => { setShowEditModal(false); setEditingEmail(null); }} className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-100">Annuler</button>
                            <button onClick={handleSaveEdit} className="px-6 py-3 bg-gradient-to-r from-[#0E3A5D] to-[#1E5A8E] text-white rounded-xl font-medium hover:shadow-lg">Enregistrer</button>
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
