'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Users, ArrowLeft } from 'lucide-react';
import { ContactCard } from './ContactCard';
import type { Contact } from '@/types';

interface EventDetailEvent {
    id: string;
    name: string;
    description: string | null;
    location: string | null;
    start_date: string | null;
    end_date: string | null;
    event_type?: string | null;
}

interface EventDetailProps {
    eventId: string;
    onClose: () => void;
    onContactClick: (contact: Contact) => void;
    onSendOffer?: (contact: Contact) => void;
}

export function EventDetail({ eventId, onClose, onContactClick, onSendOffer }: EventDetailProps) {
    const [event, setEvent] = useState<EventDetailEvent | null>(null);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEventAndContacts();
    }, [eventId]);

    const loadEventAndContacts = async () => {
        try {
            const res = await fetch(`/api/events/${eventId}`);
            if (!res.ok) throw new Error('Failed to load event');
            const data = await res.json();
            setEvent(data.event || data);

            // Load contacts for this event
            const contactsRes = await fetch(`/api/contacts?eventId=${eventId}`);
            if (contactsRes.ok) {
                const contactsData = await contactsRes.json();
                setContacts(contactsData.contacts || contactsData || []);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-2 sm:p-4">
            <div className="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:max-h-[90vh]">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-6 sm:py-6">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={onClose} className="rounded-full p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-700">
                            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>
                        <button onClick={onClose} className="rounded-full p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-700">
                            <X className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"></div>
                        </div>
                    ) : event ? (
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700">
                                    <Calendar className="h-7 w-7" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-semibold text-slate-900">{event.name}</h2>
                                    <span className="text-sm text-slate-500">
                                        {getEventTypeLabel(event.event_type || 'networking')}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 mt-4">
                                {event.start_date && (
                                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700">
                                        <Calendar className="h-5 w-5" />
                                        <span className="font-medium">
                                            {new Date(event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                )}
                                {event.location && (
                                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700">
                                        <MapPin className="h-5 w-5" />
                                        <span className="font-medium">{event.location}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700">
                                    <Users className="h-5 w-5" />
                                    <span className="font-medium">{contacts.length} contact{contacts.length > 1 ? 's' : ''}</span>
                                </div>
                            </div>

                            {event.description && (
                                <p className="mt-4 leading-relaxed text-slate-600">{event.description}</p>
                            )}
                        </div>
                    ) : null}
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-16">
                            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"></div>
                            <p className="mt-4 font-medium text-slate-500">Chargement des contacts...</p>
                        </div>
                    ) : contacts.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl border border-slate-200 bg-slate-100">
                                <Users className="h-8 w-8 text-slate-600" />
                            </div>
                            <h3 className="mb-3 text-xl font-semibold text-slate-900">Aucun contact pour cet événement</h3>
                            <p className="text-slate-500">Les contacts associés à cet événement apparaîtront ici.</p>
                        </div>
                    ) : (
                        <div>
                            <h3 className="mb-4 text-lg font-semibold text-slate-900">
                                Contacts de l&apos;événement ({contacts.length})
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {contacts.map((contact) => (
                                    <ContactCard key={contact.id} contact={contact} onClick={() => onContactClick(contact)} onSendOffer={onSendOffer} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
