'use client';

import { useState, useEffect } from 'react';
import { X, Search, CheckCircle, Users, Mail, Eye, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ScheduleEmailModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

interface ContactForEmail {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    company: string | null;
}

export default function ScheduleEmailModal({ onClose, onSuccess }: ScheduleEmailModalProps) {
    const { user, profile } = useAuth();
    const [contacts, setContacts] = useState<ContactForEmail[]>([]);
    const [selectedContacts, setSelectedContacts] = useState<ContactForEmail[]>([]);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('09:00');
    const [showPreview, setShowPreview] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadContacts();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setScheduledDate(tomorrow.toISOString().split('T')[0]);
    }, []);

    const loadContacts = async () => {
        try {
            const res = await fetch('/api/contacts?has_email=true');
            if (res.ok) {
                const data = await res.json();
                setContacts((data.contacts || []).filter((c: any) => c.email));
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
        }
    };

    const handleSubmit = async () => {
        if (!user || !subject.trim() || !body.trim() || selectedContacts.length === 0 || !scheduledDate) {
            toast.error('Veuillez remplir tous les champs');
            return;
        }

        const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`);
        if (scheduledFor <= new Date()) {
            toast.error('La date doit être dans le futur');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/email/scheduled', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject,
                    body,
                    scheduled_for: scheduledFor.toISOString(),
                    recipients: selectedContacts.map(c => ({ contact_id: c.id, email: c.email })),
                }),
            });

            if (!res.ok) throw new Error('Erreur');
            toast.success('Relance planifiée avec succès');
            onSuccess();
        } catch (error) {
            console.error('Error scheduling email:', error);
            toast.error('Erreur lors de la planification');
        } finally {
            setLoading(false);
        }
    };

    const toggleContact = (contact: ContactForEmail) => {
        setSelectedContacts(prev =>
            prev.find(c => c.id === contact.id)
                ? prev.filter(c => c.id !== contact.id)
                : [...prev, contact]
        );
    };

    const filteredContacts = contacts.filter(c =>
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.company || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-slate-200 bg-white px-6 py-4">
                    <h2 className="text-2xl font-semibold text-slate-900">Planifier une relance</h2>
                    <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Destinataires */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            <Users className="mr-1.5 inline h-4 w-4" />Destinataires ({selectedContacts.length})
                        </label>
                        {selectedContacts.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {selectedContacts.map(c => (
                                    <span key={c.id} className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                                        {c.full_name}
                                        <button onClick={() => toggleContact(c)} className="hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                                    </span>
                                ))}
                            </div>
                        )}
                        <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Rechercher un contact..."
                                className="input-modern py-2.5 pl-10 text-sm"
                            />
                        </div>
                        <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200">
                            {filteredContacts.map(contact => {
                                const isSelected = selectedContacts.some(c => c.id === contact.id);
                                return (
                                    <button
                                        key={contact.id}
                                        onClick={() => toggleContact(contact)}
                                        className={`flex w-full items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50 ${isSelected ? 'bg-slate-100' : ''}`}
                                    >
                                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-200 text-xs font-semibold text-slate-900">
                                            {contact.full_name[0]?.toUpperCase()}
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className="truncate text-sm font-medium text-slate-900">{contact.full_name}</p>
                                            <p className="truncate text-xs text-slate-500">{contact.email}</p>
                                        </div>
                                        {isSelected && <CheckCircle className="h-5 w-5 flex-shrink-0 text-slate-700" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Contenu */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            <Mail className="mr-1.5 inline h-4 w-4" />Objet
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="input-modern"
                            placeholder="Ex: Suivi de notre rencontre"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Message</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={6}
                            className="input-modern resize-none"
                            placeholder="Votre message..."
                        />
                    </div>

                    {/* Planification */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                <Calendar className="mr-1.5 inline h-4 w-4" />Date
                            </label>
                            <input
                                type="date"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                className="input-modern"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Heure</label>
                            <input
                                type="time"
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                                className="input-modern"
                            />
                        </div>
                    </div>

                    {showPreview && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                            <h4 className="mb-2 font-semibold text-slate-900">Aperçu</h4>
                            <div className="rounded-lg border border-slate-200 bg-white p-4">
                                <p className="mb-1 text-sm text-slate-500">De: {profile?.full_name || profile?.email}</p>
                                <p className="mb-3 text-sm text-slate-500">À: {selectedContacts.map(c => c.email).join(', ')}</p>
                                <p className="mb-2 font-semibold text-slate-900">{subject}</p>
                                <p className="whitespace-pre-wrap text-slate-700">{body}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="sticky bottom-0 flex flex-col gap-3 rounded-b-2xl border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-between">
                    <button onClick={() => setShowPreview(!showPreview)} className="btn-secondary gap-2 px-4 py-2.5 text-slate-700">
                        <Eye className="h-4 w-4" />{showPreview ? 'Masquer l\'aperçu' : 'Aperçu'}
                    </button>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="btn-secondary">Annuler</button>
                        <button onClick={handleSubmit} disabled={loading || !subject.trim() || !body.trim() || selectedContacts.length === 0}
                            className="btn-primary disabled:opacity-50">
                            {loading ? 'Planification...' : 'Planifier l\'envoi'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
