'use client';

import { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Star, Mail, Phone, Building2, Briefcase, MapPin, Globe, Linkedin, MessageSquare, Calendar, Video, Send, Plus, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Contact, Interaction } from '@/types';

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
        lead: 'bg-blue-100 text-blue-700',
        prospect: 'bg-amber-100 text-amber-700',
        client: 'bg-emerald-100 text-emerald-700',
        partner: 'bg-purple-100 text-purple-700',
    };

    const interactionIcons: Record<string, any> = {
        note: MessageSquare,
        call: Phone,
        email: Mail,
        meeting: Video,
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0E3A5D] to-[#1E5A8E] flex items-center justify-center text-white font-bold text-lg">
                            {contact.avatar_url ? (
                                <img src={contact.avatar_url} alt={contact.full_name} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                                contact.full_name?.[0]?.toUpperCase() || '?'
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{contact.full_name}</h2>
                            {contact.company && <p className="text-sm text-gray-500">{contact.company}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsEditing(!isEditing)} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center">
                            <Edit2 className="w-5 h-5 text-gray-600" />
                        </button>
                        <button onClick={handleDelete} className="w-10 h-10 rounded-full hover:bg-red-50 flex items-center justify-center">
                            <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                        <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Status & Rating */}
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[contact.status || ''] || 'bg-gray-100 text-gray-700'}`}>
                            {contact.status || 'Non défini'}
                        </span>
                        <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className={`w-4 h-4 ${star <= (contact.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                            ))}
                        </div>
                    </div>

                    {/* Contact Info */}
                    {isEditing ? (
                        <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                            <input
                                type="text"
                                value={editedContact.full_name}
                                onChange={(e) => setEditedContact({ ...editedContact, full_name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                                placeholder="Nom"
                            />
                            <input
                                type="email"
                                value={editedContact.email || ''}
                                onChange={(e) => setEditedContact({ ...editedContact, email: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                                placeholder="Email"
                            />
                            <input
                                type="text"
                                value={editedContact.phone || ''}
                                onChange={(e) => setEditedContact({ ...editedContact, phone: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                                placeholder="Téléphone"
                            />
                            <input
                                type="text"
                                value={editedContact.company || ''}
                                onChange={(e) => setEditedContact({ ...editedContact, company: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                                placeholder="Entreprise"
                            />
                            <select
                                value={editedContact.status || 'lead'}
                                onChange={(e) => setEditedContact({ ...editedContact, status: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl"
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl resize-none"
                                placeholder="Notes"
                            />
                            <div className="flex gap-3">
                                <button onClick={() => setIsEditing(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50">
                                    Annuler
                                </button>
                                <button onClick={handleSave} disabled={loading} className="flex-1 px-4 py-2 bg-[#0E3A5D] text-white rounded-xl hover:bg-[#1E5A8E] disabled:opacity-50">
                                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {contact.email && (
                                <a href={`mailto:${contact.email}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                    <span className="text-gray-700">{contact.email}</span>
                                </a>
                            )}
                            {contact.phone && (
                                <a href={`tel:${contact.phone}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                    <Phone className="w-5 h-5 text-gray-400" />
                                    <span className="text-gray-700">{contact.phone}</span>
                                </a>
                            )}
                            {contact.company && (
                                <div className="flex items-center gap-3 p-3">
                                    <Building2 className="w-5 h-5 text-gray-400" />
                                    <span className="text-gray-700">{contact.company}{contact.job_title ? ` - ${contact.job_title}` : ''}</span>
                                </div>
                            )}
                            {contact.city && (
                                <div className="flex items-center gap-3 p-3">
                                    <MapPin className="w-5 h-5 text-gray-400" />
                                    <span className="text-gray-700">{[contact.city, contact.region, contact.country].filter(Boolean).join(', ')}</span>
                                </div>
                            )}
                            {contact.linkedin && (
                                <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                    <Linkedin className="w-5 h-5 text-gray-400" />
                                    <span className="text-blue-600 hover:underline">Profil LinkedIn</span>
                                </a>
                            )}
                            {contact.notes && (
                                <div className="p-4 bg-yellow-50 rounded-xl">
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.notes}</p>
                                </div>
                            )}
                            {contact.tags && contact.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 p-3">
                                    {contact.tags.map((tag) => (
                                        <span key={tag} className="px-3 py-1 bg-[#0E3A5D]/10 text-[#0E3A5D] rounded-full text-sm">{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Interactions */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Interactions</h3>
                            <button
                                onClick={() => setShowAddInteraction(!showAddInteraction)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#0E3A5D] text-white rounded-lg hover:bg-[#1E5A8E]"
                            >
                                <Plus className="w-4 h-4" />
                                Ajouter
                            </button>
                        </div>

                        {showAddInteraction && (
                            <div className="mb-4 p-4 bg-gray-50 rounded-xl space-y-3">
                                <select
                                    value={newInteraction.type}
                                    onChange={(e) => setNewInteraction({ ...newInteraction, type: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl"
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
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl resize-none"
                                    placeholder="Détails de l'interaction..."
                                />
                                <div className="flex gap-2">
                                    <button onClick={() => setShowAddInteraction(false)} className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50">
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleAddInteraction}
                                        disabled={!newInteraction.notes.trim()}
                                        className="px-4 py-2 bg-[#0E3A5D] text-white rounded-xl hover:bg-[#1E5A8E] disabled:opacity-50"
                                    >
                                        Enregistrer
                                    </button>
                                </div>
                            </div>
                        )}

                        {interactions.length === 0 ? (
                            <p className="text-center text-gray-500 py-6 text-sm">Aucune interaction enregistrée</p>
                        ) : (
                            <div className="space-y-3">
                                {interactions.map((interaction) => {
                                    const Icon = interactionIcons[interaction.type] || MessageSquare;
                                    return (
                                        <div key={interaction.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                                                <Icon className="w-4 h-4 text-gray-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-700">{interaction.notes}</p>
                                                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
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
