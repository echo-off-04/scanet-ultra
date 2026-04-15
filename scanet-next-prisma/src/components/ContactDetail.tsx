'use client';

import { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Star, Mail, Phone, Building2, MapPin, Linkedin, MessageSquare, Video, Plus, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Contact, Interaction } from '@/types';
import { MaterialButton } from './material/MaterialButton';
import { MaterialIconButton } from './material/MaterialIconButton';

interface ContactDetailProps {
    contact: Contact;
    onClose: () => void;
    onUpdate: () => void;
}

export function ContactDetail({ contact, onClose, onUpdate }: ContactDetailProps) {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [showAddInteraction, setShowAddInteraction] = useState(false);
    const [editedContact, setEditedContact] = useState(contact);
    const [newInteraction, setNewInteraction] = useState({
        type: 'note',
        notes: '',
    });

    useEffect(() => {
        loadInteractions();
    }, [contact.id]);

    const loadInteractions = async () => {
        try {
            const res = await fetch(`/api/contacts/${contact.id}/interactions`);
            if (res.ok) {
                const data = await res.json();
                setInteractions(data);
            }
        } catch (error) {
            console.error('Error loading interactions:', error);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/contacts/${contact.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: editedContact.full_name,
                    email: editedContact.email,
                    phone: editedContact.phone,
                    company: editedContact.company,
                    job_title: editedContact.job_title,
                    status: editedContact.status,
                    notes: editedContact.notes,
                }),
            });

            if (!res.ok) throw new Error('Erreur');
            toast.success('Contact mis à jour');
            setIsEditing(false);
            onUpdate();
        } catch (error) {
            console.error('Error updating contact:', error);
            toast.error('Erreur lors de la mise à jour');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) return;

        try {
            const res = await fetch(`/api/contacts/${contact.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Erreur');
            toast.success('Contact supprimé');
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Error deleting contact:', error);
            toast.error('Erreur lors de la suppression');
        }
    };

    const handleAddInteraction = async () => {
        if (!user || !newInteraction.notes.trim()) return;

        try {
            const res = await fetch(`/api/contacts/${contact.id}/interactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: newInteraction.type,
                    notes: newInteraction.notes,
                }),
            });

            if (!res.ok) throw new Error('Erreur');
            toast.success('Interaction ajoutée');
            setNewInteraction({ type: 'note', notes: '' });
            setShowAddInteraction(false);
            loadInteractions();
        } catch (error) {
            console.error('Error adding interaction:', error);
            toast.error('Erreur lors de l\'ajout');
        }
    };

    const statusColors: Record<string, string> = {
        lead: 'bg-slate-100 text-slate-700',
        prospect: 'bg-slate-100 text-slate-700',
        client: 'bg-slate-100 text-slate-700',
        partner: 'bg-slate-100 text-slate-700',
    };

    const interactionIcons: Record<string, any> = {
        note: MessageSquare,
        call: Phone,
        email: Mail,
        meeting: Video,
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-slate-200 bg-white px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-slate-200 text-lg font-semibold text-slate-900">
                            {contact.avatar_url ? (
                                <img src={contact.avatar_url} alt={contact.full_name} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                                contact.full_name?.[0]?.toUpperCase() || '?'
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">{contact.full_name}</h2>
                            {contact.company && <p className="text-sm text-slate-500">{contact.company}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <MaterialIconButton ariaLabel="Modifier" onClick={() => setIsEditing(!isEditing)} icon={<Edit2 className="h-5 w-5" />} />
                        <MaterialIconButton ariaLabel="Supprimer" onClick={handleDelete} variant="outlined" icon={<Trash2 className="h-5 w-5 text-red-600" />} />
                        <MaterialIconButton ariaLabel="Fermer" onClick={onClose} icon={<X className="h-5 w-5" />} />
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Status & Rating */}
                    <div className="flex items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusColors[contact.status || ''] || 'bg-slate-100 text-slate-700'}`}>
                            {contact.status || 'Non défini'}
                        </span>
                        <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className={`h-4 w-4 ${star <= (contact.rating || 0) ? 'fill-amber-400 text-amber-400' : 'fill-slate-300 text-slate-300'}`} />
                            ))}
                        </div>
                    </div>

                    {/* Contact Info */}
                    {isEditing ? (
                        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <input
                                type="text"
                                value={editedContact.full_name}
                                onChange={(e) => setEditedContact({ ...editedContact, full_name: e.target.value })}
                                className="input-modern"
                                placeholder="Nom"
                            />
                            <input
                                type="email"
                                value={editedContact.email || ''}
                                onChange={(e) => setEditedContact({ ...editedContact, email: e.target.value })}
                                className="input-modern"
                                placeholder="Email"
                            />
                            <input
                                type="text"
                                value={editedContact.phone || ''}
                                onChange={(e) => setEditedContact({ ...editedContact, phone: e.target.value })}
                                className="input-modern"
                                placeholder="Téléphone"
                            />
                            <input
                                type="text"
                                value={editedContact.company || ''}
                                onChange={(e) => setEditedContact({ ...editedContact, company: e.target.value })}
                                className="input-modern"
                                placeholder="Entreprise"
                            />
                            <select
                                value={editedContact.status || 'lead'}
                                onChange={(e) => setEditedContact({ ...editedContact, status: e.target.value })}
                                className="input-modern"
                            >
                                <option value="lead">Lead</option>
                                <option value="prospect">Prospect</option>
                                <option value="client">Client</option>
                                <option value="partner">Partenaire</option>
                            </select>
                            <textarea
                                value={editedContact.notes || ''}
                                onChange={(e) => setEditedContact({ ...editedContact, notes: e.target.value })}
                                rows={3}
                                className="input-modern resize-none"
                                placeholder="Notes"
                            />
                            <div className="flex gap-3">
                                <MaterialButton onClick={() => setIsEditing(false)} variant="outlined" className="flex-1 justify-center">
                                    Annuler
                                </MaterialButton>
                                <MaterialButton onClick={handleSave} disabled={loading} className="flex-1 justify-center">
                                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                                </MaterialButton>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {contact.email && (
                                <a href={`mailto:${contact.email}`} className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                    <span className="text-slate-700">{contact.email}</span>
                                </a>
                            )}
                            {contact.phone && (
                                <a href={`tel:${contact.phone}`} className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50">
                                    <Phone className="h-5 w-5 text-slate-400" />
                                    <span className="text-slate-700">{contact.phone}</span>
                                </a>
                            )}
                            {contact.company && (
                                <div className="flex items-center gap-3 p-3">
                                    <Building2 className="h-5 w-5 text-slate-400" />
                                    <span className="text-slate-700">{contact.company}{contact.job_title ? ` - ${contact.job_title}` : ''}</span>
                                </div>
                            )}
                            {contact.city && (
                                <div className="flex items-center gap-3 p-3">
                                    <MapPin className="h-5 w-5 text-slate-400" />
                                    <span className="text-slate-700">{[contact.city, contact.region, contact.country].filter(Boolean).join(', ')}</span>
                                </div>
                            )}
                            {contact.linkedin && (
                                <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50">
                                    <Linkedin className="h-5 w-5 text-slate-400" />
                                    <span className="text-slate-700 hover:underline">Profil LinkedIn</span>
                                </a>
                            )}
                            {contact.notes && (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="whitespace-pre-wrap text-sm text-slate-700">{contact.notes}</p>
                                </div>
                            )}
                            {contact.tags && contact.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 p-3">
                                    {contact.tags.map((tag) => (
                                        <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Interactions */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-900">Interactions</h3>
                            <MaterialButton onClick={() => setShowAddInteraction(!showAddInteraction)} icon={<Plus className="h-4 w-4" />} className="text-sm">
                                Ajouter
                            </MaterialButton>
                        </div>

                        {showAddInteraction && (
                            <div className="mb-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <select
                                    value={newInteraction.type}
                                    onChange={(e) => setNewInteraction({ ...newInteraction, type: e.target.value })}
                                    className="input-modern"
                                >
                                    <option value="note">Note</option>
                                    <option value="call">Appel</option>
                                    <option value="email">Email</option>
                                    <option value="meeting">Réunion</option>
                                </select>
                                <textarea
                                    value={newInteraction.notes}
                                    onChange={(e) => setNewInteraction({ ...newInteraction, notes: e.target.value })}
                                    rows={3}
                                    className="input-modern resize-none"
                                    placeholder="Détails de l'interaction..."
                                />
                                <div className="flex gap-2">
                                    <MaterialButton onClick={() => setShowAddInteraction(false)} variant="outlined">
                                        Annuler
                                    </MaterialButton>
                                    <MaterialButton onClick={handleAddInteraction} disabled={!newInteraction.notes.trim()}>
                                        Enregistrer
                                    </MaterialButton>
                                </div>
                            </div>
                        )}

                        {interactions.length === 0 ? (
                            <p className="py-6 text-center text-sm text-slate-500">Aucune interaction enregistrée</p>
                        ) : (
                            <div className="space-y-3">
                                {interactions.map((interaction) => {
                                    const Icon = interactionIcons[interaction.type] || MessageSquare;
                                    return (
                                        <div key={interaction.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white">
                                                <Icon className="h-4 w-4 text-slate-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-slate-700">{interaction.notes}</p>
                                                <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(interaction.date || interaction.created_at).toLocaleDateString('fr-FR', {
                                                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
