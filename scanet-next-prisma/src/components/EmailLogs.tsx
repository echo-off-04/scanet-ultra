'use client';

import { useState, useEffect } from 'react';
import { Mail, Search, Filter, Eye, Clock, CheckCircle, XCircle, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface EmailLog {
    id: string;
    to_email: string;
    from_email: string;
    subject: string;
    body_html: string | null;
    body_text: string | null;
    email_type: string;
    status: 'pending' | 'sent' | 'failed';
    error_message: string | null;
    sent_at: string | null;
    created_at: string;
}

export function EmailLogs() {
    const { user, profile } = useAuth();
    const [logs, setLogs] = useState<EmailLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

    useEffect(() => {
        if (user) loadLogs();
    }, [user]);

    const loadLogs = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/email/logs');
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (error) {
            console.error('Error loading email logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        if (statusFilter !== 'all' && log.status !== statusFilter) return false;
        if (typeFilter !== 'all' && log.email_type !== typeFilter) return false;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return log.to_email.toLowerCase().includes(term) || log.subject.toLowerCase().includes(term);
        }
        return true;
    });

    const statusIcon = (status: string) => {
        switch (status) {
            case 'sent': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
            default: return <Clock className="w-4 h-4 text-amber-500" />;
        }
    };

    if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-slate-700" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Rechercher par email ou objet..." className="input-modern py-2.5 pl-10 text-sm" />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-modern text-sm">
                    <option value="all">Tous les statuts</option>
                    <option value="sent">Envoyés</option>
                    <option value="failed">Échoués</option>
                    <option value="pending">En attente</option>
                </select>
            </div>

            {filteredLogs.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 py-12 text-center">
                    <Mail className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                    <p className="text-slate-500">Aucun email trouvé</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredLogs.map(log => (
                        <div key={log.id} className="flex cursor-pointer items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50" onClick={() => setSelectedLog(log)}>
                            {statusIcon(log.status)}
                            <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-medium text-slate-900">{log.subject}</p>
                                <p className="truncate text-xs text-slate-500">À: {log.to_email}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-xs text-slate-400">{new Date(log.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                    {log.email_type || 'direct'}
                                </span>
                            </div>
                            <Eye className="h-4 w-4 text-slate-400" />
                        </div>
                    ))}
                </div>
            )}

            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setSelectedLog(null)}>
                    <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-slate-200 p-4">
                            <h3 className="font-semibold text-slate-900">Détail de l'email</h3>
                            <button onClick={() => setSelectedLog(null)} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-slate-500">De:</span> <span className="font-medium">{selectedLog.from_email}</span></div>
                                <div><span className="text-slate-500">À:</span> <span className="font-medium">{selectedLog.to_email}</span></div>
                                <div><span className="text-slate-500">Statut:</span> <span className="flex items-center gap-1">{statusIcon(selectedLog.status)} {selectedLog.status}</span></div>
                                <div><span className="text-slate-500">Date:</span> <span>{new Date(selectedLog.created_at).toLocaleString('fr-FR')}</span></div>
                            </div>
                            <div><h4 className="mb-1 font-semibold text-slate-900">Objet</h4><p>{selectedLog.subject}</p></div>
                            {selectedLog.body_html ? (
                                <div><h4 className="mb-1 font-semibold text-slate-900">Contenu</h4>
                                    <iframe srcDoc={selectedLog.body_html} className="h-64 w-full rounded-xl border border-slate-200" sandbox="" />
                                </div>
                            ) : selectedLog.body_text ? (
                                <div><h4 className="mb-1 font-semibold text-slate-900">Contenu</h4><p className="whitespace-pre-wrap text-sm text-slate-700">{selectedLog.body_text}</p></div>
                            ) : null}
                            {selectedLog.error_message && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"><strong>Erreur:</strong> {selectedLog.error_message}</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
