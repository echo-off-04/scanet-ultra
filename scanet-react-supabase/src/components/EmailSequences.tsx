import { useState, useEffect } from 'react';
import {
  Workflow, Plus, MoreVertical, Pencil, Trash2, Power, PowerOff,
  Mail, Clock, Users, MessageSquare, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Pause, Play, Eye
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  lead: 'Lead',
  prospect: 'Prospect',
  client: 'Client',
  partner: 'Partenaire',
  collaborateur: 'Collaborateur',
  ami: 'Ami',
  fournisseur: 'Fournisseur',
};

const SOURCE_LABELS: Record<string, string> = {
  event: 'Evenement',
  referral: 'Recommandation',
  cold_outreach: 'Prospection',
  team: 'Equipe',
};

export interface EmailSequence {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  trigger_status: string;
  source_filter: string | null;
  exclude_statuses: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  steps: SequenceStep[];
  enrollments_count?: number;
  active_enrollments?: number;
}

export interface SequenceStep {
  id: string;
  sequence_id: string;
  step_order: number;
  delay_days: number;
  delay_hours: number;
  subject: string;
  body: string;
  channel: 'email' | 'whatsapp';
  include_offer_id: string | null;
  created_at: string;
}

interface Enrollment {
  id: string;
  contact_id: string;
  current_step: number;
  status: string;
  enrolled_at: string;
  completed_at: string | null;
  trigger_context: Record<string, string>;
  contact: { full_name: string; email: string | null; phone: string | null; company: string | null } | null;
  sends: { id: string; step_id: string; status: string; scheduled_for: string; sent_at: string | null }[];
}

