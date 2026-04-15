'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, MapPin, Users, TrendingUp, Target, Eye, CreditCard as Edit, Save, X, Camera, Trash2, UserPlus, BarChart3, Clock, CheckCircle, AlertCircle, Plus, Mail, Phone, Building2, Percent, MessageCircle, ChevronUp, ChevronDown, QrCode, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useKpis } from '@/contexts/KpiContext';
import { AddContactModal } from './AddContactModal';
import { EventObjectives } from './EventObjectives';
import { EventQRCodeModal } from './EventQRCodeModal';

interface EventProfileProps {
    eventId: string;
    onBack: () => void;
    onContactSelect: (contactId: string) => void;
}

interface Event {
    id: string; name: string; description: string | null; category: string; event_type: string;
    status: string; start_date: string | null; end_date: string | null; location: string | null;
    image_url: string | null; target_participants: number; actual_participants: number;
    people_approached: number; contacts_added: number; conversion_rate: number; leads_generated: number;
    primary_objective: string | null; secondary_objectives: string[] | null; target_audience: string[] | null;
    budget: number; revenue: number; qr_code_token: string | null; created_at: string; updated_at: string;
}

interface Contact {
    id: string; full_name: string; email: string | null; phone: string | null;
    company: string | null; job_title: string | null; avatar_url: string | null;
    status: string | null; rating: number | null; created_at: string;
}

interface ContactEvent {
    id: string; contact_id: string; event_id: string; created_at: string; contacts: Contact;
}

const CATEGORIES = [
    { value: 'conference', label: 'Conférence' }, { value: 'seminar', label: 'Séminaire' },
    { value: 'networking', label: 'Networking' }, { value: 'salon', label: 'Salon' },
    { value: 'gala', label: 'Gala' }, { value: 'meetup', label: 'Meetup' },
];

const EVENT_TYPES = [
    { value: 'presentiel', label: 'Présentiel' }, { value: 'online', label: 'En ligne' },
    { value: 'hybride', label: 'Hybride' },
];

const STATUS_OPTIONS = [
    { value: 'upcoming', label: 'À venir', color: 'bg-slate-100 text-slate-700' },
    { value: 'ongoing', label: 'En cours', color: 'bg-slate-200 text-slate-800' },
    { value: 'completed', label: 'Terminé', color: 'bg-slate-100 text-slate-500' },
    { value: 'cancelled', label: 'Annulé', color: 'bg-red-100 text-red-700' },
];

const calculateEventStatus = (event: Event): string => {
    if (event.status === 'cancelled') return 'cancelled';
    const now = new Date();
    const startDate = event.start_date ? new Date(event.start_date) : null;
    const endDate = event.end_date ? new Date(event.end_date) : null;
    if (!startDate) return 'upcoming';
    if (endDate && now > endDate) return 'completed';
    if (now >= startDate && (!endDate || now <= endDate)) return 'ongoing';
    return 'upcoming';
};

