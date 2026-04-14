import { useState, useEffect } from 'react';
import { Calendar, Clock, Mail, Users, Plus, Trash2, Edit2, Send, CheckCircle, XCircle, AlertCircle, RefreshCw, X, Zap, Workflow } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { processScheduledEmails } from '../lib/scheduledEmailService';
import EmailSequences from './EmailSequences';
import SequenceBuilderModal from './SequenceBuilderModal';
import type { EmailSequence } from './EmailSequences';

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
  recipients: {
    id: string;
    email: string;
    contact_id: string | null;
    status: string;
    sent_at: string | null;
  }[];
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
    if (user) {
      loadScheduledEmails();

      const emailsSubscription = supabase
        .channel('scheduled-emails-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'scheduled_emails',
          filter: `user_id=eq.${user.id}`
        }, () => {
          loadScheduledEmails();
        })
        .subscribe();

      return () => {
        emailsSubscription.unsubscribe();
      };
    }
  }, [user]);

  const loadScheduledEmails = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data: emails, error } = await supabase
        .from('scheduled_emails')
        .select(`
          *,
          recipients:scheduled_email_recipients(
            id,
            email,
            contact_id,
            status,
            sent_at
          )
        `)
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: false });

      if (error) throw error;
      setScheduledEmails(emails || []);
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
      const result = await processScheduledEmails();

      if (result.success) {
        if (result.sent > 0) {
          toast.success(`${result.sent} email${result.sent > 1 ? 's' : ''} envoyé${result.sent > 1 ? 's' : ''} avec succès`);
        } else {
          toast.info('Aucun email en attente à traiter');
        }

        if (result.failed > 0) {
          toast.error(`${result.failed} email${result.failed > 1 ? 's' : ''} en échec`);
        }

        loadScheduledEmails();
      } else {
        throw new Error(result.error || 'Erreur lors du traitement');
      }
    } catch (error) {
      console.error('Error processing emails:', error);
      toast.error('Erreur lors de l\'envoi des emails');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette relance ?')) return;

    try {
      const { error } = await supabase
        .from('scheduled_emails')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Relance supprimée');
      loadScheduledEmails();
    } catch (error) {
      console.error('Error deleting scheduled email:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_emails')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
      toast.success('Relance annulée');
      loadScheduledEmails();
    } catch (error) {
      console.error('Error cancelling scheduled email:', error);
      toast.error('Erreur lors de l\'annulation');
    }
  };

  const handleEdit = (email: ScheduledEmail) => {
    setEditingEmail(email);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingEmail) return;

    try {
      const { error } = await supabase
        .from('scheduled_emails')
        .update({
          subject: editingEmail.subject,
          body: editingEmail.body,
          scheduled_for: editingEmail.scheduled_for,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingEmail.id);

      if (error) throw error;
      toast.success('Relance modifiée avec succès');
      setShowEditModal(false);
      setEditingEmail(null);
      loadScheduledEmails();
    } catch (error) {
      console.error('Error updating scheduled email:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <Clock className="w-3.5 h-3.5" />
            En attente
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            <CheckCircle className="w-3.5 h-3.5" />
            Envoyé
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="w-3.5 h-3.5" />
            Échec
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            <AlertCircle className="w-3.5 h-3.5" />
            Annulé
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isPast = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  const filteredEmails = scheduledEmails.filter(email => {
    if (filter === 'all') return true;
    return email.status === filter;
  });

  const stats = {
    total: scheduledEmails.length,
    pending: scheduledEmails.filter(e => e.status === 'pending').length,
    sent: scheduledEmails.filter(e => e.status === 'sent').length,
    failed: scheduledEmails.filter(e => e.status === 'failed').length
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('scheduled')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'scheduled'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Mail className="w-4 h-4" />
          Emails programmés
        </button>
        <button
          onClick={() => setActiveTab('sequences')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'sequences'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Workflow className="w-4 h-4" />
          Séquences automatiques
        </button>
      </div>

      {activeTab === 'sequences' ? (
        <EmailSequences
          key={sequencesKey}
          onCreateNew={() => { setEditingSequence(null); setShowSequenceBuilder(true); }}
          onEdit={(seq) => { setEditingSequence(seq); setShowSequenceBuilder(true); }}
        />
      ) : (
        <ScheduledEmailsTab
          scheduledEmails={scheduledEmails}
          filteredEmails={filteredEmails}
          loading={loading}
          filter={filter}
          setFilter={setFilter}
          stats={stats}
          processing={processing}
          onScheduleNew={onScheduleNew}
          handleManualProcess={handleManualProcess}
          handleEdit={handleEdit}
          handleCancel={handleCancel}
          handleDelete={handleDelete}
          getStatusBadge={getStatusBadge}
          formatDate={formatDate}
          isPast={isPast}
        />
      )}

      {showEditModal && editingEmail && (
        <EditEmailModal
          editingEmail={editingEmail}
          setEditingEmail={setEditingEmail}
          onClose={() => { setShowEditModal(false); setEditingEmail(null); }}
          onSave={handleSaveEdit}
        />
      )}

      {showSequenceBuilder && (
        <SequenceBuilderModal
          onClose={() => { setShowSequenceBuilder(false); setEditingSequence(null); }}
          onSuccess={() => { setShowSequenceBuilder(false); setEditingSequence(null); setSequencesKey(k => k + 1); }}
          editSequence={editingSequence}
        />
      )}
    </div>
  );
}

interface ScheduledEmailsTabProps {
  scheduledEmails: ScheduledEmail[];
  filteredEmails: ScheduledEmail[];
  loading: boolean;
  filter: 'all' | 'pending' | 'sent' | 'failed';
  setFilter: (f: 'all' | 'pending' | 'sent' | 'failed') => void;
  stats: { total: number; pending: number; sent: number; failed: number };
  processing: boolean;
  onScheduleNew: () => void;
  handleManualProcess: () => void;
  handleEdit: (email: ScheduledEmail) => void;
  handleCancel: (id: string) => void;
  handleDelete: (id: string) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  formatDate: (dateString: string) => string;
  isPast: (dateString: string) => boolean;
}

function ScheduledEmailsTab({
  filteredEmails, loading, filter, setFilter, stats, processing,
  onScheduleNew, handleManualProcess, handleEdit, handleCancel, handleDelete,
  getStatusBadge, formatDate, isPast
}: ScheduledEmailsTabProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0E3A5D]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="glass-card p-4 md:p-6 cursor-pointer hover:scale-105 transition-transform" onClick={() => setFilter('all')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Total</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4 md:p-6 cursor-pointer hover:scale-105 transition-transform" onClick={() => setFilter('pending')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">En attente</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-600 mt-1">{stats.pending}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4 md:p-6 cursor-pointer hover:scale-105 transition-transform" onClick={() => setFilter('sent')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Envoyés</p>
              <p className="text-2xl md:text-3xl font-bold text-emerald-600 mt-1">{stats.sent}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4 md:p-6 cursor-pointer hover:scale-105 transition-transform" onClick={() => setFilter('failed')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Échoués</p>
              <p className="text-2xl md:text-3xl font-bold text-red-600 mt-1">{stats.failed}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-4 md:p-5 border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-emerald-900">Envoi automatique actif</h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              Vos relances sont envoyées automatiquement à l'heure prévue, même si vous n'êtes pas connecté.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {(['all', 'pending', 'sent', 'failed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                filter === f ? 'bg-[#0E3A5D] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {f === 'all' ? 'Tous' : f === 'pending' ? 'En attente' : f === 'sent' ? 'Envoyés' : 'Échoués'}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onScheduleNew}
            className="flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-gradient-to-r from-[#0E3A5D] to-[#1E5A8E] text-white rounded-full hover:shadow-lg transition-all hover:scale-105 text-sm md:text-base"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            <span className="font-semibold">Planifier une relance</span>
          </button>
          {stats.failed > 0 && (
            <button
              onClick={handleManualProcess}
              disabled={processing}
              className="flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 hover:shadow-md transition-all text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${processing ? 'animate-spin' : ''}`} />
              <span className="font-medium">
                {processing ? 'Traitement...' : 'Relancer les échecs'}
              </span>
            </button>
          )}
        </div>
      </div>

      {filteredEmails.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-[#0E3A5D]" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {filter === 'all' ? 'Aucune relance planifiée' : `Aucune relance ${filter === 'pending' ? 'en attente' : filter === 'sent' ? 'envoyée' : 'échouée'}`}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            Planifiez des relances pour vos contacts et envoyez-les automatiquement à la date souhaitée.
          </p>
          <button
            onClick={onScheduleNew}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0E3A5D] text-white rounded-full hover:bg-[#1E5A8E] transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Planifier ma première relance</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:gap-4">
          {filteredEmails.map((email) => (
            <div key={email.id} className="glass-card p-4 md:p-6 hover:shadow-xl transition-all">
              <div className="flex flex-col lg:flex-row lg:items-start gap-3 md:gap-4">
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  email.status === 'sent' ? 'bg-emerald-100' :
                  email.status === 'failed' ? 'bg-red-100' :
                  email.status === 'cancelled' ? 'bg-gray-100' :
                  'bg-blue-100'
                }`}>
                  <Send className={`w-6 h-6 md:w-7 md:h-7 ${
                    email.status === 'sent' ? 'text-emerald-600' :
                    email.status === 'failed' ? 'text-red-600' :
                    email.status === 'cancelled' ? 'text-gray-600' :
                    'text-blue-600'
                  }`} />
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
                      <span>
                        {email.status === 'sent' && email.sent_at
                          ? `Envoyé le ${formatDate(email.sent_at)}`
                          : `Prévu le ${formatDate(email.scheduled_for)}`
                        }
                      </span>
                      {email.status === 'pending' && isPast(email.scheduled_for) && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Envoi en cours
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>{email.recipients?.length || 0} destinataire{(email.recipients?.length || 0) > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {email.recipients && email.recipients.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {email.recipients.slice(0, 3).map((recipient) => (
                        <span key={recipient.id} className="px-2.5 py-1 bg-white/50 rounded-full text-xs text-gray-700 border border-gray-200 max-w-[200px] truncate inline-block">
                          {recipient.email}
                        </span>
                      ))}
                      {email.recipients.length > 3 && (
                        <span className="px-2.5 py-1 bg-white/50 rounded-full text-xs text-gray-700 border border-gray-200">
                          +{email.recipients.length - 3} autre{email.recipients.length - 3 > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}

                  {email.error_message && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                      <strong>Erreur:</strong> <span className="line-clamp-2">{email.error_message}</span>
                    </div>
                  )}
                </div>

                {email.status === 'pending' ? (
                  <div className="flex lg:flex-col gap-2">
                    <button onClick={() => handleEdit(email)} className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all" title="Modifier">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleCancel(email.id)} className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all" title="Annuler">
                      <AlertCircle className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(email.id)} className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-all" title="Supprimer">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => handleDelete(email.id)} className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-all" title="Supprimer">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface EditEmailModalProps {
  editingEmail: ScheduledEmail;
  setEditingEmail: (email: ScheduledEmail) => void;
  onClose: () => void;
  onSave: () => void;
}

function EditEmailModal({ editingEmail, setEditingEmail, onClose, onSave }: EditEmailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">Modifier la relance</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Objet de l'email</label>
            <input
              type="text"
              value={editingEmail.subject}
              onChange={(e) => setEditingEmail({ ...editingEmail, subject: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E3A5D] focus:border-transparent transition-all"
              placeholder="Ex: Suivi de notre rencontre"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
            <textarea
              value={editingEmail.body}
              onChange={(e) => setEditingEmail({ ...editingEmail, body: e.target.value })}
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E3A5D] focus:border-transparent transition-all resize-none"
              placeholder="Votre message..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date et heure d'envoi (heure locale)</label>
            <input
              type="datetime-local"
              value={(() => {
                const date = new Date(editingEmail.scheduled_for);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                return `${year}-${month}-${day}T${hours}:${minutes}`;
              })()}
              onChange={(e) => {
                const localDate = new Date(e.target.value);
                setEditingEmail({ ...editingEmail, scheduled_for: localDate.toISOString() });
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E3A5D] focus:border-transparent transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">
              Fuseau horaire actuel : {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Destinataires</label>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              {editingEmail.recipients.map((recipient) => (
                <div key={recipient.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{recipient.email}</span>
                  {recipient.status !== 'pending' && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-gray-200">{recipient.status}</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Note: Les destinataires ne peuvent pas être modifiés après la création.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex flex-col sm:flex-row gap-3 sm:justify-end rounded-b-2xl border-t border-gray-200">
          <button onClick={onClose} className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-all">
            Annuler
          </button>
          <button onClick={onSave} className="px-6 py-3 bg-gradient-to-r from-[#0E3A5D] to-[#1E5A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all">
            Enregistrer les modifications
          </button>
        </div>
      </div>
    </div>
  );
}
