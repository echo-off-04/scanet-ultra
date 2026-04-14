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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-3xl shadow-xl p-8">
                        <div className="flex justify-center mb-6">
                            <img src="https://i.ibb.co/q3YDjGLC/Scanetwork.png" alt="Scanetwork" className="h-14 object-contain" />
                        </div>
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8 text-green-600" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">Email envoyé !</h1>
                            <p className="text-gray-600">
                                Consultez votre boîte mail <span className="font-semibold">{email}</span> et cliquez sur le lien pour réinitialiser votre mot de passe.
                            </p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                            <p className="text-sm text-blue-800">
                                <strong>Note :</strong> Le lien de réinitialisation est valide pendant 1 heure. Si vous ne voyez pas l&apos;email, vérifiez votre dossier spam.
                            </p>
                        </div>
                        <Link href="/auth" className="flex items-center justify-center gap-2 text-[#0E3A5D] hover:text-[#1e5a8e] font-medium transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Retour à la connexion
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-3xl shadow-xl p-8">
                    <div className="flex justify-center mb-6">
                        <img src="https://i.ibb.co/q3YDjGLC/Scanetwork.png" alt="Scanetwork" className="h-14 object-contain" />
                    </div>
                    <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Mot de passe oublié ?</h1>
                    <p className="text-center text-gray-500 mb-8">
                        Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D] focus:border-transparent transition-all"
                                    placeholder="vous@exemple.com"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#0E3A5D] to-[#1e5a8e] text-white py-3 rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Envoi en cours...
                                </>
                            ) : (
                                'Envoyer le lien de réinitialisation'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link href="/auth" className="flex items-center justify-center gap-2 text-[#0E3A5D] hover:text-[#1e5a8e] font-medium transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Retour à la connexion
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
