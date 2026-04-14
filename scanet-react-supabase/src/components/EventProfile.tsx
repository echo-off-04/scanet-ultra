import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, MapPin, Users, TrendingUp, Target, Eye, CreditCard as Edit, Save, X, Camera, Trash2, UserPlus, BarChart3, Clock, CheckCircle, AlertCircle, Plus, Mail, Phone, Building2, Percent, MessageCircle, ChevronUp, ChevronDown, QrCode } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useKpis } from '../contexts/KpiContext';
import { useNotifications } from '../contexts/NotificationContext';
import { AddContactModal } from './AddContactModal';
import { EventObjectives } from './EventObjectives';
import { EventQRCodeModal } from './EventQRCodeModal';
import { syncEventKpis, updateEventPeopleApproached } from '../lib/eventKpis';

interface EventProfileProps {
  eventId: string;
  onBack: () => void;
  onContactSelect: (contactId: string) => void;
}

interface Event {
  id: string;
  name: string;
  description: string | null;
  category: string;
  event_type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  image_url: string | null;
  target_participants: number;
  actual_participants: number;
  people_approached: number;
  contacts_added: number;
  conversion_rate: number;
  leads_generated: number;
  primary_objective: string | null;
  secondary_objectives: string[] | null;
  target_audience: string[] | null;
  budget: number;
  revenue: number;
  qr_code_token: string | null;
  created_at: string;
  updated_at: string;
}

interface Contact {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  avatar_url: string | null;
  status: string | null;
  rating: number | null;
  created_at: string;
}

interface ContactEvent {
  id: string;
  contact_id: string;
  event_id: string;
  created_at: string;
  contacts: Contact;
}

const CATEGORIES = [
  { value: 'conference', label: 'Conférence' },
  { value: 'seminar', label: 'Séminaire' },
  { value: 'networking', label: 'Networking' },
  { value: 'salon', label: 'Salon' },
  { value: 'gala', label: 'Gala' },
  { value: 'meetup', label: 'Meetup' },
];

const EVENT_TYPES = [
  { value: 'presentiel', label: 'Présentiel' },
  { value: 'online', label: 'En ligne' },
  { value: 'hybride', label: 'Hybride' },
];

const STATUS_OPTIONS = [
  { value: 'upcoming', label: 'À venir', color: 'bg-blue-100 text-blue-800' },
  { value: 'ongoing', label: 'En cours', color: 'bg-green-100 text-green-800' },
  { value: 'completed', label: 'Terminé', color: 'bg-gray-100 text-gray-800' },
  { value: 'cancelled', label: 'Annulé', color: 'bg-red-100 text-red-800' },
];

const calculateEventStatus = (event: Event): string => {
  if (event.status === 'cancelled') return 'cancelled';

  const now = new Date();
  const startDate = event.start_date ? new Date(event.start_date) : null;
  const endDate = event.end_date ? new Date(event.end_date) : null;

  if (!startDate) return 'upcoming';

  if (endDate && now > endDate) {
    return 'completed';
  }

  if (now >= startDate && (!endDate || now <= endDate)) {
    return 'ongoing';
  }

  if (now < startDate) {
    return 'upcoming';
  }

  return 'upcoming';
};

