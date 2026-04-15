'use client';

import { useState, useEffect } from 'react';
import {
    ArrowLeft, Phone, Mail, MessageCircle, Share2, Star,
    Edit, Save, X, Plus, MapPin, Building2, Briefcase,
    TrendingUp, Calendar, History, StickyNote, Camera, Trash2, Edit3, Users,
    Tag, Target, Heart, Sparkles, ChevronRight, Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useKpis } from '@/contexts/KpiContext';
import { PhoneInput } from './PhoneInput';
import { COUNTRIES } from '@/lib/countries';
import { MaterialButton } from './material/MaterialButton';
import { MaterialIconButton } from './material/MaterialIconButton';

interface ContactProfileProps {
    contactId: string;
    onBack: () => void;
    onNavigateToEnterprise?: () => void;
}

interface Contact {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    job_title: string | null;
    city: string | null;
    country: string | null;
    region: string | null;
    address: string | null;
    website: string | null;
    linkedin: string | null;
    twitter: string | null;
    notes: string | null;
    tags: string[] | null;
    is_favorite: boolean;
    avatar_url: string | null;
    rating: number;
    industry: string | null;
    company_size: string | null;
    status: string | null;
    relationship: string | null;
    is_member: boolean;
    relationships?: Relationship[];
}

interface Relationship {
    id: string;
    relationship_type: string;
    notes: string | null;
    related_contact: {
        id: string;
        full_name: string;
        company: string | null;
        job_title: string | null;
        avatar_url: string | null;
    } | null;
}

interface Note {
    id: string;
    content: string;
    created_at: string;
    updated_at: string;
}

interface Activity {
    id: string;
    activity_type: 'call' | 'email' | 'message' | 'meeting' | 'other';
    description: string;
    activity_date: string;
    created_at: string;
}

interface Opportunity {
    id: string;
    title: string;
    amount: number | null;
    currency: string;
    status: 'prospect' | 'negotiation' | 'won' | 'lost';
    probability: number;
    expected_close_date: string | null;
    description: string | null;
    created_at: string;
}

interface ContactEvent {
    id: string;
    name: string;
    start_date: string;
    location: string | null;
}

const ACTIVITY_TYPES = [
    { value: 'call', label: 'Appel', icon: Phone },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'message', label: 'Message', icon: MessageCircle },
    { value: 'meeting', label: 'Réunion', icon: Calendar },
    { value: 'other', label: 'Autre', icon: History },
];

const OPPORTUNITY_STATUS = [
    { value: 'prospect', label: 'Prospect', color: 'bg-gray-100 text-gray-800' },
    { value: 'negotiation', label: 'Négociation', color: 'bg-blue-100 text-blue-800' },
    { value: 'won', label: 'Gagné', color: 'bg-green-100 text-green-800' },
    { value: 'lost', label: 'Perdu', color: 'bg-red-100 text-red-800' },
];

