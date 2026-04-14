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
                setContacts(data.filter((c: any) => c.email));
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
                    <h2 className="text-2xl font-bold text-gray-900">Planifier une relance</h2>
                    <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Destinataires */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <Users className="w-4 h-4 inline mr-1.5" />Destinataires ({selectedContacts.length})
                        </label>
                        {selectedContacts.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {selectedContacts.map(c => (
                                    <span key={c.id} className="flex items-center gap-1.5 px-3 py-1 bg-[#0E3A5D]/10 text-[#0E3A5D] rounded-full text-sm">
                                        {c.full_name}
                                        <button onClick={() => toggleContact(c)} className="hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                                    </span>
                                ))}
                            </div>
                        )}
                        <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Rechercher un contact..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E3A5D] text-sm"
                            />
                        </div>
                        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl">
                            {filteredContacts.map(contact => {
                                const isSelected = selectedContacts.some(c => c.id === contact.id);
                                return (
                                    <button
                                        key={contact.id}
                                        onClick={() => toggleContact(contact)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-[#0E3A5D]/5' : ''}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0E3A5D] to-[#1E5A8E] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                            {contact.full_name[0]?.toUpperCase()}
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{contact.full_name}</p>
                                            <p className="text-xs text-gray-500 truncate">{contact.email}</p>
                                        </div>
                                        {isSelected && <CheckCircle className="w-5 h-5 text-[#0E3A5D] flex-shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Contenu */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <Mail className="w-4 h-4 inline mr-1.5" />Objet
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E3A5D]"
                            placeholder="Ex: Suivi de notre rencontre"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={6}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E3A5D] resize-none"
                            placeholder="Votre message..."
                        />
                    </div>

                    {/* Planification */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1.5" />Date
                            </label>
                            <input
                                type="date"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E3A5D]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Heure</label>
                            <input
                                type="time"
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E3A5D]"
                            />
                        </div>
                    </div>

                    {showPreview && (
                        <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                            <h4 className="font-semibold text-gray-900 mb-2">Aperçu</h4>
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <p className="text-sm text-gray-500 mb-1">De: {profile?.full_name || profile?.email}</p>
                                <p className="text-sm text-gray-500 mb-3">À: {selectedContacts.map(c => c.email).join(', ')}</p>
                                <p className="font-semibold text-gray-900 mb-2">{subject}</p>
                                <p className="text-gray-700 whitespace-pre-wrap">{body}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex flex-col sm:flex-row gap-3 sm:justify-between rounded-b-3xl border-t">
                    <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100">
                        <Eye className="w-4 h-4" />{showPreview ? 'Masquer l\'aperçu' : 'Aperçu'}
                    </button>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100">Annuler</button>
                        <button onClick={handleSubmit} disabled={loading || !subject.trim() || !body.trim() || selectedContacts.length === 0}
                            className="px-6 py-3 bg-gradient-to-r from-[#0E3A5D] to-[#1E5A8E] text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50">
                            {loading ? 'Planification...' : 'Planifier l\'envoi'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