export function EventProfile({ eventId, onBack, onContactSelect }: EventProfileProps) {
  const { user } = useAuth();
  const { refreshKpis, refreshEvents } = useKpis();
  const { showToast } = useNotifications();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState<Partial<Event>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [eventContacts, setEventContacts] = useState<ContactEvent[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showContactFormModal, setShowContactFormModal] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [objectives, setObjectives] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    loadEvent();
    loadEventContacts();
    loadObjectives();

    const contactEventsSubscription = supabase
      .channel(`contact_events:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_events',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          loadEventContacts();
          loadEvent();
        }
      )
      .subscribe();

    const eventsSubscription = supabase
      .channel(`events:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`,
        },
        () => {
          loadEvent();
        }
      )
      .subscribe();

    return () => {
      contactEventsSubscription.unsubscribe();
      eventsSubscription.unsubscribe();
    };
  }, [eventId]);

  useEffect(() => {
    if (user) {
      loadAllContacts();
    }
  }, [user]);

  const loadEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .maybeSingle();

      if (error) throw error;
      setEvent(data);
      setEditedEvent(data || {});
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEventContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_events')
        .select('*, contacts(*)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEventContacts(data || []);

      await syncEventKpis(eventId);
      await refreshEvents();
    } catch (error) {
      console.error('Error loading event contacts:', error);
    }
  };

  const loadAllContacts = async () => {
    if (!user) return;
    try {
      setLoadingContacts(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('id, full_name, email, phone, company, job_title, avatar_url, status, rating, created_at')
        .eq('user_id', user.id)
        .order('full_name');

      if (error) throw error;
      setAllContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoadingContacts(false);
    }
  };

  const loadObjectives = async () => {
    try {
      const { data, error } = await supabase
        .from('event_objectives')
        .select('*')
        .eq('event_id', eventId);

      if (error) throw error;
      setObjectives(data || []);
    } catch (error) {
      console.error('Error loading objectives:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user || !event) return;

    try {
      setLoading(true);

      let imageUrl = editedEvent.image_url;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(filePath, imageFile);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('event-images')
            .getPublicUrl(filePath);
          imageUrl = publicUrl;
        }
      }

      const { error } = await supabase
        .from('events')
        .update({
          ...editedEvent,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId);

      if (error) throw error;

      await loadEvent();
      await refreshEvents();
      setIsEditing(false);
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Error saving event:', error);
      showToast('Erreur', 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      onBack();
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast('Erreur', 'Erreur lors de la suppression', 'error');
    }
  };

  const handleOpenAddContactModal = async () => {
    setShowAddContactModal(true);
    await loadAllContacts();
  };

  const handleAddContacts = async () => {
    if (selectedContactIds.size === 0) return;

    try {
      const contactsToAdd = Array.from(selectedContactIds).map(contactId => ({
        event_id: eventId,
        contact_id: contactId,
      }));

      const { error } = await supabase
        .from('contact_events')
        .insert(contactsToAdd);

      if (error) throw error;

      await syncEventKpis(eventId);
      await loadEventContacts();
      await loadEvent();
      await refreshKpis();
      setShowAddContactModal(false);
      setSelectedContactIds(new Set());
      setSearchQuery('');
    } catch (error) {
      console.error('Error adding contacts:', error);
      showToast('Erreur', 'Erreur lors de l\'ajout des contacts', 'error');
    }
  };

  const handleRemoveContact = async (contactEventId: string) => {
    if (!confirm('Retirer ce contact de l\'événement ?')) return;

    try {
      const { error } = await supabase
        .from('contact_events')
        .delete()
        .eq('id', contactEventId);

      if (error) throw error;

      await syncEventKpis(eventId);
      await loadEventContacts();
      await loadEvent();
      await refreshKpis();
    } catch (error) {
      console.error('Error removing contact:', error);
      showToast('Erreur', 'Erreur lors de la suppression', 'error');
    }
  };

  const updatePeopleApproached = async (increment: number) => {
    if (!event) return;

    const newValue = Math.max(0, (event.people_approached || 0) + increment);

    try {
      await updateEventPeopleApproached(eventId, newValue);
      await loadEvent();
      await refreshEvents();
    } catch (error) {
      console.error('Error updating people approached:', error);
      showToast('Erreur', 'Erreur lors de la mise à jour', 'error');
    }
  };

  const handleShowQRModal = async () => {
    if (!event) return;

    if (!event.qr_code_token) {
      try {
        const qrToken = crypto.randomUUID();
        const { error } = await supabase
          .from('events')
          .update({ qr_code_token: qrToken })
          .eq('id', eventId);

        if (error) throw error;

        await loadEvent();
      } catch (error) {
        console.error('Error generating QR token:', error);
        showToast('Erreur', 'Erreur lors de la génération du code QR', 'error');
        return;
      }
    }

    setShowQRModal(true);
  };

  const toggleContactSelection = (contactId: string) => {
    const newSelection = new Set(selectedContactIds);
    if (newSelection.has(contactId)) {
      newSelection.delete(contactId);
    } else {
      newSelection.add(contactId);
    }
    setSelectedContactIds(newSelection);
  };

  const getAvailableContacts = () => {
    const eventContactIds = new Set(eventContacts.map(ec => ec.contact_id));
    return allContacts.filter(contact =>
      !eventContactIds.has(contact.id) &&
      (searchQuery === '' ||
       contact.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       contact.company?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-gray-600">Événement non trouvé</p>
        <button
          onClick={onBack}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Retour
        </button>
      </div>
    );
  }

  const calculatedStatus = calculateEventStatus(event);
  const statusInfo = STATUS_OPTIONS.find(s => s.value === calculatedStatus);
  const categoryLabel = CATEGORIES.find(c => c.value === event.category)?.label || event.category;
  const eventTypeLabel = EVENT_TYPES.find(t => t.value === event.event_type)?.label || event.event_type;

  // Calculs des métriques avancées
  const actualContactsCount = eventContacts.length;

  // Calculer le nombre cible à partir des objectifs de type people_count
  const targetFromObjectives = objectives
    .filter(obj => obj.metric_type === 'people_count')
    .reduce((sum, obj) => sum + (obj.target_value || 0), 0);

  const targetParticipants = targetFromObjectives > 0 ? targetFromObjectives : event.target_participants;

  // Conversion = contacts enregistrés / personnes approchées
  const conversionRate = event.people_approached > 0
    ? ((actualContactsCount / event.people_approached) * 100).toFixed(1)
    : '0';

  const approachRate = targetParticipants > 0
    ? ((event.people_approached / targetParticipants) * 100).toFixed(1)
    : '0';

  // Qualité = score moyen des contacts basé sur leur rating (0-5 étoiles converti en %)
  const contactQualityRate = actualContactsCount > 0
    ? (() => {
        const contactsWithRating = eventContacts.filter(ec => ec.contacts.rating != null && ec.contacts.rating > 0);
        if (contactsWithRating.length === 0) return '0';
        const averageRating = contactsWithRating.reduce((sum, ec) => sum + (ec.contacts.rating || 0), 0) / contactsWithRating.length;
        return ((averageRating / 5) * 100).toFixed(1);
      })()
    : '0';

  const roi = event.budget > 0
    ? (((event.revenue - event.budget) / event.budget) * 100).toFixed(1)
    : '0';

  const costPerContact = actualContactsCount > 0
    ? (event.budget / actualContactsCount).toFixed(2)
    : '0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Header avec image de couverture */}
      <div className="relative h-48 sm:h-56 md:h-64 bg-gradient-to-r from-blue-600 to-blue-800">
        {(imagePreview || event.image_url) && (
          <img
            src={imagePreview || event.image_url || ''}
            alt={event.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

        <div className="absolute top-3 sm:top-4 md:top-6 left-3 sm:left-4 md:left-6 right-3 sm:right-4 md:right-6 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
            <button
              onClick={onBack}
              className="p-1.5 sm:p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
            </button>
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-white drop-shadow-lg truncate">Détail de l'événement</h1>
          </div>

          <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedEvent(event);
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="p-1.5 sm:p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                </button>
                <button
                  onClick={handleSave}
                  className="p-1.5 sm:p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-all shadow-lg"
                >
                  <Save className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleShowQRModal}
                  className="p-1.5 sm:p-2 bg-indigo-600 rounded-full hover:bg-indigo-700 transition-all shadow-lg"
                  title="Générer le code QR"
                >
                  <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 sm:p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg"
                >
                  <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1.5 sm:p-2 bg-red-600 rounded-full hover:bg-red-700 transition-all shadow-lg"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 left-3 sm:left-4 md:left-6 right-3 sm:right-4 md:right-6">
          {isEditing ? (
            <input
              type="text"
              value={editedEvent.name || ''}
              onChange={(e) => setEditedEvent({ ...editedEvent, name: e.target.value })}
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white bg-white/10 backdrop-blur-sm rounded-lg px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 w-full border-2 border-white/30"
            />
          ) : (
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 truncate">{event.name}</h1>
          )}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
            <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${statusInfo?.color || 'bg-gray-100 text-gray-800'}`}>
              {statusInfo?.label || event.status}
            </span>
            <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-white/20 backdrop-blur-sm text-white">
              {categoryLabel}
            </span>
            <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-white/20 backdrop-blur-sm text-white">
              {eventTypeLabel}
            </span>
          </div>
        </div>

        {isEditing && (
          <label className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 md:bottom-6 md:right-6 p-2 sm:p-3 bg-white rounded-full hover:bg-gray-100 cursor-pointer transition-all shadow-lg">
            <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Warning si target_participants n'est pas défini */}
        {(!event.target_participants || event.target_participants === 0) && !isEditing && (
          <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900 mb-1">
                Nombre de participants cible non défini
              </h3>
              <p className="text-sm text-amber-800 mb-2">
                Pour obtenir des statistiques précises et suivre les performances de votre événement, veuillez définir le nombre approximatif de participants que vous souhaitez atteindre.
              </p>
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm font-semibold text-amber-900 hover:text-amber-950 underline"
              >
                Définir maintenant
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Statistiques clés */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Statistiques de performance
              </h2>

              {/* Barre de progression des participants */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-sky-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Progression des participants</span>
                  <span className="text-sm font-bold text-gray-900">
                    {actualContactsCount} / {targetParticipants}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      calculatedStatus === 'completed'
                        ? 'bg-gray-400'
                        : calculatedStatus === 'ongoing'
                        ? 'bg-green-500'
                        : calculatedStatus === 'cancelled'
                        ? 'bg-red-400'
                        : 'bg-blue-500'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        targetParticipants > 0 ? (actualContactsCount / targetParticipants) * 100 : 0
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusInfo?.color || 'bg-gray-100 text-gray-800'}`}>
                    {statusInfo?.label || calculatedStatus}
                  </span>
                  <span className="text-xs text-gray-600">
                    {targetParticipants > 0 ? Math.round((actualContactsCount / targetParticipants) * 100) : 0}% complété
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="text-3xl font-bold text-blue-600 flex items-center justify-center gap-2">
                    <button
                      onClick={() => updatePeopleApproached(-1)}
                      className="p-1 hover:bg-blue-100 rounded transition-colors"
                      title="Décrémenter"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                    <span>{event.people_approached || 0}</span>
                    <button
                      onClick={() => updatePeopleApproached(1)}
                      className="p-1 hover:bg-blue-100 rounded transition-colors"
                      title="Incrémenter"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 mt-1 flex items-center justify-center gap-1">
                    <Eye className="w-4 h-4" />
                    Approchées
                  </div>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="text-3xl font-bold text-green-600">
                    {actualContactsCount}
                  </div>
                  <div className="text-sm text-gray-600 mt-1 flex items-center justify-center gap-1">
                    <UserPlus className="w-4 h-4" />
                    Cartes de visite enregistrées
                  </div>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <div className="text-3xl font-bold text-purple-600">
                    {conversionRate}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1 flex items-center justify-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Conversion
                  </div>
                </div>

                <div className="text-center p-4 bg-amber-50 rounded-xl">
                  <div className="text-3xl font-bold text-amber-600">
                    {targetParticipants || 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1 flex items-center justify-center gap-1">
                    <Target className="w-4 h-4" />
                    Cible
                  </div>
                </div>
              </div>

              {/* Métriques avancées */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Percent className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Taux d'approche</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{approachRate}%</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CheckCircle className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Qualité</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{contactQualityRate}%</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">ROI</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{roi}%</div>
                </div>
              </div>
            </div>

            {/* Contacts de l'événement */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Contacts enregistrés ({actualContactsCount})
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowContactFormModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all text-sm font-semibold"
                  >
                    <UserPlus className="w-4 h-4" />
                    Créer
                  </button>
                  <button
                    onClick={handleOpenAddContactModal}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-semibold"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
                </div>
              </div>

              {eventContacts.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aucun contact associé à cet événement</p>
                  <button
                    onClick={handleOpenAddContactModal}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Ajouter des contacts
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {eventContacts.map((ec) => (
                    <div
                      key={ec.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                    >
                      <button
                        onClick={() => onContactSelect(ec.contact_id)}
                        className="flex items-center gap-4 flex-1 min-w-0 text-left"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold">
                          {ec.contacts.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 hover:text-blue-600">{ec.contacts.full_name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            {ec.contacts.company && (
                              <span className="text-sm text-gray-600 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {ec.contacts.company}
                              </span>
                            )}
                            {ec.contacts.job_title && (
                              <span className="text-sm text-gray-500">{ec.contacts.job_title}</span>
                            )}
                          </div>
                        </div>
                      </button>
                      <div className="flex items-center gap-2">
                        {ec.contacts.email && (
                          <a
                            href={`mailto:${ec.contacts.email}`}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title={ec.contacts.email}
                          >
                            <Mail className="w-4 h-4" />
                          </a>
                        )}
                        {ec.contacts.phone && (
                          <>
                            <a
                              href={`tel:${ec.contacts.phone}`}
                              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                              title={ec.contacts.phone}
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                            <a
                              href={`https://wa.me/${ec.contacts.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          </>
                        )}
                        <button
                          onClick={() => handleRemoveContact(ec.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
              {isEditing ? (
                <textarea
                  value={editedEvent.description || ''}
                  onChange={(e) => setEditedEvent({ ...editedEvent, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={6}
                  placeholder="Description de l'événement..."
                />
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">
                  {event.description || 'Aucune description'}
                </p>
              )}
            </div>

            {/* Objectifs mesurables */}
            <EventObjectives eventId={eventId} />
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Dates */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Dates
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Début</label>
                  {isEditing ? (
                    <input
                      type="datetime-local"
                      value={editedEvent.start_date?.slice(0, 16) || ''}
                      onChange={(e) => setEditedEvent({ ...editedEvent, start_date: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {event.start_date ? new Date(event.start_date).toLocaleString('fr-FR') : 'Non défini'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Fin</label>
                  {isEditing ? (
                    <input
                      type="datetime-local"
                      value={editedEvent.end_date?.slice(0, 16) || ''}
                      onChange={(e) => setEditedEvent({ ...editedEvent, end_date: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {event.end_date ? new Date(event.end_date).toLocaleString('fr-FR') : 'Non défini'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Lieu */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Lieu
              </h2>
              {isEditing ? (
                <input
                  type="text"
                  value={editedEvent.location || ''}
                  onChange={(e) => setEditedEvent({ ...editedEvent, location: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Ex: Paris, France"
                />
              ) : event.location ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  {event.location}
                </a>
              ) : (
                <p className="text-gray-700">Non défini</p>
              )}
            </div>

            {/* Participants cible */}
            {isEditing && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Participants
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Nombre de participants cible
                      {(!editedEvent.target_participants || editedEvent.target_participants === 0) && (
                        <span className="ml-2 text-amber-600 text-xs font-semibold">
                          (Requis pour les statistiques)
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      value={editedEvent.target_participants || 0}
                      onChange={(e) => setEditedEvent({ ...editedEvent, target_participants: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      min="0"
                      step="1"
                      placeholder="Ex: 100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Nombre approximatif de personnes que vous souhaitez atteindre lors de cet événement
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Budget & ROI */}
            {isEditing && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Budget & Revenus</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Budget (€)</label>
                    <input
                      type="number"
                      value={editedEvent.budget || 0}
                      onChange={(e) => setEditedEvent({ ...editedEvent, budget: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Revenus (€)</label>
                    <input
                      type="number"
                      value={editedEvent.revenue || 0}
                      onChange={(e) => setEditedEvent({ ...editedEvent, revenue: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Coût par contact</span>
                      <span className="font-bold text-gray-900">{costPerContact}€</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Statut */}
            {isEditing && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Statut</h2>
                <select
                  value={editedEvent.status || ''}
                  onChange={(e) => setEditedEvent({ ...editedEvent, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Public cible */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Public cible
              </h2>
              {event.target_audience && event.target_audience.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {event.target_audience.map((audience, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      {audience}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Non défini</p>
              )}
            </div>

            {/* Métadonnées */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Informations
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Créé le</span>
                  <span className="text-gray-900">
                    {new Date(event.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Modifié le</span>
                  <span className="text-gray-900">
                    {new Date(event.updated_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Ajouter des contacts */}
      {showAddContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Ajouter des contacts</h2>
                <button
                  onClick={() => {
                    setShowAddContactModal(false);
                    setSelectedContactIds(new Set());
                    setSearchQuery('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <input
                type="text"
                placeholder="Rechercher un contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="p-6 overflow-y-auto max-h-96">
              {loadingContacts ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-gray-500">Chargement des contacts...</p>
                </div>
              ) : getAvailableContacts().length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {allContacts.length === 0 
                      ? 'Aucun contact dans votre liste'
                      : 'Aucun contact disponible (tous les contacts sont déjà associés à cet événement)'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {getAvailableContacts().map((contact) => (
                    <label
                      key={contact.id}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        selectedContactIds.has(contact.id)
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedContactIds.has(contact.id)}
                        onChange={() => toggleContactSelection(contact.id)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold">
                        {contact.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{contact.full_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          {contact.company && <span>{contact.company}</span>}
                          {contact.job_title && <span>• {contact.job_title}</span>}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedContactIds.size} contact{selectedContactIds.size !== 1 ? 's' : ''} sélectionné{selectedContactIds.size !== 1 ? 's' : ''}
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddContactModal(false);
                    setSelectedContactIds(new Set());
                    setSearchQuery('');
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddContacts}
                  disabled={selectedContactIds.size === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showContactFormModal && (
        <AddContactModal
          onClose={() => setShowContactFormModal(false)}
          onContactAdded={async () => {
            await loadAllContacts();
            setShowContactFormModal(false);
          }}
        />
      )}

      {showQRModal && event?.qr_code_token && (
        <EventQRCodeModal
          eventName={event.name}
          qrCodeToken={event.qr_code_token}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </div>
  );
}