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
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
                <div className="text-center">
                    <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-slate-700" />
                    <p className="text-sm font-medium text-slate-600">Chargement de l&apos;événement...</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
                <div className="w-full max-w-md">
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <h1 className="mb-2 text-2xl font-semibold text-slate-900">Inscription réussie !</h1>
                        <p className="text-slate-600">
                            Vous avez été ajouté à l&apos;événement <strong>{event?.name}</strong>. L&apos;organisateur vous contactera prochainement.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !event) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
                <div className="w-full max-w-md">
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                            <AlertCircle className="h-10 w-10 text-red-600" />
                        </div>
                        <h1 className="mb-2 text-2xl font-semibold text-slate-900">Événement introuvable</h1>
                        <p className="text-slate-600">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-lg">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-slate-50 p-6">
                        <div className="mb-3 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                            Événement
                        </div>
                        <h1 className="mb-2 text-2xl font-semibold text-slate-900">{event?.name}</h1>
                        {event?.description && <p className="mb-4 text-sm text-slate-600">{event.description}</p>}
                        <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                            {event?.startDate && (
                                <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(event.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                            )}
                            {event?.location && (
                                <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                                    <MapPin className="h-4 w-4" />
                                    {event.location}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6">
                        <h2 className="mb-4 text-lg font-semibold text-slate-900">Rejoindre cet événement</h2>

                        {error && (
                            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Prénom *</label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData(p => ({ ...p, firstName: e.target.value }))}
                                        className="input-modern"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Nom *</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData(p => ({ ...p, lastName: e.target.value }))}
                                        className="input-modern"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                                    className="input-modern"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Téléphone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                                    className="input-modern"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Entreprise</label>
                                    <input
                                        type="text"
                                        value={formData.company}
                                        onChange={(e) => setFormData(p => ({ ...p, company: e.target.value }))}
                                        className="input-modern"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Poste</label>
                                    <input
                                        type="text"
                                        value={formData.jobTitle}
                                        onChange={(e) => setFormData(p => ({ ...p, jobTitle: e.target.value }))}
                                        className="input-modern"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="btn-primary w-full justify-center py-3 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Inscription...
                                    </>
                                ) : (
                                    "S'inscrire à l'événement"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