export function ContactProfile({ contactId, onBack, onNavigateToEnterprise }: ContactProfileProps) {
    const { user } = useAuth();
    const { showToast } = useNotifications();
    const { refreshKpis } = useKpis();
    const [contact, setContact] = useState<Contact | null>(null);
    const [events, setEvents] = useState<ContactEvent[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContact, setEditedContact] = useState<Contact | null>(null);
    const [newNote, setNewNote] = useState('');
    const [showNoteInput, setShowNoteInput] = useState(false);
    const [showActivityForm, setShowActivityForm] = useState(false);
    const [showOpportunityForm, setShowOpportunityForm] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editingNoteContent, setEditingNoteContent] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
    const [enterpriseExists, setEnterpriseExists] = useState(false);
    const [showEnterpriseWarning, setShowEnterpriseWarning] = useState(false);

    // Activity form state
    const [activityType, setActivityType] = useState('call');
    const [activityDescription, setActivityDescription] = useState('');
    const [activityDate, setActivityDate] = useState(new Date().toISOString().slice(0, 16));

    // Opportunity form state
    const [oppTitle, setOppTitle] = useState('');
    const [oppAmount, setOppAmount] = useState('');
    const [oppCurrency, setOppCurrency] = useState('EUR');
    const [oppStatus, setOppStatus] = useState<string>('prospect');
    const [oppProbability, setOppProbability] = useState('50');
    const [oppCloseDate, setOppCloseDate] = useState('');
    const [oppDescription, setOppDescription] = useState('');

    useEffect(() => { loadContactData(); }, [contactId]);

    useEffect(() => {
        const checkEnterprise = async () => {
            if (!user) return;
            try {
                const res = await fetch('/api/enterprise');
                if (res.ok) {
                    const data = await res.json();
                    setEnterpriseExists(Array.isArray(data) ? data.length > 0 : !!data?.enterprise);
                }
            } catch { /* ignore */ }
        };
        checkEnterprise();
    }, [user]);

    const loadContactData = async () => {
        try {
            setLoading(true);
            const [contactRes, interactionsRes] = await Promise.all([
                fetch(`/api/contacts/${contactId}`),
                fetch(`/api/contacts/${contactId}/interactions`),
            ]);

            if (contactRes.ok) {
                const data = await contactRes.json();
                setContact(data);
                setEditedContact(data);
                if (data.events) setEvents(data.events || []);
            }

            if (interactionsRes.ok) {
                const data = await interactionsRes.json();
                setNotes(data.notes || []);
                setActivities(data.activities || []);
                setOpportunities(data.opportunities || []);
                if (data.events) setEvents(data.events);
            }
        } catch (error) {
            console.error('Error loading contact data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getQualityLabel = (rating: number) => {
        if (rating >= 4.5) return { label: 'Excellent', color: 'text-green-600' };
        if (rating >= 3.5) return { label: 'Très bon', color: 'text-blue-600' };
        if (rating >= 2.5) return { label: 'Bon', color: 'text-yellow-600' };
        if (rating >= 1.5) return { label: 'Moyen', color: 'text-orange-600' };
        return { label: 'Faible', color: 'text-red-600' };
    };

    const toggleNoteExpansion = (noteId: string) => {
        setExpandedNotes(prev => {
            const n = new Set(prev);
            n.has(noteId) ? n.delete(noteId) : n.add(noteId);
            return n;
        });
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !contact) return;
        const file = e.target.files[0];
        try {
            setUploadingPhoto(true);
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch(`/api/contacts/${contact.id}/avatar`, { method: 'POST', body: formData });
            if (!res.ok) throw new Error('Upload failed');
            const { url } = await res.json();
            setContact({ ...contact, avatar_url: url });
            setEditedContact({ ...contact, avatar_url: url });
        } catch (error) {
            console.error('Error uploading photo:', error);
            showToast('Erreur', 'Erreur lors du téléchargement de la photo', 'error');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleRatingChange = async (newRating: number) => {
        if (!contact) return;
        try {
            await fetch(`/api/contacts/${contact.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating: newRating }),
            });
            setContact({ ...contact, rating: newRating });
        } catch (error) {
            console.error('Error updating rating:', error);
        }
    };

    const handleToggleMember = async () => {
        if (!contact) return;
        const newIsMember = !contact.is_member;
        if (newIsMember && !enterpriseExists) {
            setShowEnterpriseWarning(true);
            return;
        }
        try {
            const res = await fetch(`/api/contacts/${contact.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_member: newIsMember }),
            });
            if (!res.ok) throw new Error();
            setContact({ ...contact, is_member: newIsMember });
            setEditedContact({ ...contact, is_member: newIsMember });
        } catch {
            showToast('Erreur', 'Erreur lors de la mise à jour du statut membre', 'error');
        }
    };

    const handleToggleFavorite = async () => {
        if (!contact) return;
        try {
            const newIsFavorite = !contact.is_favorite;
            await fetch(`/api/contacts/${contact.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_favorite: newIsFavorite }),
            });
            setContact({ ...contact, is_favorite: newIsFavorite });
            setEditedContact((prev) => prev ? { ...prev, is_favorite: newIsFavorite } : prev);
        } catch {
            showToast('Erreur', 'Erreur lors de la mise à jour', 'error');
        }
    };

    const handleSaveEdit = async () => {
        if (!editedContact) return;
        try {
            const res = await fetch(`/api/contacts/${editedContact.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: editedContact.full_name,
                    email: editedContact.email || null,
                    phone: editedContact.phone || null,
                    company: editedContact.company || null,
                    job_title: editedContact.job_title || null,
                    city: editedContact.city || null,
                    country: editedContact.country || null,
                    region: editedContact.region || null,
                    address: editedContact.address || null,
                    website: editedContact.website || null,
                    linkedin: editedContact.linkedin || null,
                    twitter: editedContact.twitter || null,
                    tags: editedContact.tags,
                    is_favorite: editedContact.is_favorite,
                    industry: editedContact.industry || null,
                    company_size: editedContact.company_size || null,
                    is_member: editedContact.is_member,
                    status: editedContact.status || null,
                    relationship: editedContact.relationship || null,
                }),
            });
            if (!res.ok) throw new Error();
            const updatedContact = await res.json();
            setContact(updatedContact);
            setEditedContact(updatedContact);
            setIsEditing(false);
            refreshKpis();
        } catch {
            showToast('Erreur', 'Erreur lors de la mise à jour du contact', 'error');
        }
    };

    const handleCancelEdit = () => {
        setEditedContact(contact);
        setIsEditing(false);
    };

    const handleAddNote = async () => {
        if (!newNote.trim() || !contact) return;
        try {
            const res = await fetch(`/api/contacts/${contact.id}/interactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'note', content: newNote }),
            });
            if (!res.ok) throw new Error();
            setNewNote('');
            setShowNoteInput(false);
            loadContactData();
        } catch (error) {
            console.error('Error adding note:', error);
        }
    };

    const handleEditNote = async (noteId: string) => {
        if (!editingNoteContent.trim()) return;
        try {
            await fetch(`/api/contacts/${contact?.id}/interactions/${noteId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editingNoteContent }),
            });
            setEditingNoteId(null);
            setEditingNoteContent('');
            loadContactData();
        } catch (error) {
            console.error('Error updating note:', error);
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) return;
        try {
            await fetch(`/api/contacts/${contact?.id}/interactions/${noteId}`, { method: 'DELETE' });
            loadContactData();
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    };

    const handleDeleteContact = async () => {
        if (!contact) return;
        try {
            setDeleting(true);
            await fetch(`/api/contacts/${contact.id}`, { method: 'DELETE' });
            refreshKpis();
            onBack();
        } catch {
            showToast('Erreur', 'Erreur lors de la suppression du contact', 'error');
            setDeleting(false);
        }
    };

    const handleAddActivity = async () => {
        if (!contact || !activityDescription.trim()) return;
        try {
            const res = await fetch(`/api/contacts/${contact.id}/interactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'activity',
                    activity_type: activityType,
                    description: activityDescription,
                    activity_date: activityDate,
                }),
            });
            if (!res.ok) throw new Error();
            setShowActivityForm(false);
            setActivityDescription('');
            loadContactData();
        } catch (error) {
            console.error('Error adding activity:', error);
        }
    };

    const handleAddOpportunity = async () => {
        if (!contact || !oppTitle.trim()) return;
        try {
            const res = await fetch('/api/opportunities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contact_id: contact.id,
                    title: oppTitle,
                    amount: oppAmount ? parseFloat(oppAmount) : null,
                    currency: oppCurrency,
                    status: oppStatus,
                    probability: parseInt(oppProbability),
                    expected_close_date: oppCloseDate || null,
                    description: oppDescription || null,
                }),
            });
            if (!res.ok) throw new Error();
            setShowOpportunityForm(false);
            setOppTitle(''); setOppAmount(''); setOppDescription('');
            loadContactData();
            refreshKpis();
        } catch (error) {
            console.error('Error adding opportunity:', error);
        }
    };

    const handleDeleteOpportunity = async (oppId: string) => {
        if (!confirm('Supprimer cette opportunité ?')) return;
        try {
            await fetch(`/api/opportunities/${oppId}`, { method: 'DELETE' });
            loadContactData();
            refreshKpis();
        } catch {
            showToast('Erreur', 'Erreur lors de la suppression', 'error');
        }
    };

    const handleCall = () => {
        if (contact?.phone) window.location.href = `tel:${contact.phone}`;
    };

    const handleEmail = () => {
        if (contact?.email) window.location.href = `mailto:${contact.email}`;
    };

    const handleWhatsApp = () => {
        if (contact?.phone) {
            const phone = contact.phone.replace(/[^0-9]/g, '');
            window.open(`https://wa.me/${phone}`, '_blank');
        }
    };

    const handleShare = async () => {
        if (!contact) return;
        const text = `${contact.full_name}${contact.company ? ` - ${contact.company}` : ''}\n${contact.email || ''}\n${contact.phone || ''}`;
        try {
            if (navigator.share) {
                await navigator.share({ title: contact.full_name, text, url: window.location.href });
            } else {
                await navigator.clipboard.writeText(text);
                showToast('Succès', 'Informations copiées', 'success');
            }
        } catch { /* ignore */ }
    };

    const fmtCurrency = (amount: number | null, currency: string) => {
        if (!amount) return '-';
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(amount);
    };

    const fmtDate = (d: string | null) => {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const fmtDateTime = (d: string) => {
        return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (loading || !contact) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="text-center">
                    <div className="relative">
                        <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
                        <Sparkles className="absolute top-1/2 left-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-slate-700" />
                    </div>
                    <p className="text-gray-600 font-medium mt-4">Chargement du profil...</p>
                </div>
            </div>
        );
    }

    const displayContact = isEditing ? editedContact : contact;
    if (!displayContact) return null;

    const totalOpportunitiesAmount = opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);
    const mainCurrency = opportunities.length > 0 ? opportunities[0].currency : 'EUR';

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="relative">
                <div className="relative h-56 overflow-hidden border-b border-slate-200 bg-slate-100 sm:h-64 md:h-72">
                </div>

                <div className="absolute top-0 left-0 right-0 z-20">
                    <div className="flex items-center justify-between p-4 sm:p-6">
                        <MaterialIconButton ariaLabel="Retour" onClick={onBack} icon={<ArrowLeft className="w-5 h-5 text-slate-700" />} />
                        <div className="flex gap-2">
                            {isEditing ? (
                                <>
                                    <MaterialIconButton ariaLabel="Annuler les modifications" onClick={handleCancelEdit} icon={<X className="w-5 h-5 text-slate-700" />} />
                                    <MaterialIconButton ariaLabel="Enregistrer le contact" onClick={handleSaveEdit} variant="filled" icon={<Save className="w-5 h-5" />} />
                                </>
                            ) : (
                                <>
                                    <MaterialIconButton ariaLabel="Modifier le contact" onClick={() => setIsEditing(true)} icon={<Edit className="w-5 h-5 text-slate-700" />} />
                                    <MaterialIconButton ariaLabel="Supprimer le contact" onClick={() => setShowDeleteModal(true)} variant="outlined" icon={<Trash2 className="w-5 h-5 text-red-600" />} />
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Avatar */}
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-16 sm:-bottom-20 z-30">
                    <div className="relative group">
                        <div className="h-32 w-32 rounded-full border border-slate-200 bg-white p-1.5 shadow-sm sm:h-40 sm:w-40">
                            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-slate-200">
                                {displayContact.avatar_url ? (
                                    <img src={displayContact.avatar_url} alt={displayContact.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl font-bold text-slate-700 sm:text-5xl">
                                        {displayContact.full_name?.charAt(0).toUpperCase() || '?'}
                                    </span>
                                )}
                            </div>
                        </div>
                        <label htmlFor="avatar-upload" className="absolute bottom-2 right-2 cursor-pointer rounded-full border border-slate-200 bg-white p-2.5 hover:bg-slate-50">
                            {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin text-slate-700" /> : <Camera className="w-4 h-4 text-slate-700" />}
                        </label>
                        <input id="avatar-upload" type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploadingPhoto} />
                        {displayContact.is_favorite && (
                            <div className="absolute -top-1 -right-1 p-2 bg-amber-500 rounded-full shadow-lg">
                                <Heart className="w-4 h-4 text-white fill-white" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="pt-20 sm:pt-24 pb-8">
                {/* Name & info */}
                <div className="text-center px-4 mb-6">
                    {isEditing ? (
                        <input type="text" value={displayContact.full_name}
                            onChange={e => setEditedContact({ ...displayContact, full_name: e.target.value.slice(0, 100) })}
                            className="mx-auto w-full max-w-md rounded-2xl border border-slate-300 bg-white px-4 py-2 text-center text-2xl font-bold text-gray-900 focus:border-slate-500 focus:outline-none sm:text-3xl" />
                    ) : (
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{displayContact.full_name}</h1>
                    )}
                    {displayContact.job_title && !isEditing && (
                        <p className="text-gray-500 flex items-center justify-center gap-1.5 mt-2">
                            <Briefcase className="w-4 h-4" />{displayContact.job_title}
                        </p>
                    )}
                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                        {displayContact.is_member && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-600 text-white">
                                <Users className="w-3.5 h-3.5" />Membre
                            </span>
                        )}
                        {displayContact.status && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">
                                <Target className="w-3.5 h-3.5" />{displayContact.status.charAt(0).toUpperCase() + displayContact.status.slice(1)}
                            </span>
                        )}
                        {displayContact.company && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                <Building2 className="w-3.5 h-3.5" />{displayContact.company}
                            </span>
                        )}
                    </div>
                </div>

                {/* Stats cards */}
                <div className="px-4 mb-6">
                    <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
                        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 text-center">
                            <p className="text-2xl font-bold text-gray-900">{(displayContact.email ? 1 : 0) + (displayContact.phone ? 1 : 0)}</p>
                            <p className="text-xs text-gray-500 mt-1">Coordonnées</p>
                        </div>
                        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 text-center">
                            <p className="text-xl font-bold text-gray-900 truncate">{fmtCurrency(totalOpportunitiesAmount, mainCurrency)}</p>
                            <p className="text-xs text-gray-500 mt-1">Opportunités</p>
                        </div>
                        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 text-center">
                            <p className="text-2xl font-bold text-gray-900">{events.length}</p>
                            <p className="text-xs text-gray-500 mt-1">Événements</p>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                {!isEditing && (
                    <div className="px-4 mb-6">
                        <div className="flex justify-center gap-3 flex-wrap">
                            {displayContact.phone && (
                                <>
                                    <MaterialButton onClick={handleCall} icon={<Phone className="w-4 h-4" />}>
                                        Appeler
                                    </MaterialButton>
                                    <MaterialButton onClick={handleWhatsApp} variant="tonal" icon={<MessageCircle className="w-4 h-4" />}>
                                        WhatsApp
                                    </MaterialButton>
                                </>
                            )}
                            {displayContact.email && (
                                <MaterialButton onClick={handleEmail} variant="outlined" icon={<Mail className="w-4 h-4" />}>
                                    Email
                                </MaterialButton>
                            )}
                            <MaterialButton onClick={handleShare} variant="outlined" icon={<Share2 className="w-4 h-4" />}>
                                Partager
                            </MaterialButton>
                            <MaterialButton onClick={handleToggleFavorite} variant={displayContact.is_favorite ? 'filled' : 'outlined'} icon={<Star className="w-4 h-4" />}>
                                Favori
                            </MaterialButton>
                            <MaterialButton onClick={handleToggleMember} variant={displayContact.is_member ? 'tonal' : 'outlined'} icon={<Users className="w-4 h-4" />}>
                                Membre
                            </MaterialButton>
                        </div>
                    </div>
                )}

                <div className="px-4 space-y-4 max-w-4xl mx-auto">
                    {/* Rating */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <div className="rounded-xl bg-slate-100 p-2"><Star className="w-4 h-4 text-slate-700" /></div>Évaluation
                            </h2>
                            <span className={`text-sm font-semibold ${getQualityLabel(displayContact.rating || 0).color}`}>
                                {getQualityLabel(displayContact.rating || 0).label}
                            </span>
                        </div>
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button key={star} onClick={() => handleRatingChange(star)} className="cursor-pointer hover:scale-125 transition-transform">
                                    <Star className={`w-8 h-8 sm:w-10 sm:h-10 ${star <= (displayContact.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Coordonnées */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                                <div className="rounded-xl bg-slate-100 p-2"><MapPin className="w-4 h-4 text-slate-700" /></div>Coordonnées
                            </h2>
                            {isEditing ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email</label>
                                        <input type="email" value={displayContact.email || ''}
                                            onChange={e => setEditedContact({ ...displayContact, email: e.target.value })}
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" placeholder="email@example.com" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Téléphone</label>
                                        <PhoneInput value={displayContact.phone || ''} onChange={(value) => setEditedContact({ ...displayContact, phone: value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Adresse</label>
                                        <input type="text" value={displayContact.address || ''}
                                            onChange={e => setEditedContact({ ...displayContact, address: e.target.value })}
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Ville</label>
                                            <input type="text" value={displayContact.city || ''}
                                                onChange={e => setEditedContact({ ...displayContact, city: e.target.value })}
                                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Pays</label>
                                            <select value={displayContact.country || ''}
                                                onChange={e => setEditedContact({ ...displayContact, country: e.target.value })}
                                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300">
                                                <option value="">Sélectionner...</option>
                                                {COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {displayContact.email && (
                                        <a href={`mailto:${displayContact.email}`} className="group flex items-center gap-3 rounded-2xl bg-gray-50 p-3 hover:bg-slate-100">
                                            <div className="rounded-xl bg-white p-2 shadow-sm"><Mail className="w-4 h-4 text-slate-700" /></div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs text-gray-500">Email</p>
                                                <p className="font-medium text-gray-900 truncate">{displayContact.email}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                        </a>
                                    )}
                                    {displayContact.phone && (
                                        <a href={`tel:${displayContact.phone}`} className="group flex items-center gap-3 rounded-2xl bg-gray-50 p-3 hover:bg-slate-100">
                                            <div className="rounded-xl bg-white p-2 shadow-sm"><Phone className="w-4 h-4 text-slate-700" /></div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs text-gray-500">Téléphone</p>
                                                <p className="font-medium text-gray-900">{displayContact.phone}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                        </a>
                                    )}
                                    {displayContact.city && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                                            <div className="rounded-xl bg-white p-2 shadow-sm"><MapPin className="w-4 h-4 text-slate-700" /></div>
                                            <div>
                                                <p className="text-xs text-gray-500">Localisation</p>
                                                <p className="font-medium text-gray-900">{displayContact.city}{displayContact.country ? `, ${displayContact.country}` : ''}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Professional info */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <div className="rounded-xl bg-slate-100 p-2"><TrendingUp className="w-4 h-4 text-slate-700" /></div>Professionnel
                                </h2>
                            </div>
                            {isEditing ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Entreprise</label>
                                        <input type="text" value={displayContact.company || ''}
                                            onChange={e => setEditedContact({ ...displayContact, company: e.target.value })}
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Poste</label>
                                        <input type="text" value={displayContact.job_title || ''}
                                            onChange={e => setEditedContact({ ...displayContact, job_title: e.target.value })}
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Secteur</label>
                                        <input type="text" value={displayContact.industry || ''}
                                            onChange={e => setEditedContact({ ...displayContact, industry: e.target.value })}
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">LinkedIn</label>
                                        <input type="url" value={displayContact.linkedin || ''}
                                            onChange={e => setEditedContact({ ...displayContact, linkedin: e.target.value })}
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Statut</label>
                                        <select value={displayContact.status || ''}
                                            onChange={e => setEditedContact({ ...displayContact, status: e.target.value })}
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300">
                                            <option value="">Sélectionner...</option>
                                            <option value="lead">Lead</option>
                                            <option value="prospect">Prospect</option>
                                            <option value="client">Client</option>
                                            <option value="partner">Partenaire</option>
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {displayContact.company && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                                            <div className="rounded-xl bg-white p-2 shadow-sm"><Building2 className="w-4 h-4 text-slate-700" /></div>
                                            <div>
                                                <p className="text-xs text-gray-500">Entreprise</p>
                                                <p className="font-medium text-gray-900">{displayContact.company}</p>
                                            </div>
                                        </div>
                                    )}
                                    {displayContact.job_title && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                                            <div className="rounded-xl bg-white p-2 shadow-sm"><Briefcase className="w-4 h-4 text-slate-700" /></div>
                                            <div>
                                                <p className="text-xs text-gray-500">Poste</p>
                                                <p className="font-medium text-gray-900">{displayContact.job_title}</p>
                                            </div>
                                        </div>
                                    )}
                                    {displayContact.linkedin && (
                                        <a href={displayContact.linkedin} target="_blank" rel="noopener noreferrer"
                                            className="group flex items-center gap-3 rounded-2xl bg-gray-50 p-3 hover:bg-slate-100">
                                            <div className="rounded-xl bg-white p-2 shadow-sm"><TrendingUp className="w-4 h-4 text-slate-700" /></div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs text-gray-500">LinkedIn</p>
                                                <p className="truncate font-medium text-slate-700">{displayContact.linkedin}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tags */}
                    {(displayContact.tags && displayContact.tags.length > 0) && (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                                <div className="rounded-xl bg-slate-100 p-2"><Tag className="w-4 h-4 text-slate-700" /></div>Tags
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {displayContact.tags.map(tag => (
                                    <span key={tag} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">{tag}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {displayContact.relationships && displayContact.relationships.length > 0 && (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                                <div className="rounded-xl bg-slate-100 p-2"><Users className="w-4 h-4 text-slate-700" /></div>Relations ({displayContact.relationships.length})
                            </h2>
                            <div className="space-y-3">
                                {displayContact.relationships.map((relationship) => {
                                    if (!relationship.related_contact) return null;

                                    return (
                                        <div key={relationship.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                                            {relationship.related_contact.avatar_url ? (
                                                <img src={relationship.related_contact.avatar_url} alt={relationship.related_contact.full_name} className="w-12 h-12 rounded-xl object-cover" />
                                            ) : (
                                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 font-semibold text-slate-700">
                                                    {relationship.related_contact.full_name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-gray-900 truncate">{relationship.related_contact.full_name}</p>
                                                <p className="text-sm text-gray-500 truncate">
                                                    {relationship.related_contact.company || relationship.related_contact.job_title || 'Relation'}
                                                </p>
                                            </div>
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                                {relationship.relationship_type}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <div className="rounded-xl bg-slate-100 p-2"><StickyNote className="w-4 h-4 text-slate-700" /></div>Notes ({notes.length})
                            </h2>
                            <MaterialIconButton ariaLabel="Ajouter une note" onClick={() => setShowNoteInput(!showNoteInput)} icon={<Plus className="w-5 h-5" />} />
                        </div>

                        {showNoteInput && (
                            <div className="mb-4">
                                <textarea value={newNote} onChange={e => setNewNote(e.target.value)} rows={3} placeholder="Ajouter une note..."
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-300" />
                                <div className="flex justify-end gap-2 mt-2">
                                    <MaterialButton onClick={() => { setShowNoteInput(false); setNewNote(''); }} variant="outlined">
                                        Annuler
                                    </MaterialButton>
                                    <MaterialButton onClick={handleAddNote} disabled={!newNote.trim()}>
                                        Ajouter
                                    </MaterialButton>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {notes.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">Aucune note</p>
                            ) : notes.map(note => (
                                <div key={note.id} className="p-3 bg-gray-50 rounded-2xl">
                                    {editingNoteId === note.id ? (
                                        <div>
                                            <textarea value={editingNoteContent} onChange={e => setEditingNoteContent(e.target.value)} rows={3}
                                                className="w-full px-3 py-2 bg-white border rounded-xl text-sm" />
                                            <div className="flex justify-end gap-2 mt-2">
                                                <MaterialButton onClick={() => setEditingNoteId(null)} variant="outlined" className="text-sm">
                                                    Annuler
                                                </MaterialButton>
                                                <MaterialButton onClick={() => handleEditNote(note.id)} className="text-sm">
                                                    Sauver
                                                </MaterialButton>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className={`text-sm text-gray-700 ${!expandedNotes.has(note.id) && note.content.length > 150 ? 'line-clamp-3' : ''}`}>
                                                {note.content}
                                            </p>
                                            {note.content.length > 150 && (
                                                <button onClick={() => toggleNoteExpansion(note.id)} className="mt-1 text-xs text-slate-700">
                                                    {expandedNotes.has(note.id) ? 'Voir moins' : 'Voir plus'}
                                                </button>
                                            )}
                                            <div className="flex items-center justify-between mt-2">
                                                <p className="text-xs text-gray-400">{fmtDateTime(note.created_at)}</p>
                                                <div className="flex gap-1">
                                                    <button onClick={() => { setEditingNoteId(note.id); setEditingNoteContent(note.content); }}
                                                        className="p-1 hover:bg-gray-200 rounded"><Edit3 className="w-3.5 h-3.5 text-gray-500" /></button>
                                                    <button onClick={() => handleDeleteNote(note.id)}
                                                        className="p-1 hover:bg-red-100 rounded"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Activities */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <div className="rounded-xl bg-slate-100 p-2"><History className="w-4 h-4 text-slate-700" /></div>Activités ({activities.length})
                            </h2>
                            <MaterialIconButton ariaLabel="Ajouter une activité" onClick={() => setShowActivityForm(!showActivityForm)} icon={<Plus className="w-5 h-5" />} />
                        </div>

                        {showActivityForm && (
                            <div className="mb-4 p-4 bg-gray-50 rounded-2xl space-y-3">
                                <div className="flex gap-2 flex-wrap">
                                    {ACTIVITY_TYPES.map(type => (
                                        <MaterialButton
                                            key={type.value}
                                            onClick={() => setActivityType(type.value)}
                                            variant={activityType === type.value ? 'filled' : 'outlined'}
                                            icon={<type.icon className="w-3.5 h-3.5" />}
                                            className="text-sm"
                                        >
                                            {type.label}
                                        </MaterialButton>
                                    ))}
                                </div>
                                <input type="text" value={activityDescription} onChange={e => setActivityDescription(e.target.value)}
                                    placeholder="Description de l'activité..." className="w-full px-4 py-2.5 bg-white border rounded-xl text-sm" />
                                <input type="datetime-local" value={activityDate} onChange={e => setActivityDate(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white border rounded-xl text-sm" />
                                <div className="flex justify-end gap-2">
                                    <MaterialButton onClick={() => setShowActivityForm(false)} variant="outlined" className="text-sm">
                                        Annuler
                                    </MaterialButton>
                                    <MaterialButton onClick={handleAddActivity} disabled={!activityDescription.trim()} className="text-sm">
                                        Ajouter
                                    </MaterialButton>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            {activities.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">Aucune activité</p>
                            ) : activities.slice(0, 10).map(activity => {
                                const typeInfo = ACTIVITY_TYPES.find(t => t.value === activity.activity_type);
                                const Icon = typeInfo?.icon || History;
                                return (
                                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl">
                                        <div className="rounded-xl bg-white p-2 shadow-sm"><Icon className="w-4 h-4 text-slate-700" /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-900">{activity.description}</p>
                                            <p className="text-xs text-gray-400 mt-1">{fmtDateTime(activity.activity_date)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Opportunities */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <div className="rounded-xl bg-slate-100 p-2"><TrendingUp className="w-4 h-4 text-slate-700" /></div>Opportunités ({opportunities.length})
                            </h2>
                            <MaterialIconButton ariaLabel="Ajouter une opportunité" onClick={() => setShowOpportunityForm(!showOpportunityForm)} icon={<Plus className="w-5 h-5" />} />
                        </div>

                        {showOpportunityForm && (
                            <div className="mb-4 p-4 bg-gray-50 rounded-2xl space-y-3">
                                <input type="text" value={oppTitle} onChange={e => setOppTitle(e.target.value)} placeholder="Titre *"
                                    className="w-full px-4 py-2.5 bg-white border rounded-xl text-sm" />
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="number" value={oppAmount} onChange={e => setOppAmount(e.target.value)} placeholder="Montant"
                                        className="w-full px-4 py-2.5 bg-white border rounded-xl text-sm" />
                                    <select value={oppStatus} onChange={e => setOppStatus(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border rounded-xl text-sm">
                                        {OPPORTUNITY_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="number" value={oppProbability} onChange={e => setOppProbability(e.target.value)} placeholder="Probabilité (%)" min="0" max="100"
                                        className="w-full px-4 py-2.5 bg-white border rounded-xl text-sm" />
                                    <input type="date" value={oppCloseDate} onChange={e => setOppCloseDate(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border rounded-xl text-sm" />
                                </div>
                                <textarea value={oppDescription} onChange={e => setOppDescription(e.target.value)} placeholder="Description"
                                    className="w-full px-4 py-2.5 bg-white border rounded-xl text-sm resize-none" rows={2} />
                                <div className="flex justify-end gap-2">
                                    <MaterialButton onClick={() => setShowOpportunityForm(false)} variant="outlined" className="text-sm">
                                        Annuler
                                    </MaterialButton>
                                    <MaterialButton onClick={handleAddOpportunity} disabled={!oppTitle.trim()} className="text-sm">
                                        Ajouter
                                    </MaterialButton>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {opportunities.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">Aucune opportunité</p>
                            ) : opportunities.map(opp => {
                                const statusInfo = OPPORTUNITY_STATUS.find(s => s.value === opp.status);
                                return (
                                    <div key={opp.id} className="p-4 bg-gray-50 rounded-2xl">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{opp.title}</h3>
                                                {opp.description && <p className="text-sm text-gray-500 mt-1">{opp.description}</p>}
                                            </div>
                                            <button onClick={() => handleDeleteOpportunity(opp.id)} className="p-1 hover:bg-red-100 rounded">
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo?.color || 'bg-gray-100'}`}>
                                                {statusInfo?.label || opp.status}
                                            </span>
                                            {opp.amount && (
                                                <span className="text-sm font-semibold text-gray-900">{fmtCurrency(opp.amount, opp.currency)}</span>
                                            )}
                                            <span className="text-xs text-gray-500">{opp.probability}% de probabilité</span>
                                            {opp.expected_close_date && (
                                                <span className="text-xs text-gray-500">Clôture: {fmtDate(opp.expected_close_date)}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Events */}
                    {events.length > 0 && (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                                <div className="rounded-xl bg-slate-100 p-2"><Calendar className="w-4 h-4 text-slate-700" /></div>Événements ({events.length})
                            </h2>
                            <div className="space-y-2">
                                {events.map(event => (
                                    <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                                        <div className="rounded-xl bg-white p-2 shadow-sm"><Calendar className="w-4 h-4 text-slate-700" /></div>
                                        <div>
                                            <p className="font-medium text-gray-900">{event.name}</p>
                                            <p className="text-xs text-gray-500">{fmtDate(event.start_date)}{event.location ? ` • ${event.location}` : ''}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Supprimer ce contact ?</h3>
                        <p className="text-gray-600 mb-6">Cette action est irréversible. Toutes les données associées seront supprimées.</p>
                        <div className="flex gap-3">
                            <MaterialButton onClick={() => setShowDeleteModal(false)} variant="outlined" className="flex-1 justify-center">
                                Annuler
                            </MaterialButton>
                            <MaterialButton onClick={handleDeleteContact} disabled={deleting} className="flex-1 justify-center">
                                {deleting ? 'Suppression...' : 'Supprimer'}
                            </MaterialButton>
                        </div>
                    </div>
                </div>
            )}

            {/* Enterprise warning modal */}
            {showEnterpriseWarning && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Entreprise requise</h3>
                        <p className="text-gray-600 mb-6">Vous devez d&apos;abord créer une entreprise pour ajouter des membres.</p>
                        <div className="flex gap-3">
                            <MaterialButton onClick={() => setShowEnterpriseWarning(false)} variant="outlined" className="flex-1 justify-center">
                                Annuler
                            </MaterialButton>
                            <MaterialButton onClick={() => { setShowEnterpriseWarning(false); onNavigateToEnterprise?.(); }} className="flex-1 justify-center">
                                Créer une entreprise
                            </MaterialButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
