import { useState, useEffect } from 'react';
import { X, Mail, Calendar, Clock, Users, Eye, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface Contact {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  company: string | null;
}

interface ScheduleEmailModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ScheduleEmailModal({ onClose, onSuccess }: ScheduleEmailModalProps) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      loadContacts();
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduledDate(tomorrow.toISOString().split('T')[0]);
    const currentHour = new Date().getHours();
    setScheduledTime(`${String(currentHour + 1).padStart(2, '0')}:00`);
  }, [user]);

  const loadContacts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, full_name, email, avatar_url, company')
        .eq('user_id', user.id)
        .not('email', 'is', null)
        .order('full_name');

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error('Erreur lors du chargement des contacts');
    }
  };

  const toggleContact = (contactId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedContacts.length === 0) {
      toast.error('Veuillez sélectionner au moins un destinataire');
      return;
    }

    if (!subject.trim()) {
      toast.error('Veuillez saisir un sujet');
      return;
    }

    if (!body.trim()) {
      toast.error('Veuillez saisir un message');
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      toast.error('Veuillez définir une date et heure d\'envoi');
      return;
    }

    const [year, month, day] = scheduledDate.split('-').map(Number);
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const scheduledFor = new Date(year, month - 1, day, hours, minutes, 0);

    if (scheduledFor <= new Date()) {
      toast.error('La date d\'envoi doit être dans le futur');
      return;
    }

    setLoading(true);

    try {
      const { data: scheduledEmail, error: emailError } = await supabase
        .from('scheduled_emails')
        .insert({
          user_id: user!.id,
          subject: subject.trim(),
          body: body.trim(),
          scheduled_for: scheduledFor.toISOString(),
          status: 'pending'
        })
        .select()
        .single();

      if (emailError) throw emailError;

      const selectedContactsData = contacts.filter(c => selectedContacts.includes(c.id));
      const recipients = selectedContactsData.map(contact => ({
        scheduled_email_id: scheduledEmail.id,
        contact_id: contact.id,
        email: contact.email,
        status: 'pending'
      }));

      const { error: recipientsError } = await supabase
        .from('scheduled_email_recipients')
        .insert(recipients);

      if (recipientsError) throw recipientsError;

      toast.success('Relance planifiée avec succès');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error scheduling email:', error);
      toast.error('Erreur lors de la planification');
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.company?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const selectedContactsData = contacts.filter(c => selectedContacts.includes(c.id));

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#0E3A5D] to-[#1E5A8E] rounded-2xl flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Planifier une relance</h2>
              <p className="text-sm text-gray-600">Envoyez un email à vos contacts à la date souhaitée</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        {!showPreview ? (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Recipients Section */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Destinataires ({selectedContacts.length} sélectionné{selectedContacts.length > 1 ? 's' : ''})
              </label>

              {/* Selected Contacts Preview */}
              {selectedContacts.length > 0 && (
                <div className="mb-4 p-4 bg-blue-50 rounded-2xl">
                  <div className="flex flex-wrap gap-2">
                    {selectedContactsData.map(contact => (
                      <div
                        key={contact.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full text-sm"
                      >
                        {contact.avatar_url ? (
                          <img
                            src={contact.avatar_url}
                            alt={contact.full_name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[#0E3A5D] text-white text-xs flex items-center justify-center">
                            {getInitials(contact.full_name)}
                          </div>
                        )}
                        <span className="font-medium">{contact.full_name}</span>
                        <button
                          type="button"
                          onClick={() => toggleContact(contact.id)}
                          className="hover:bg-gray-100 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search */}
              <input
                type="text"
                placeholder="Rechercher un contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-modern mb-3"
              />

              {/* Contacts List */}
              <div className="border-2 border-gray-200 rounded-2xl max-h-48 overflow-y-auto">
                {filteredContacts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>Aucun contact trouvé</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredContacts.map((contact) => (
                      <label
                        key={contact.id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedContacts.includes(contact.id)}
                          onChange={() => toggleContact(contact.id)}
                          className="w-5 h-5 rounded border-gray-300 text-[#0E3A5D] focus:ring-[#0E3A5D]"
                        />
                        {contact.avatar_url ? (
                          <img
                            src={contact.avatar_url}
                            alt={contact.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0E3A5D] to-[#1E5A8E] text-white flex items-center justify-center">
                            {getInitials(contact.full_name)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{contact.full_name}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="truncate">{contact.email}</span>
                            {contact.company && (
                              <>
                                <span>•</span>
                                <span className="truncate">{contact.company}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Sujet de l'email
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Suivi de notre rencontre"
                className="input-modern"
                required
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Message
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Écrivez votre message ici..."
                rows={8}
                className="input-modern resize-none"
                required
              />
              <p className="mt-2 text-sm text-gray-600">
                Le message sera envoyé dans un template professionnel aux couleurs de votre marque.
              </p>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Date d'envoi
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="input-modern pl-12"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Heure d'envoi (heure locale)
                </label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="input-modern pl-12"
                    required
                  />
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              L'email sera envoyé à l'heure locale indiquée (fuseau horaire actuel : {Intl.DateTimeFormat().resolvedOptions().timeZone})
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-[#0E3A5D] text-[#0E3A5D] rounded-full font-semibold hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-5 h-5" />
                Prévisualiser
              </button>
              <button
                type="submit"
                disabled={loading || selectedContacts.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0E3A5D] to-[#1E5A8E] text-white rounded-full font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Planifier
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Prévisualisation de l'email</h3>
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 max-h-[500px] overflow-y-auto">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-2xl mx-auto">
                  {/* Email Header */}
                  <div className="bg-gradient-to-r from-[#0E3A5D] to-[#1E5A8E] p-8 text-white">
                    <h1 className="text-2xl font-bold truncate">{subject}</h1>
                  </div>

                  {/* Email Body */}
                  <div className="p-8 max-h-[300px] overflow-y-auto">
                    <div className="prose prose-blue max-w-none">
                      <p style={{ whiteSpace: 'pre-line' }} className="text-gray-700 leading-relaxed">
                        {body}
                      </p>
                    </div>
                  </div>

                  {/* Email Footer */}
                  <div className="bg-gray-50 p-6 text-center text-sm text-gray-600 border-t border-gray-200">
                    <p>&copy; {new Date().getFullYear()} Scanetwork. Tous droits réservés.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0E3A5D] to-[#1E5A8E] text-white rounded-full font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Confirmer et planifier
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
