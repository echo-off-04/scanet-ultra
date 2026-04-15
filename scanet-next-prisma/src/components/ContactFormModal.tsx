'use client';

import { useState, useEffect } from 'react';
import { X, Star, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PhoneInput } from './PhoneInput';

interface ContactFormModalProps {
    onClose: () => void;
    onSuccess: () => void;
    eventId?: string;
    mode?: 'create' | 'edit';
    contactId?: string;
}

export function ContactFormModal({ onClose, onSuccess, eventId, mode = 'create', contactId }: ContactFormModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        company: '',
        job_title: '',
        linkedin_url: '',
        status: 'lead',
        rating: 0,
        tags: [] as string[],
        notes: '',
        source: eventId ? 'event' : 'manual',
        is_member: false,
    });
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        if (mode === 'edit' && contactId) {
            loadContact();
        }
    }, [contactId, mode]);

    const loadContact = async () => {
        try {
            const res = await fetch(`/api/contacts/${contactId}`);
            if (res.ok) {
                const contact = await res.json();
                setFormData({
                    full_name: contact.full_name || '',
                    email: contact.email || '',
                    phone: contact.phone || '',
                    company: contact.company || '',
                    job_title: contact.job_title || '',
                    linkedin_url: contact.linkedin || '',
                    status: contact.status || 'lead',
                    rating: contact.rating || 0,
                    tags: contact.tags || [],
                    notes: contact.notes || '',
                    source: contact.source || 'manual',
                    is_member: contact.is_member || false,
                });
            }
        } catch (error) {
            console.error('Error loading contact:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !formData.full_name.trim()) return;

        setLoading(true);
        try {
            const url = mode === 'edit' ? `/api/contacts/${contactId}` : '/api/contacts';
            const method = mode === 'edit' ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    event_id: eventId,
                }),
            });

            if (!res.ok) throw new Error('Erreur');

            toast.success(mode === 'edit' ? 'Contact modifié' : 'Contact créé avec succès');
            onSuccess();
        } catch (error) {
            console.error('Error saving contact:', error);
            toast.error('Erreur lors de la sauvegarde');
        } finally {
            setLoading(false);
        }
    };

    const addTag = () => {
        const tag = tagInput.trim();
        if (tag && !formData.tags.includes(tag)) {
            setFormData({ ...formData, tags: [...formData.tags, tag] });
            setTagInput('');
        }
    };

    const removeTag = (tag: string) => {
        setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-slate-200 bg-white px-6 py-4">
                    <h2 className="text-2xl font-semibold text-slate-900">
                        {mode === 'edit' ? 'Modifier le contact' : 'Nouveau contact'}
                    </h2>
                    <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Nom complet *</label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="input-modern"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="input-modern"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Téléphone</label>
                            <PhoneInput value={formData.phone} onChange={(val) => setFormData({ ...formData, phone: val })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Entreprise</label>
                            <input
                                type="text"
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                className="input-modern"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Poste</label>
                            <input
                                type="text"
                                value={formData.job_title}
                                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                                className="input-modern"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">LinkedIn</label>
                        <input
                            type="url"
                            value={formData.linkedin_url}
                            onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                            className="input-modern"
                            placeholder="https://linkedin.com/in/..."
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Statut</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="input-modern"
                            >
                                <option value="lead">Lead</option>
                                <option value="prospect">Prospect</option>
                                <option value="client">Client</option>
                                <option value="partner">Partenaire</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Source</label>
                            <select
                                value={formData.source}
                                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                className="input-modern"
                            >
                                <option value="manual">Manuel</option>
                                <option value="event">Événement</option>
                                <option value="referral">Recommandation</option>
                                <option value="website">Site web</option>
                                <option value="linkedin">LinkedIn</option>
                                <option value="other">Autre</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Note</label>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, rating: formData.rating === star ? 0 : star })}
                                    className="p-1"
                                >
                                    <Star className={`h-6 w-6 ${star <= formData.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-300 text-slate-300'}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Tags</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {formData.tags.map((tag) => (
                                <span key={tag} className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                                    {tag}
                                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-600">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                                className="input-modern flex-1 text-sm"
                                placeholder="Ajouter un tag..."
                            />
                            <button type="button" onClick={addTag} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200">
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            className="input-modern resize-none"
                        />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.is_member}
                            onChange={(e) => setFormData({ ...formData, is_member: e.target.checked })}
                            className="h-4 w-4 rounded border-slate-300 text-slate-900"
                        />
                        <span className="text-sm text-slate-700">Membre de mon entreprise</span>
                    </label>

                    <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1">
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.full_name.trim()}
                            className="btn-primary flex-1 disabled:opacity-50"
                        >
                            {loading ? 'Enregistrement...' : mode === 'edit' ? 'Modifier' : 'Créer le contact'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
