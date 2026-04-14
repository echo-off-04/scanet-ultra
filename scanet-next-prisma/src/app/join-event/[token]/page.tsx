'use client';

import { useState, useEffect, use } from 'react';
import { Calendar, MapPin, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

interface EventData {
    id: string;
    name: string;
    description: string;
    location: string;
    startDate: string;
}

export default function JoinEventPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const [event, setEvent] = useState<EventData | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        jobTitle: '',
    });

    useEffect(() => {
        loadEvent();
    }, [token]);

    const loadEvent = async () => {
        if (!token) {
            setError('Token invalide');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`/api/join-event/${token}`);
            if (!res.ok) {
                setError('Événement introuvable');
                return;
            }
            const data = await res.json();
            setEvent(data.event);
        } catch (err) {
            console.error('Error loading event:', err);
            setError('Erreur lors du chargement de l\'événement');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!event) return;

        if (!formData.firstName || !formData.lastName || !formData.email) {
            setError('Veuillez remplir tous les champs obligatoires');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch(`/api/join-event/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    company: formData.company,
                    job_title: formData.jobTitle,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erreur');
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Erreur lors de l\'inscription');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-[#0E3A5D] mx-auto mb-4" />
                    <p className="text-gray-600">Chargement de l&apos;événement...</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Inscription réussie !</h1>
                        <p className="text-gray-600">
                            Vous avez été ajouté à l&apos;événement <strong>{event?.name}</strong>. L&apos;organisateur vous contactera prochainement.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !event) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-10 h-10 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Événement introuvable</h1>
                        <p className="text-gray-600">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                    {/* Event Header */}
                    <div className="bg-gradient-to-r from-[#0E3A5D] to-[#1e5a8e] p-6 text-white">
                        <h1 className="text-2xl font-bold mb-2">{event?.name}</h1>
                        {event?.description && <p className="text-blue-100 text-sm mb-4">{event.description}</p>}
                        <div className="flex flex-wrap gap-4 text-sm">
                            {event?.startDate && (
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(event.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                            )}
                            {event?.location && (
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4" />
                                    {event.location}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form */}
                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Rejoindre cet événement</h2>

                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">{error}</div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData(p => ({ ...p, firstName: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D] focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData(p => ({ ...p, lastName: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D] focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D] focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D] focus:border-transparent"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
                                    <input
                                        type="text"
                                        value={formData.company}
                                        onChange={(e) => setFormData(p => ({ ...p, company: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D] focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Poste</label>
                                    <input
                                        type="text"
                                        value={formData.jobTitle}
                                        onChange={(e) => setFormData(p => ({ ...p, jobTitle: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D] focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-gradient-to-r from-[#0E3A5D] to-[#1e5a8e] text-white py-3 rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Inscription...
                                    </>
                                ) : (
                                    "S'inscrire à l'événement"
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 mt-4">
                    Propulsé par <span className="font-semibold text-[#0E3A5D]">ScaNetwork</span>
                </p>
            </div>
        </div>
    );
}
