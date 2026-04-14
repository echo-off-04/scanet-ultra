import { useState, useEffect } from 'react';
import { Mail, CheckCircle, XCircle, Clock, Search, Filter, Eye, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface EmailLog {
  id: string;
  to_email: string;
  from_email: string;
  subject: string;
  body_html?: string;
  body_text?: string;
  email_type: string;
  status: 'pending' | 'sent' | 'failed';
  resend_id?: string;
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

export function EmailLogs() {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  useEffect(() => {
    if (profile) {
      loadEmailLogs();
    }
  }, [profile]);

  const loadEmailLogs = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading email logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.to_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesType = typeFilter === 'all' || log.email_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      sent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      failed: 'bg-red-50 text-red-700 border-red-200',
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
        {status === 'sent' ? 'Envoyé' : status === 'failed' ? 'Échec' : 'En attente'}
      </span>
    );
  };

  const getEmailTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      welcome: 'Bienvenue',
      notification: 'Notification',
      event_reminder: 'Rappel événement',
      contact_update: 'Mise à jour contact',
      password_reset: 'Réinitialisation mot de passe',
      marketing: 'Marketing',
      general: 'Général',
    };
    return labels[type] || type;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const emailTypes = ['all', ...Array.from(new Set(logs.map(log => log.email_type)))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Historique des emails</h2>
          <p className="text-sm text-gray-600 mt-1">
            Consultez tous les emails envoyés depuis votre compte
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Total : {filteredLogs.length}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par email ou sujet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] bg-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="sent">Envoyés</option>
              <option value="failed">Échecs</option>
              <option value="pending">En attente</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] bg-white"
            >
              <option value="all">Tous les types</option>
              {emailTypes.filter(t => t !== 'all').map(type => (
                <option key={type} value={type}>
                  {getEmailTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0E3A5D]"></div>
            <p className="text-gray-600 mt-4">Chargement des logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun email trouvé</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getStatusIcon(log.status)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {log.subject}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          À : {log.to_email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getStatusBadge(log.status)}
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Filter className="w-3.5 h-3.5" />
                        {getEmailTypeLabel(log.email_type)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(log.created_at)}
                      </span>
                      {log.resend_id && (
                        <span className="flex items-center gap-1">
                          ID: {log.resend_id.substring(0, 8)}...
                        </span>
                      )}
                    </div>

                    {log.error_message && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        <strong>Erreur :</strong> {log.error_message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Détails de l'email</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Statut</label>
                  <div className="mt-1 flex items-center gap-2">
                    {getStatusIcon(selectedLog.status)}
                    {getStatusBadge(selectedLog.status)}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <p className="mt-1 text-gray-900">{getEmailTypeLabel(selectedLog.email_type)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">De</label>
                  <p className="mt-1 text-gray-900">{selectedLog.from_email}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">À</label>
                  <p className="mt-1 text-gray-900">{selectedLog.to_email}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Sujet</label>
                  <p className="mt-1 text-gray-900">{selectedLog.subject}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Date de création</label>
                  <p className="mt-1 text-gray-900">{formatDate(selectedLog.created_at)}</p>
                </div>

                {selectedLog.sent_at && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Date d'envoi</label>
                    <p className="mt-1 text-gray-900">{formatDate(selectedLog.sent_at)}</p>
                  </div>
                )}

                {selectedLog.resend_id && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">ID Resend</label>
                    <p className="mt-1 text-gray-900 font-mono text-sm">{selectedLog.resend_id}</p>
                  </div>
                )}

                {selectedLog.error_message && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Message d'erreur</label>
                    <p className="mt-1 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {selectedLog.error_message}
                    </p>
                  </div>
                )}

                {selectedLog.body_html && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Aperçu du contenu</label>
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-96 overflow-auto">
                      <iframe
                        srcDoc={selectedLog.body_html}
                        className="w-full min-h-[300px] bg-white rounded"
                        title="Email preview"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedLog(null)}
                className="w-full px-4 py-3 bg-[#0E3A5D] text-white rounded-xl font-medium hover:bg-[#0c2d47] transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
