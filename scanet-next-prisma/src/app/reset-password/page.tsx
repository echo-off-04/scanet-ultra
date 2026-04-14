'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score, label: 'Faible', color: 'bg-red-500' };
    if (score <= 2) return { score, label: 'Moyen', color: 'bg-yellow-500' };
    if (score <= 3) return { score, label: 'Bon', color: 'bg-blue-500' };
    return { score, label: 'Excellent', color: 'bg-green-500' };
};

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token') || '';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const passwordStrength = getPasswordStrength(password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Les mots de passe ne correspondent pas');
            return;
        }

        if (password.length < 6) {
            toast.error('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erreur lors de la réinitialisation');
            }

            toast.success('Mot de passe réinitialisé avec succès !');
            setTimeout(() => router.push('/auth'), 1500);
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de la réinitialisation du mot de passe');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-3xl shadow-xl p-8">
                    <div className="flex justify-center mb-6">
                        <img src="https://i.ibb.co/q3YDjGLC/Scanetwork.png" alt="Scanetwork" className="h-14 object-contain" />
                    </div>

                    <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Nouveau mot de passe</h1>
                    <p className="text-center text-gray-500 mb-8">
                        Choisissez un nouveau mot de passe sécurisé pour votre compte.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D] focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors" tabIndex={-1}>
                                    {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                                </button>
                            </div>

                            {password.length > 0 && (
                                <div className="mt-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div className={`h-full transition-all duration-300 ${passwordStrength.color}`} style={{ width: `${(passwordStrength.score / 5) * 100}%` }} />
                                        </div>
                                        <span className={`text-xs font-medium ${passwordStrength.score <= 1 ? 'text-red-500' : passwordStrength.score <= 2 ? 'text-yellow-500' : passwordStrength.score <= 3 ? 'text-blue-500' : 'text-green-500'}`}>
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                        <span className={password.length >= 8 ? 'text-green-500' : ''}>
                                            {password.length >= 8 ? <CheckCircle className="w-3 h-3 inline mr-1" /> : '○'} 8+ caractères
                                        </span>
                                        <span className={/[A-Z]/.test(password) ? 'text-green-500' : ''}>
                                            {/[A-Z]/.test(password) ? <CheckCircle className="w-3 h-3 inline mr-1" /> : '○'} Majuscule
                                        </span>
                                        <span className={/[0-9]/.test(password) ? 'text-green-500' : ''}>
                                            {/[0-9]/.test(password) ? <CheckCircle className="w-3 h-3 inline mr-1" /> : '○'} Chiffre
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D] focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors" tabIndex={-1}>
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                                </button>
                            </div>
                            {confirmPassword && password !== confirmPassword && (
                                <p className="mt-1 text-sm text-red-500">Les mots de passe ne correspondent pas</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || password !== confirmPassword}
                            className="w-full bg-gradient-to-r from-[#0E3A5D] to-[#1e5a8e] text-white py-3 rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Réinitialisation...
                                </>
                            ) : (
                                'Réinitialiser le mot de passe'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-600"></div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