function buildWhatsAppLink(phone: string, messageTemplate: string, context?: Record<string, string>): string {
  let message = messageTemplate;
  if (context) {
    const contactName = context.contact_name || '';
    const firstName = contactName.split(' ')[0] || contactName;
    message = message.replace(/\{\{prenom\}\}/g, firstName);
    message = message.replace(/\{\{nom_complet\}\}/g, contactName);
    message = message.replace(/\{\{entreprise\}\}/g, context.contact_company || '');
    message = message.replace(/\{\{evenement\}\}/g, context.event_name || '');
    message = message.replace(/\{\{date_rencontre\}\}/g, context.event_date || '');
    message = message.replace(/\{\{source\}\}/g, context.source || '');
  }
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

interface EmailSequencesProps {
  onCreateNew: () => void;
  onEdit: (sequence: EmailSequence) => void;
}

export default function EmailSequences({ onCreateNew, onEdit }: EmailSequencesProps) {
  const { user } = useAuth();
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<Record<string, Enrollment[]>>({});
  const [loadingEnrollments, setLoadingEnrollments] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadSequences();
  }, [user]);

  const loadSequences = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_sequences')
        .select(`
          *,
          steps:email_sequence_steps(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enriched = await Promise.all((data || []).map(async (seq: EmailSequence) => {
        const { count: total } = await supabase
          .from('email_sequence_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('sequence_id', seq.id);

        const { count: active } = await supabase
          .from('email_sequence_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('sequence_id', seq.id)
          .eq('status', 'active');

        return { ...seq, enrollments_count: total || 0, active_enrollments: active || 0 };
      }));

      setSequences(enriched);
    } catch (error) {
      console.error('Error loading sequences:', error);
      toast.error('Erreur lors du chargement des sequences');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('email_sequences')
        .update({ is_active: !currentActive })
        .eq('id', id);

      if (error) throw error;
      toast.success(currentActive ? 'Sequence desactivee' : 'Sequence activee');
      loadSequences();
    } catch (error) {
      console.error('Error toggling sequence:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette sequence et tous ses envois programmes ?')) return;
    try {
      const { error } = await supabase
        .from('email_sequences')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Sequence supprimee');
      loadSequences();
    } catch (error) {
      console.error('Error deleting sequence:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const loadEnrollments = async (sequenceId: string) => {
    setLoadingEnrollments(sequenceId);
    try {
      const { data, error } = await supabase
        .from('email_sequence_enrollments')
        .select(`
          id, contact_id, current_step, status, enrolled_at, completed_at, trigger_context,
          contact:contacts(full_name, email, phone, company),
          sends:email_sequence_sends(id, step_id, status, scheduled_for, sent_at)
        `)
        .eq('sequence_id', sequenceId)
        .order('enrolled_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setEnrollments(prev => ({ ...prev, [sequenceId]: (data as unknown as Enrollment[]) || [] }));
    } catch (error) {
      console.error('Error loading enrollments:', error);
    } finally {
      setLoadingEnrollments(null);
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (!enrollments[id]) loadEnrollments(id);
    }
  };

  const cancelEnrollment = async (enrollmentId: string, sequenceId: string) => {
    try {
      const { error } = await supabase
        .from('email_sequence_enrollments')
        .update({ status: 'cancelled' })
        .eq('id', enrollmentId);

      if (error) throw error;
      toast.success('Inscription annulee');
      loadEnrollments(sequenceId);
      loadSequences();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const formatDelay = (days: number, hours: number) => {
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}j`);
    if (hours > 0) parts.push(`${hours}h`);
    return parts.length > 0 ? parts.join(' ') : 'Immediatement';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0E3A5D]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="glass-card p-4 md:p-5 border border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Workflow className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-blue-900">Sequences automatiques</h4>
            <p className="text-xs text-blue-700 mt-0.5">
              Creez des series d'emails envoyes automatiquement lorsqu'un nouveau contact est ajoute.
              Les messages sont personnalises selon le contexte de la rencontre.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onCreateNew}
          className="flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-gradient-to-r from-[#0E3A5D] to-[#1E5A8E] text-white rounded-full hover:shadow-lg transition-all hover:scale-105 text-sm md:text-base"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          <span className="font-semibold">Creer une sequence</span>
        </button>
      </div>

      {sequences.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Workflow className="w-10 h-10 text-[#0E3A5D]" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Aucune sequence configuree</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            Creez votre premiere sequence pour automatiser l'envoi d'emails a vos nouveaux contacts.
          </p>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0E3A5D] text-white rounded-full hover:bg-[#1E5A8E] transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Creer ma premiere sequence</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {sequences.map((seq) => {
            const sortedSteps = [...(seq.steps || [])].sort((a, b) => a.step_order - b.step_order);
            const isExpanded = expandedId === seq.id;

            return (
              <div key={seq.id} className="glass-card overflow-hidden">
                <div className="p-4 md:p-6">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      seq.is_active ? 'bg-emerald-100' : 'bg-gray-100'
                    }`}>
                      <Workflow className={`w-6 h-6 md:w-7 md:h-7 ${seq.is_active ? 'text-emerald-600' : 'text-gray-400'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 truncate">{seq.name}</h3>
                          {seq.description && (
                            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{seq.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                            seq.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {seq.is_active ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
                            {seq.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <div className="relative">
                            <button
                              onClick={() => setMenuOpenId(menuOpenId === seq.id ? null : seq.id)}
                              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </button>
                            {menuOpenId === seq.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden">
                                <button
                                  onClick={() => { onEdit(seq); setMenuOpenId(null); }}
                                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Pencil className="w-4 h-4" /> Modifier
                                </button>
                                <button
                                  onClick={() => { toggleActive(seq.id, seq.is_active); setMenuOpenId(null); }}
                                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  {seq.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                  {seq.is_active ? 'Desactiver' : 'Activer'}
                                </button>
                                <button
                                  onClick={() => { handleDelete(seq.id); setMenuOpenId(null); }}
                                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" /> Supprimer
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
                          Declencheur: {STATUS_LABELS[seq.trigger_status] || seq.trigger_status}
                        </span>
                        {seq.source_filter && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium">
                            Source: {SOURCE_LABELS[seq.source_filter] || seq.source_filter}
                          </span>
                        )}
                        {seq.exclude_statuses && seq.exclude_statuses.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
                            Exclut: {seq.exclude_statuses.map(s => STATUS_LABELS[s] || s).join(', ')}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-4 h-4" />
                          <span>{sortedSteps.length} etape{sortedSteps.length > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          <span>{seq.enrollments_count || 0} contact{(seq.enrollments_count || 0) > 1 ? 's' : ''} inscrits</span>
                        </div>
                        {(seq.active_enrollments || 0) > 0 && (
                          <div className="flex items-center gap-1.5 text-emerald-600">
                            <Play className="w-4 h-4" />
                            <span>{seq.active_enrollments} en cours</span>
                          </div>
                        )}
                      </div>

                      {sortedSteps.length > 0 && (
                        <div className="mt-4 flex items-center gap-1 overflow-x-auto pb-1">
                          {sortedSteps.map((step, i) => (
                            <div key={step.id} className="flex items-center gap-1 flex-shrink-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                                step.channel === 'whatsapp' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {step.channel === 'whatsapp' ? (
                                  <MessageSquare className="w-4 h-4" />
                                ) : (
                                  <Mail className="w-4 h-4" />
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400 font-medium">{formatDelay(step.delay_days, step.delay_hours)}</span>
                              {i < sortedSteps.length - 1 && (
                                <div className="w-4 h-px bg-gray-300 mx-0.5" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleExpand(seq.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-t border-gray-100 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {isExpanded ? 'Masquer les inscriptions' : 'Voir les inscriptions'}
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-4 md:p-5">
                    {loadingEnrollments === seq.id ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0E3A5D]"></div>
                      </div>
                    ) : (enrollments[seq.id] || []).length === 0 ? (
                      <p className="text-center text-sm text-gray-500 py-4">Aucun contact inscrit pour le moment</p>
                    ) : (
                      <div className="space-y-2">
                        {(enrollments[seq.id] || []).map((enrollment) => {
                          const contactData = enrollment.contact as any;
                          const contactPhone = contactData?.phone || (enrollment as any).trigger_context?.contact_phone;
                          const hasWhatsappSteps = sortedSteps.some(s => s.channel === 'whatsapp');
                          const whatsappStep = hasWhatsappSteps ? sortedSteps.find(s => s.channel === 'whatsapp') : null;

                          return (
                          <div key={enrollment.id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-200">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-gray-600">
                                  {contactData?.full_name?.charAt(0) || '?'}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {contactData?.full_name || 'Contact inconnu'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {contactData?.email || 'Pas d\'email'}
                                  {contactData?.company && ` - ${contactData.company}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {hasWhatsappSteps && contactPhone && whatsappStep && (
                                <a
                                  href={buildWhatsAppLink(contactPhone, whatsappStep.body, (enrollment as any).trigger_context)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-[10px] font-medium hover:bg-green-100 transition-colors"
                                  title="Envoyer via WhatsApp"
                                >
                                  <MessageSquare className="w-3 h-3" /> WhatsApp
                                </a>
                              )}
                              <div className="flex items-center gap-1">
                                {(enrollment.sends || []).map((send) => (
                                  <div
                                    key={send.id}
                                    className={`w-2 h-2 rounded-full ${
                                      send.status === 'sent' ? 'bg-emerald-500' :
                                      send.status === 'failed' ? 'bg-red-500' :
                                      send.status === 'skipped' ? 'bg-gray-400' :
                                      'bg-blue-300'
                                    }`}
                                    title={`${send.status} - ${new Date(send.scheduled_for).toLocaleDateString('fr-FR')}`}
                                  />
                                ))}
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                enrollment.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                enrollment.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                enrollment.status === 'cancelled' ? 'bg-gray-100 text-gray-600' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {enrollment.status === 'active' ? 'En cours' :
                                 enrollment.status === 'completed' ? 'Termine' :
                                 enrollment.status === 'cancelled' ? 'Annule' : 'En pause'}
                              </span>
                              {enrollment.status === 'active' && (
                                <button
                                  onClick={() => cancelEnrollment(enrollment.id, seq.id)}
                                  className="p-1 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Annuler"
                                >
                                  <XCircle className="w-4 h-4 text-red-400 hover:text-red-600" />
                                </button>
                              )}
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
