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

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0E3A5D]" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Rechercher par email ou objet..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm" />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm">
                    <option value="all">Tous les statuts</option>
                    <option value="sent">Envoyés</option>
                    <option value="failed">Échoués</option>
                    <option value="pending">En attente</option>
                </select>
            </div>

            {filteredLogs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aucun email trouvé</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredLogs.map(log => (
                        <div key={log.id} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all cursor-pointer" onClick={() => setSelectedLog(log)}>
                            {statusIcon(log.status)}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{log.subject}</p>
                                <p className="text-xs text-gray-500 truncate">À: {log.to_email}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${log.email_type === 'scheduled' ? 'bg-blue-100 text-blue-700' : log.email_type === 'sequence' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {log.email_type || 'direct'}
                                </span>
                            </div>
                            <Eye className="w-4 h-4 text-gray-400" />
                        </div>
                    ))}
                </div>
            )}

            {selectedLog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedLog(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-bold text-gray-900">Détail de l'email</h3>
                            <button onClick={() => setSelectedLog(null)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-gray-500">De:</span> <span className="font-medium">{selectedLog.from_email}</span></div>
                                <div><span className="text-gray-500">À:</span> <span className="font-medium">{selectedLog.to_email}</span></div>
                                <div><span className="text-gray-500">Statut:</span> <span className="flex items-center gap-1">{statusIcon(selectedLog.status)} {selectedLog.status}</span></div>
                                <div><span className="text-gray-500">Date:</span> <span>{new Date(selectedLog.created_at).toLocaleString('fr-FR')}</span></div>
                            </div>
                            <div><h4 className="font-semibold text-gray-900 mb-1">Objet</h4><p>{selectedLog.subject}</p></div>
                            {selectedLog.body_html ? (
                                <div><h4 className="font-semibold text-gray-900 mb-1">Contenu</h4>
                                    <iframe srcDoc={selectedLog.body_html} className="w-full h-64 border border-gray-200 rounded-xl" sandbox="" />
                                </div>
                            ) : selectedLog.body_text ? (
                                <div><h4 className="font-semibold text-gray-900 mb-1">Contenu</h4><p className="whitespace-pre-wrap text-sm text-gray-700">{selectedLog.body_text}</p></div>
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
