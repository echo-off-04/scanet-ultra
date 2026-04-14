import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Users, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ContactCard } from './ContactCard';
import type { Database } from '../lib/database.types';

type Event = Database['public']['Tables']['events']['Row'];
type Contact = Database['public']['Tables']['contacts']['Row'];

interface EventDetailProps {
  eventId: string;
  onClose: () => void;
  onContactClick: (contact: Contact) => void;
  onSendOffer?: (contact: Contact) => void;
}

export function EventDetail({ eventId, onClose, onContactClick, onSendOffer }: EventDetailProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventAndContacts();
  }, [eventId]);

  const loadEventAndContacts = async () => {
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .maybeSingle();

      if (eventError) throw eventError;
      setEvent(eventData);

      const { data: contactEventsData, error: contactEventsError } = await supabase
        .from('contact_events')
        .select('contact_id')
        .eq('event_id', eventId);

      if (contactEventsError) throw contactEventsError;

      if (contactEventsData && contactEventsData.length > 0) {
        const contactIds = contactEventsData.map((ce) => ce.contact_id);
        const { data: contactsData, error: contactsError } = await supabase
          .from('contacts')
          .select('*')
          .in('id', contactIds)
          .order('created_at', { ascending: false });

        if (contactsError) throw contactsError;
        setContacts(contactsData || []);
      }
    } catch (error) {
      console.error('Error loading event and contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      salon: 'Salon',
      meeting: 'Réunion',
      conference: 'Conférence',
      networking: 'Networking',
    };
    return labels[type] || type;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto"></div>
            </div>
          ) : event ? (
            <div className="text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <Calendar className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">{event.name}</h2>
                  <span className="text-blue-100 text-sm">
                    {getEventTypeLabel(event.event_type || 'networking')}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-4">
                {event.start_date && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-xl">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">
                      {new Date(event.start_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-xl">
                    <MapPin className="w-5 h-5" />
                    <span className="font-medium">{event.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-xl">
                  <Users className="w-5 h-5" />
                  <span className="font-medium">
                    {contacts.length} contact{contacts.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {event.description && (
                <p className="mt-4 text-blue-50 leading-relaxed">{event.description}</p>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-14 w-14 border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="mt-4 text-muted font-medium">Chargement des contacts...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-16 card-premium">
              <div className="w-20 h-20 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Aucun contact pour cet événement
              </h3>
              <p className="text-muted">
                Les contacts associés à cet événement apparaîtront ici.
              </p>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Contacts de l'événement ({contacts.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {contacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onClick={() => onContactClick(contact)}
                    onSendOffer={onSendOffer}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
