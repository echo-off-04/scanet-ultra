'use client';

import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PhoneInput } from './PhoneInput';

interface QuickAddContactFormProps {
    eventId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function QuickAddContactForm({ eventId, onClose, onSuccess }: QuickAddContactFormProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        company: '',
        job_title: '',
        status: 'lead',
        source: 'event',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !formData.full_name.trim()) return;

        setLoading(true);
        try {
            const res = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, event_id: eventId }),
            });

            if (!res.ok) throw new Error('Erreur lors de la création');

            toast.success('Contact ajouté avec succès');
            onSuccess();
        } catch (error) {
            console.error('Error creating contact:', error);
            toast.error('Erreur lors de la création du contact');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Ajout rapide</h3>
                <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <input
                    type="text"
                    placeholder="Nom complet *"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E3A5D] focus:border-transparent text-sm"
                    required
                />

                <div className="grid grid-cols-2 gap-3">
                    <input
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E3A5D] focus:border-transparent text-sm"
                    />
                    <PhoneInput
                        value={formData.phone}
                        onChange={(val) => setFormData({ ...formData, phone: val })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <input
                        type="text"
                        placeholder="Entreprise"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E3A5D] focus:border-transparent text-sm"
                    />
                    <input
                        type="text"
                        placeholder="Poste"
                        value={formData.job_title}
                        onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E3A5D] focus:border-transparent text-sm"
                    />
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !formData.full_name.trim()}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0E3A5D] text-white rounded-xl font-medium hover:bg-[#1E5A8E] disabled:opacity-50"
                    >
                        <UserPlus className="w-4 h-4" />
                        {loading ? 'Ajout...' : 'Ajouter'}
                    </button>
                </div>
            </form>
        </div>
    );
}
