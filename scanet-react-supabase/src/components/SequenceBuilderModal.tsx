import { useState, useEffect } from 'react';
import {
  X, Workflow, Plus, Trash2, Mail, MessageSquare, GripVertical,
  ChevronDown, Clock, Package, Info
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import type { EmailSequence, SequenceStep } from './EmailSequences';

const STATUS_OPTIONS = [
  { value: 'lead', label: 'Lead' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'client', label: 'Client' },
  { value: 'partner', label: 'Partenaire' },
  { value: 'collaborateur', label: 'Collaborateur' },
  { value: 'ami', label: 'Ami' },
  { value: 'fournisseur', label: 'Fournisseur' },
];

const SOURCE_OPTIONS = [
  { value: '', label: 'Toutes les sources' },
  { value: 'event', label: 'Evenement' },
  { value: 'referral', label: 'Recommandation' },
  { value: 'cold_outreach', label: 'Prospection' },
  { value: 'team', label: 'Equipe' },
];

const TEMPLATE_VARIABLES = [
  { var: '{{prenom}}', desc: 'Prenom du contact' },
  { var: '{{nom_complet}}', desc: 'Nom complet du contact' },
  { var: '{{entreprise}}', desc: 'Entreprise du contact' },
  { var: '{{evenement}}', desc: 'Nom de l\'evenement' },
  { var: '{{date_rencontre}}', desc: 'Date de rencontre' },
  { var: '{{source}}', desc: 'Source du contact' },
  { var: '{{mon_nom}}', desc: 'Votre nom' },
];

interface StepDraft {
  id?: string;
  step_order: number;
  delay_days: number;
  delay_hours: number;
  subject: string;
  body: string;
  channel: 'email' | 'whatsapp';
  include_offer_id: string | null;
}

interface Offer {
  id: string;
  title: string;
  price: number;
  currency: string;
}

interface SequenceBuilderModalProps {
  onClose: () => void;
  onSuccess: () => void;
  editSequence?: EmailSequence | null;
}

export default function SequenceBuilderModal({ onClose, onSuccess, editSequence }: SequenceBuilderModalProps) {
  const { user } = useAuth();

  const [name, setName] = useState(editSequence?.name || '');
  const [description, setDescription] = useState(editSequence?.description || '');
  const [triggerStatus, setTriggerStatus] = useState(editSequence?.trigger_status || 'lead');
  const [sourceFilter, setSourceFilter] = useState(editSequence?.source_filter || '');
  const [excludeStatuses, setExcludeStatuses] = useState<string[]>(
    (editSequence?.exclude_statuses || []).filter(s => s !== (editSequence?.trigger_status || 'lead'))
  );
  const [steps, setSteps] = useState<StepDraft[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [saving, setSaving] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);

  useEffect(() => {
    setExcludeStatuses(prev => prev.filter(s => s !== triggerStatus));
  }, [triggerStatus]);

  useEffect(() => {
    loadOffers();
    if (editSequence?.steps) {
      setSteps(
        [...editSequence.steps]
          .sort((a, b) => a.step_order - b.step_order)
          .map(s => ({
            id: s.id,
            step_order: s.step_order,
            delay_days: s.delay_days,
            delay_hours: s.delay_hours,
            subject: s.subject,
            body: s.body,
            channel: s.channel,
            include_offer_id: s.include_offer_id,
          }))
      );
    } else {
      setSteps([{
        step_order: 1,
        delay_days: 0,
        delay_hours: 1,
        subject: 'Ravi de vous avoir rencontre, {{prenom}}',
        body: 'Bonjour {{prenom}},\n\nJ\'espere que vous allez bien. C\'etait un plaisir de vous rencontrer.\n\nN\'hesitez pas a me contacter si vous avez des questions.\n\nCordialement,\n{{mon_nom}}',
        channel: 'email',
        include_offer_id: null,
      }]);
    }
  }, [editSequence]);

  const loadOffers = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('offers')
      .select('id, title, price, currency')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('title');
    setOffers(data || []);
  };

  const addStep = () => {
    const lastStep = steps[steps.length - 1];
    setSteps([...steps, {
      step_order: steps.length + 1,
      delay_days: lastStep ? 3 : 0,
      delay_hours: 0,
      subject: '',
      body: '',
      channel: 'email',
      include_offer_id: null,
    }]);
    setActiveStepIndex(steps.length);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    const newSteps = steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, step_order: i + 1 }));
    setSteps(newSteps);
    if (activeStepIndex === index) setActiveStepIndex(null);
    else if (activeStepIndex !== null && activeStepIndex > index) setActiveStepIndex(activeStepIndex - 1);
  };

  const updateStep = (index: number, updates: Partial<StepDraft>) => {
    setSteps(steps.map((s, i) => i === index ? { ...s, ...updates } : s));
  };

  const toggleExclude = (status: string) => {
    setExcludeStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const handleSave = async () => {
    if (!user || !name || steps.length === 0) return;

    const invalidSteps = steps.filter(s => s.channel === 'email' && (!s.subject || !s.body));
    if (invalidSteps.length > 0) {
      toast.error('Tous les emails doivent avoir un objet et un message');
      return;
    }
    const invalidWhatsapp = steps.filter(s => s.channel === 'whatsapp' && !s.body);
    if (invalidWhatsapp.length > 0) {
      toast.error('Tous les messages WhatsApp doivent avoir un contenu');
      return;
    }

    setSaving(true);
    try {
      if (editSequence) {
        const { error: seqError } = await supabase
          .from('email_sequences')
          .update({
            name,
            description: description || null,
            trigger_status: triggerStatus,
            source_filter: sourceFilter || null,
            exclude_statuses: excludeStatuses,
          })
          .eq('id', editSequence.id);
        if (seqError) throw seqError;

        const { error: delError } = await supabase
          .from('email_sequence_steps')
          .delete()
          .eq('sequence_id', editSequence.id);
        if (delError) throw delError;

        const stepsToInsert = steps.map((s, i) => ({
          sequence_id: editSequence.id,
          step_order: i + 1,
          delay_days: s.delay_days,
          delay_hours: s.delay_hours,
          subject: s.subject,
          body: s.body,
          channel: s.channel,
          include_offer_id: s.include_offer_id || null,
        }));

        const { error: stepsError } = await supabase
          .from('email_sequence_steps')
          .insert(stepsToInsert);
        if (stepsError) throw stepsError;

        toast.success('Sequence modifiee');
      } else {
        const { data: newSeq, error: seqError } = await supabase
          .from('email_sequences')
          .insert({
            user_id: user.id,
            name,
            description: description || null,
            trigger_status: triggerStatus,
            source_filter: sourceFilter || null,
            exclude_statuses: excludeStatuses,
          })
          .select('id')
          .maybeSingle();
        if (seqError) throw seqError;
        if (!newSeq) throw new Error('No sequence created');

        const stepsToInsert = steps.map((s, i) => ({
          sequence_id: newSeq.id,
          step_order: i + 1,
          delay_days: s.delay_days,
          delay_hours: s.delay_hours,
          subject: s.subject,
          body: s.body,
          channel: s.channel,
          include_offer_id: s.include_offer_id || null,
        }));

        const { error: stepsError } = await supabase
          .from('email_sequence_steps')
          .insert(stepsToInsert);
        if (stepsError) throw stepsError;

        toast.success('Sequence creee');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving sequence:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const getCumulativeDelay = (index: number) => {
    let totalDays = 0;
    let totalHours = 0;
    for (let i = 0; i <= index; i++) {
      totalDays += steps[i].delay_days;
      totalHours += steps[i].delay_hours;
    }
    totalDays += Math.floor(totalHours / 24);
    totalHours = totalHours % 24;
    const parts: string[] = [];
    if (totalDays > 0) parts.push(`${totalDays} jour${totalDays > 1 ? 's' : ''}`);
    if (totalHours > 0) parts.push(`${totalHours}h`);
    return parts.length > 0 ? parts.join(' ') : 'Immediatement';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Workflow className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {editSequence ? 'Modifier la sequence' : 'Nouvelle sequence'}
              </h2>
              <p className="text-xs text-gray-500">Automatisez vos emails de suivi</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom de la sequence</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                placeholder="Ex: Suivi lead evenement"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description (optionnel)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                placeholder="Serie de 3 emails pour les leads issus d'evenements"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-bold text-gray-800">Conditions de declenchement</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Statut du contact</label>
                <div className="relative">
                  <select
                    value={triggerStatus}
                    onChange={(e) => setTriggerStatus(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  >
                    {STATUS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Source (optionnel)</label>
                <div className="relative">
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  >
                    {SOURCE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Exclure ces types de relation</label>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.filter(o => o.value !== triggerStatus).map(o => (
                  <button
                    key={o.value}
                    onClick={() => toggleExclude(o.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      excludeStatuses.includes(o.value)
                        ? 'bg-red-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Ex: exclure "Fournisseur" pour ne pas envoyer d'offres commerciales
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-800">Etapes de la sequence</h3>
              <button
                onClick={() => setShowVariables(!showVariables)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
                Variables disponibles
              </button>
            </div>

            {showVariables && (
              <div className="mb-4 bg-blue-50 rounded-xl p-3 border border-blue-100">
                <p className="text-xs font-semibold text-blue-800 mb-2">Utilisez ces variables dans vos messages :</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {TEMPLATE_VARIABLES.map(v => (
                    <div key={v.var} className="flex items-center gap-2">
                      <code className="text-xs bg-white px-1.5 py-0.5 rounded text-blue-700 font-mono">{v.var}</code>
                      <span className="text-[11px] text-blue-600">{v.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {steps.map((step, index) => {
                const isActive = activeStepIndex === index;
                return (
                  <div
                    key={index}
                    className={`border rounded-xl transition-all ${
                      isActive ? 'border-blue-300 bg-blue-50/30 shadow-sm' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer"
                      onClick={() => setActiveStepIndex(isActive ? null : index)}
                    >
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <GripVertical className="w-4 h-4 text-gray-300" />
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          step.channel === 'whatsapp' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {step.channel === 'whatsapp' ? (
                            <MessageSquare className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                          ) : (
                            <Mail className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                          )}
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {step.subject || (step.channel === 'whatsapp' ? 'Message WhatsApp' : 'Email sans objet')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">Apres {getCumulativeDelay(index)}</span>
                          {step.include_offer_id && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                              <Package className="w-3 h-3" /> Offre jointe
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {steps.length > 1 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); removeStep(index); }}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
                          </button>
                        )}
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isActive ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {isActive && (
                      <div className="px-3 pb-4 pt-1 space-y-3 border-t border-gray-100">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Canal</label>
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateStep(index, { channel: 'email' })}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                                  step.channel === 'email' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                <Mail className="w-3.5 h-3.5" /> Email
                              </button>
                              <button
                                onClick={() => updateStep(index, { channel: 'whatsapp' })}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                                  step.channel === 'whatsapp' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Delai (jours)</label>
                            <input
                              type="number"
                              min="0"
                              value={step.delay_days}
                              onChange={(e) => updateStep(index, { delay_days: parseInt(e.target.value) || 0 })}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Delai (heures)</label>
                            <input
                              type="number"
                              min="0"
                              max="23"
                              value={step.delay_hours}
                              onChange={(e) => updateStep(index, { delay_hours: parseInt(e.target.value) || 0 })}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                            />
                          </div>
                        </div>

                        {step.channel === 'email' && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Objet de l'email</label>
                            <input
                              type="text"
                              value={step.subject}
                              onChange={(e) => updateStep(index, { subject: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                              placeholder="Ravi de vous avoir rencontre, {{prenom}}"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            {step.channel === 'whatsapp' ? 'Message WhatsApp' : 'Corps du message'}
                          </label>
                          <textarea
                            value={step.body}
                            onChange={(e) => updateStep(index, { body: e.target.value })}
                            rows={5}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
                            placeholder={step.channel === 'whatsapp'
                              ? 'Bonjour {{prenom}}, suite a notre rencontre...'
                              : 'Bonjour {{prenom}},\n\nJ\'espere que vous allez bien...'
                            }
                          />
                        </div>

                        {step.channel === 'email' && offers.length > 0 && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Joindre une offre (optionnel)</label>
                            <div className="relative">
                              <select
                                value={step.include_offer_id || ''}
                                onChange={(e) => updateStep(index, { include_offer_id: e.target.value || null })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                              >
                                <option value="">Aucune offre</option>
                                {offers.map(o => (
                                  <option key={o.id} value={o.id}>{o.title} - {o.price} {o.currency}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                onClick={addStep}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all"
              >
                <Plus className="w-4 h-4" />
                Ajouter une etape
              </button>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700">
                <p className="font-semibold mb-1">Fonctionnement</p>
                <p>
                  Quand un nouveau contact est ajoute avec le statut "{STATUS_OPTIONS.find(s => s.value === triggerStatus)?.label}"
                  {sourceFilter ? ` via "${SOURCE_OPTIONS.find(s => s.value === sourceFilter)?.label}"` : ''},
                  il recevra automatiquement cette serie de {steps.length} message{steps.length > 1 ? 's' : ''}.
                  {steps.some(s => s.channel === 'whatsapp') && ' Les etapes WhatsApp genereront un lien d\'envoi rapide.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-5 flex gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!name || steps.length === 0 || saving}
            className="flex-1 px-4 py-2.5 bg-[#0E3A5D] text-white rounded-xl text-sm font-semibold hover:bg-[#1e5a8e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Enregistrement...' : editSequence ? 'Modifier' : 'Creer la sequence'}
          </button>
        </div>
      </div>
    </div>
  );
}