export function EventProfile({ eventId, onBack, onContactSelect }: EventProfileProps) {
    const { refreshKpis } = useKpis();
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
    }, [eventId]);

    useEffect(() => { loadAllContacts(); }, []);

    const loadEvent = async () => {
        try {
            const res = await fetch(`/api/events/${eventId}`);
            if (!res.ok) throw new Error('Failed to load event');
            const data = await res.json();
            const eventData = data.event || data;
            setEvent(eventData);
            setEditedEvent(eventData || {});
        } catch (error) {
            console.error('Error loading event:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadEventContacts = async () => {
        try {
            const res = await fetch(`/api/events/${eventId}/contacts`);
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            setEventContacts(data.contacts || []);
        } catch (error) {
            console.error('Error loading event contacts:', error);
        }
    };

    const loadAllContacts = async () => {
        try {
            setLoadingContacts(true);
            const res = await fetch('/api/contacts');
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            setAllContacts(data.contacts || []);
        } catch (error) {
            console.error('Error loading contacts:', error);
        } finally {
            setLoadingContacts(false);
        }
    };

    const loadObjectives = async () => {
        try {
            const res = await fetch(`/api/events/${eventId}/objectives`);
            if (res.ok) {
                const data = await res.json();
                setObjectives(Array.isArray(data) ? data : data.objectives || []);
            }
        } catch (error) {
            console.error('Error loading objectives:', error);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!event) return;
        try {
            setLoading(true);
            let imageUrl = editedEvent.image_url;
            if (imageFile) {
                const formDataUpload = new FormData();
                formDataUpload.append('file', imageFile);
                const uploadRes = await fetch('/api/upload', { method: 'POST', body: formDataUpload });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    imageUrl = uploadData.url;
                }
            }
            const res = await fetch(`/api/events/${eventId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...editedEvent, image_url: imageUrl }),
            });
            if (!res.ok) throw new Error('Failed to save');
            await loadEvent();
            setIsEditing(false);
            setImageFile(null);
            setImagePreview(null);
            toast.success('Événement mis à jour');
        } catch (error) {
            console.error('Error saving event:', error);
            toast.error('Erreur lors de la sauvegarde');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;
        try {
            const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            onBack();
        } catch (error) {
            console.error('Error deleting event:', error);
            toast.error('Erreur lors de la suppression');
        }
    };

    const handleAddContacts = async () => {
        if (selectedContactIds.size === 0) return;
        try {
            const res = await fetch(`/api/events/${eventId}/contacts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contactIds: Array.from(selectedContactIds) }),
            });
            if (!res.ok) throw new Error('Failed');
            await loadEventContacts();
            await loadEvent();
            refreshKpis();
            setShowAddContactModal(false);
            setSelectedContactIds(new Set());
            setSearchQuery('');
        } catch (error) {
            console.error('Error adding contacts:', error);
            toast.error("Erreur lors de l'ajout des contacts");
        }
    };

    const handleRemoveContact = async (contactEventId: string) => {
        if (!confirm("Retirer ce contact de l'événement ?")) return;
        try {
            const res = await fetch(`/api/events/${eventId}/contacts/${contactEventId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed');
            await loadEventContacts();
            await loadEvent();
            refreshKpis();
        } catch (error) {
            console.error('Error removing contact:', error);
            toast.error('Erreur lors de la suppression');
        }
    };

    const updatePeopleApproached = async (increment: number) => {
        if (!event) return;
        const newValue = Math.max(0, (event.people_approached || 0) + increment);
        try {
            await fetch(`/api/events/${eventId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ people_approached: newValue }),
            });
            await loadEvent();
        } catch (error) {
            console.error('Error updating people approached:', error);
        }
    };

    const handleShowQRModal = async () => {
        if (!event) return;
        if (!event.qr_code_token) {
            try {
                const res = await fetch(`/api/events/${eventId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ qr_code_token: crypto.randomUUID() }),
                });
                if (!res.ok) throw new Error('Failed');
                await loadEvent();
            } catch (error) {
                console.error('Error generating QR token:', error);
                toast.error('Erreur lors de la génération du code QR');
                return;
            }
        }
        setShowQRModal(true);
    };

    const toggleContactSelection = (contactId: string) => {
        const newSelection = new Set(selectedContactIds);
        if (newSelection.has(contactId)) newSelection.delete(contactId);
        else newSelection.add(contactId);
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

    if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"></div></div>;
    if (!event) return (
        <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
            <AlertCircle className="mb-4 h-16 w-16 text-slate-300" /><p className="text-slate-600">Événement non trouvé</p>
            <button onClick={onBack} className="mt-4 text-sm font-medium text-slate-700 hover:text-slate-900">Retour</button>
        </div>
    );

    const calculatedStatus = calculateEventStatus(event);
    const statusInfo = STATUS_OPTIONS.find(s => s.value === calculatedStatus);
    const categoryLabel = CATEGORIES.find(c => c.value === event.category)?.label || event.category;
    const eventTypeLabel = EVENT_TYPES.find(t => t.value === event.event_type)?.label || event.event_type;
    const actualContactsCount = eventContacts.length;
    const targetFromObjectives = objectives.filter(obj => obj.metric_type === 'people_count').reduce((sum: number, obj: any) => sum + (obj.target_value || 0), 0);
    const targetParticipants = targetFromObjectives > 0 ? targetFromObjectives : event.target_participants;
    const conversionRate = event.people_approached > 0 ? ((actualContactsCount / event.people_approached) * 100).toFixed(1) : '0';
    const approachRate = targetParticipants > 0 ? ((event.people_approached / targetParticipants) * 100).toFixed(1) : '0';
    const contactQualityRate = actualContactsCount > 0
        ? (() => { const withRating = eventContacts.filter(ec => ec.contacts.rating != null && ec.contacts.rating > 0); if (withRating.length === 0) return '0'; const avg = withRating.reduce((sum, ec) => sum + (ec.contacts.rating || 0), 0) / withRating.length; return ((avg / 5) * 100).toFixed(1); })()
        : '0';
    const roi = event.budget > 0 ? (((event.revenue - event.budget) / event.budget) * 100).toFixed(1) : '0';
    const costPerContact = actualContactsCount > 0 ? (event.budget / actualContactsCount).toFixed(2) : '0';

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8">
                <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {(imagePreview || event.image_url) && (
                        <div className="h-48 border-b border-slate-200 bg-slate-100 sm:h-56 md:h-64">
                            <img src={imagePreview || event.image_url || ''} alt={event.name} className="h-full w-full object-cover" />
                        </div>
                    )}
                    <div className="p-4 sm:p-6">
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <button onClick={onBack} className="action-btn h-9 w-9 sm:h-10 sm:w-10"><ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700" /></button>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-500">Détail de l&apos;événement</p>
                                    {isEditing ? (
                                        <input type="text" value={editedEvent.name || ''} onChange={(e) => setEditedEvent({ ...editedEvent, name: e.target.value })} className="input-modern mt-1 text-xl font-semibold sm:text-2xl md:text-3xl" />
                                    ) : (
                                        <h1 className="mt-1 truncate text-xl font-semibold text-slate-900 sm:text-2xl md:text-3xl">{event.name}</h1>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-shrink-0 gap-2">
                                {isEditing ? (
                                    <>
                                        <button onClick={() => { setIsEditing(false); setEditedEvent(event); setImageFile(null); setImagePreview(null); }} className="action-btn"><X className="h-4 w-4 text-slate-700 sm:h-5 sm:w-5" /></button>
                                        <button onClick={handleSave} className="btn-primary h-10 w-10 px-0"><Save className="h-4 w-4 sm:h-5 sm:w-5" /></button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={handleShowQRModal} className="action-btn" title="Code QR"><QrCode className="h-4 w-4 text-slate-700 sm:h-5 sm:w-5" /></button>
                                        <button onClick={() => setIsEditing(true)} className="action-btn"><Edit className="h-4 w-4 text-slate-700 sm:h-5 sm:w-5" /></button>
                                        <button onClick={handleDelete} className="action-btn border-red-200 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4 sm:h-5 sm:w-5" /></button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <span className={`rounded-full px-3 py-1 text-xs font-medium sm:text-sm ${statusInfo?.color || 'bg-slate-100 text-slate-700'}`}>{statusInfo?.label || event.status}</span>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 sm:text-sm">{categoryLabel}</span>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 sm:text-sm">{eventTypeLabel}</span>
                        </div>

                        {isEditing && (
                            <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
                                <Camera className="h-4 w-4" />Modifier l&apos;image
                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                {(!event.target_participants || event.target_participants === 0) && !isEditing && (
                    <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                        <div className="flex-1">
                            <h3 className="mb-1 text-sm font-semibold text-amber-900">Nombre de participants cible non défini</h3>
                            <p className="mb-2 text-sm text-amber-800">Pour obtenir des statistiques précises, veuillez définir le nombre de participants cible.</p>
                            <button onClick={() => setIsEditing(true)} className="text-sm font-semibold text-amber-900 hover:text-amber-950 underline">Définir maintenant</button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Stats */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-900"><BarChart3 className="h-5 w-5 text-slate-700" />Statistiques de performance</h2>
                            <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-slate-700">Progression des participants</span>
                                    <span className="text-sm font-semibold text-slate-900">{actualContactsCount} / {targetParticipants}</span>
                                </div>
                                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                                    <div className="h-full rounded-full bg-slate-700 transition-all" style={{ width: `${Math.min(100, targetParticipants > 0 ? (actualContactsCount / targetParticipants) * 100 : 0)}%` }} />
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusInfo?.color || 'bg-slate-100 text-slate-700'}`}>{statusInfo?.label || calculatedStatus}</span>
                                    <span className="text-xs text-slate-600">{targetParticipants > 0 ? Math.round((actualContactsCount / targetParticipants) * 100) : 0}% complété</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                                    <div className="flex items-center justify-center gap-2 text-3xl font-semibold text-slate-900">
                                        <button onClick={() => updatePeopleApproached(-1)} className="rounded p-1 transition-colors hover:bg-slate-200"><ChevronDown className="h-5 w-5" /></button>
                                        <span>{event.people_approached || 0}</span>
                                        <button onClick={() => updatePeopleApproached(1)} className="rounded p-1 transition-colors hover:bg-slate-200"><ChevronUp className="h-5 w-5" /></button>
                                    </div>
                                    <div className="mt-1 flex items-center justify-center gap-1 text-sm text-slate-600"><Eye className="h-4 w-4" />Approchées</div>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                                    <div className="text-3xl font-semibold text-slate-900">{actualContactsCount}</div>
                                    <div className="mt-1 flex items-center justify-center gap-1 text-sm text-slate-600"><UserPlus className="h-4 w-4" />Enregistrées</div>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                                    <div className="text-3xl font-semibold text-slate-900">{conversionRate}%</div>
                                    <div className="mt-1 flex items-center justify-center gap-1 text-sm text-slate-600"><TrendingUp className="h-4 w-4" />Conversion</div>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                                    <div className="text-3xl font-semibold text-slate-900">{targetParticipants || 0}</div>
                                    <div className="mt-1 flex items-center justify-center gap-1 text-sm text-slate-600"><Target className="h-4 w-4" />Cible</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 md:grid-cols-3">
                                <div className="text-center"><div className="mb-1 flex items-center justify-center gap-1"><Percent className="h-4 w-4 text-slate-500" /><span className="text-sm font-medium text-slate-600">Taux d&apos;approche</span></div><div className="text-2xl font-semibold text-slate-900">{approachRate}%</div></div>
                                <div className="text-center"><div className="mb-1 flex items-center justify-center gap-1"><CheckCircle className="h-4 w-4 text-slate-500" /><span className="text-sm font-medium text-slate-600">Qualité</span></div><div className="text-2xl font-semibold text-slate-900">{contactQualityRate}%</div></div>
                                <div className="text-center"><div className="mb-1 flex items-center justify-center gap-1"><TrendingUp className="h-4 w-4 text-slate-500" /><span className="text-sm font-medium text-slate-600">ROI</span></div><div className="text-2xl font-semibold text-slate-900">{roi}%</div></div>
                            </div>
                        </div>

                        {/* Contacts */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900"><Users className="h-5 w-5 text-slate-700" />Contacts enregistrés ({actualContactsCount})</h2>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setShowContactFormModal(true)} className="btn-secondary gap-2 text-sm text-slate-700"><UserPlus className="h-4 w-4" />Créer</button>
                                    <button onClick={() => { setShowAddContactModal(true); loadAllContacts(); }} className="btn-primary gap-2 text-sm"><Plus className="h-4 w-4" />Ajouter</button>
                                </div>
                            </div>
                            {eventContacts.length === 0 ? (
                                <div className="py-8 text-center"><Users className="mx-auto mb-3 h-12 w-12 text-slate-300" /><p className="text-slate-500">Aucun contact associé</p></div>
                            ) : (
                                <div className="space-y-3">
                                    {eventContacts.map((ec) => (
                                        <div key={ec.id} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100">
                                            <button onClick={() => onContactSelect(ec.contact_id)} className="flex items-center gap-4 flex-1 min-w-0 text-left">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-slate-200 font-semibold text-slate-900">{ec.contacts.full_name.charAt(0).toUpperCase()}</div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-slate-900">{ec.contacts.full_name}</h3>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        {ec.contacts.company && <span className="flex items-center gap-1 text-sm text-slate-600"><Building2 className="h-3 w-3" />{ec.contacts.company}</span>}
                                                        {ec.contacts.job_title && <span className="text-sm text-slate-500">{ec.contacts.job_title}</span>}
                                                    </div>
                                                </div>
                                            </button>
                                            <div className="flex items-center gap-2">
                                                {ec.contacts.email && <a href={`mailto:${ec.contacts.email}`} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-slate-700"><Mail className="h-4 w-4" /></a>}
                                                {ec.contacts.phone && (
                                                    <>
                                                        <a href={`tel:${ec.contacts.phone}`} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-slate-700"><Phone className="h-4 w-4" /></a>
                                                        <a href={`https://wa.me/${ec.contacts.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-slate-700"><MessageCircle className="h-4 w-4" /></a>
                                                    </>
                                                )}
                                                <button onClick={() => handleRemoveContact(ec.id)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-xl font-semibold text-slate-900">Description</h2>
                            {isEditing ? (
                                <textarea value={editedEvent.description || ''} onChange={(e) => setEditedEvent({ ...editedEvent, description: e.target.value })} className="input-modern resize-none px-4 py-3" rows={6} placeholder="Description..." />
                            ) : (
                                <p className="whitespace-pre-wrap text-slate-700">{event.description || 'Aucune description'}</p>
                            )}
                        </div>

                        <EventObjectives eventId={eventId} />
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900"><Calendar className="h-5 w-5 text-slate-700" />Dates</h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="mb-1 block text-sm text-slate-600">Début</label>
                                    {isEditing ? <input type="datetime-local" value={editedEvent.start_date?.slice(0, 16) || ''} onChange={(e) => setEditedEvent({ ...editedEvent, start_date: e.target.value })} className="input-modern" /> : <p className="text-slate-900">{event.start_date ? new Date(event.start_date).toLocaleString('fr-FR') : 'Non défini'}</p>}
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm text-slate-600">Fin</label>
                                    {isEditing ? <input type="datetime-local" value={editedEvent.end_date?.slice(0, 16) || ''} onChange={(e) => setEditedEvent({ ...editedEvent, end_date: e.target.value })} className="input-modern" /> : <p className="text-slate-900">{event.end_date ? new Date(event.end_date).toLocaleString('fr-FR') : 'Non défini'}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900"><MapPin className="h-5 w-5 text-slate-700" />Lieu</h2>
                            {isEditing ? <input type="text" value={editedEvent.location || ''} onChange={(e) => setEditedEvent({ ...editedEvent, location: e.target.value })} className="input-modern" placeholder="Ex: Paris" /> : event.location ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-700 underline hover:text-slate-900">{event.location}</a> : <p className="text-slate-700">Non défini</p>}
                        </div>

                        {isEditing && (
                            <>
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900"><Users className="h-5 w-5 text-slate-700" />Participants</h2>
                                    <div><label className="mb-1 block text-sm text-slate-600">Nombre cible</label><input type="number" value={editedEvent.target_participants || 0} onChange={(e) => setEditedEvent({ ...editedEvent, target_participants: parseInt(e.target.value) || 0 })} className="input-modern" min="0" /></div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <h2 className="mb-4 text-lg font-semibold text-slate-900">Budget & Revenus</h2>
                                    <div className="space-y-3">
                                        <div><label className="mb-1 block text-sm text-slate-600">Budget (€)</label><input type="number" value={editedEvent.budget || 0} onChange={(e) => setEditedEvent({ ...editedEvent, budget: parseFloat(e.target.value) || 0 })} className="input-modern" min="0" step="0.01" /></div>
                                        <div><label className="mb-1 block text-sm text-slate-600">Revenus (€)</label><input type="number" value={editedEvent.revenue || 0} onChange={(e) => setEditedEvent({ ...editedEvent, revenue: parseFloat(e.target.value) || 0 })} className="input-modern" min="0" step="0.01" /></div>
                                        <div className="border-t border-slate-200 pt-3"><div className="flex items-center justify-between"><span className="text-sm text-slate-600">Coût par contact</span><span className="font-semibold text-slate-900">{costPerContact}€</span></div></div>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <h2 className="mb-4 text-lg font-semibold text-slate-900">Statut</h2>
                                    <select value={editedEvent.status || ''} onChange={(e) => setEditedEvent({ ...editedEvent, status: e.target.value })} className="input-modern">
                                        {STATUS_OPTIONS.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
                                    </select>
                                </div>
                            </>
                        )}

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900"><Users className="h-5 w-5 text-slate-700" />Public cible</h2>
                            {event.target_audience && event.target_audience.length > 0 ? (
                                <div className="flex flex-wrap gap-2">{event.target_audience.map((audience, index) => <span key={index} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{audience}</span>)}</div>
                            ) : <p className="text-sm text-slate-500">Non défini</p>}
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900"><Clock className="h-5 w-5 text-slate-700" />Informations</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-slate-600">Créé le</span><span className="text-slate-900">{new Date(event.created_at).toLocaleDateString('fr-FR')}</span></div>
                                <div className="flex justify-between"><span className="text-slate-600">Modifié le</span><span className="text-slate-900">{new Date(event.updated_at).toLocaleDateString('fr-FR')}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add contacts modal */}
            {showAddContactModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                    <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-semibold text-slate-900">Ajouter des contacts</h2>
                                <button onClick={() => { setShowAddContactModal(false); setSelectedContactIds(new Set()); setSearchQuery(''); }} className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input type="text" placeholder="Rechercher un contact..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-modern pl-10" />
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-96">
                            {loadingContacts ? (
                                <div className="py-8 text-center"><div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"></div><p className="text-slate-500">Chargement...</p></div>
                            ) : getAvailableContacts().length === 0 ? (
                                <div className="py-8 text-center"><Users className="mx-auto mb-3 h-12 w-12 text-slate-300" /><p className="text-slate-500">Aucun contact disponible</p></div>
                            ) : (
                                <div className="space-y-2">
                                    {getAvailableContacts().map((contact) => (
                                        <label key={contact.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${selectedContactIds.has(contact.id) ? 'border-slate-400 bg-slate-100' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                                            <input type="checkbox" checked={selectedContactIds.has(contact.id)} onChange={() => toggleContactSelection(contact.id)} className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-300" />
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-slate-200 font-semibold text-slate-900">{contact.full_name.charAt(0).toUpperCase()}</div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-slate-900">{contact.full_name}</h3>
                                                <div className="flex items-center gap-2 text-sm text-slate-600">{contact.company && <span>{contact.company}</span>}{contact.job_title && <span>• {contact.job_title}</span>}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-200 p-6">
                            <span className="text-sm text-slate-600">{selectedContactIds.size} contact{selectedContactIds.size !== 1 ? 's' : ''} sélectionné{selectedContactIds.size !== 1 ? 's' : ''}</span>
                            <div className="flex gap-3">
                                <button onClick={() => { setShowAddContactModal(false); setSelectedContactIds(new Set()); setSearchQuery(''); }} className="btn-secondary">Annuler</button>
                                <button onClick={handleAddContacts} disabled={selectedContactIds.size === 0} className="btn-primary disabled:opacity-50">Ajouter</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showContactFormModal && <AddContactModal onClose={() => setShowContactFormModal(false)} onContactAdded={async () => { await loadAllContacts(); setShowContactFormModal(false); }} />}
            {showQRModal && event?.qr_code_token && <EventQRCodeModal eventName={event.name} qrCodeToken={event.qr_code_token} onClose={() => setShowQRModal(false)} />}
        </div>
    );
}
