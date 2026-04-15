'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erreur lors de l\'envoi');
            }

            setEmailSent(true);
            toast.success('Email de réinitialisation envoyé !');
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de l\'envoi de l\'email');
        } finally {
            setLoading(false);
        }
    };

    if (emailSent) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
                <div className="w-full max-w-md">
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="mb-6 flex justify-center">
                            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                                Scanetwork
                            </div>
                        </div>
                        <div className="mb-8 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                <Mail className="h-8 w-8 text-green-600" />
                            </div>
                            <h1 className="mb-2 text-3xl font-semibold text-slate-900">Email envoyé !</h1>
                            <p className="text-slate-600">
                                Consultez votre boîte mail <span className="font-semibold">{email}</span> et cliquez sur le lien pour réinitialiser votre mot de passe.
                            </p>
                        </div>
                        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm text-slate-600">
                                <strong>Note :</strong> Le lien de réinitialisation est valide pendant 1 heure. Si vous ne voyez pas l&apos;email, vérifiez votre dossier spam.
                            </p>
                        </div>
                        <Link href="/auth" className="flex items-center justify-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
                            <ArrowLeft className="h-4 w-4" />
                            Retour à la connexion
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="mb-6 flex justify-center">
                        <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                            Scanetwork
                        </div>
                    </div>
                    <h1 className="mb-2 text-center text-3xl font-semibold text-slate-900">Mot de passe oublié ?</h1>
                    <p className="mb-8 text-center text-sm text-slate-500">
                        Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-modern pl-10 pr-4"
                                    placeholder="vous@exemple.com"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full justify-center py-3 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                    Envoi en cours...
                                </>
                            ) : (
                                'Envoyer le lien de réinitialisation'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link href="/auth" className="flex items-center justify-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
                            <ArrowLeft className="h-4 w-4" />
                            Retour à la connexion
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
