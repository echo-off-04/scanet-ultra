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
        <div className="flex min-h-screen items-center justify-center px-4 py-10" style={{
            background: 'radial-gradient(circle at top left, rgba(0, 87, 184, 0.08), transparent 40%), radial-gradient(circle at bottom right, rgba(83, 99, 112, 0.05), transparent 40%), linear-gradient(180deg, #f8fbfe 0%, #f0f4f8 100%)',
        }}>
            <div className="w-full max-w-md">
                <div className="rounded-[24px] border border-[rgba(201,212,223,0.9)] bg-white p-8 shadow-[0_24px_48px_rgba(15,35,58,0.05)]">
                    <div className="mb-6 flex justify-center">
                        <img src="/logo.png" alt="Scanetwork" className="h-16 w-16 rounded-2xl object-cover" />
                    </div>

                    <h1 className="mb-2 text-center text-3xl font-semibold text-slate-900">Nouveau mot de passe</h1>
                    <p className="mb-8 text-center text-sm text-slate-500">
                        Choisissez un nouveau mot de passe sécurisé pour votre compte.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Nouveau mot de passe</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-modern pl-10 pr-12"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600" tabIndex={-1}>
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>

                            {password.length > 0 && (
                                <div className="mt-2">
                                    <div className="mb-1 flex items-center gap-2">
                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                                            <div className={`h-full transition-all duration-300 ${passwordStrength.color}`} style={{ width: `${(passwordStrength.score / 5) * 100}%` }} />
                                        </div>
                                        <span className={`text-xs font-medium ${passwordStrength.score <= 1 ? 'text-red-500' : passwordStrength.score <= 2 ? 'text-yellow-600' : passwordStrength.score <= 3 ? 'text-blue-600' : 'text-green-600'}`}>
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                                        <span className={password.length >= 8 ? 'text-green-600' : ''}>
                                            {password.length >= 8 ? <CheckCircle className="mr-1 inline h-3 w-3" /> : '○'} 8+ caractères
                                        </span>
                                        <span className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                                            {/[A-Z]/.test(password) ? <CheckCircle className="mr-1 inline h-3 w-3" /> : '○'} Majuscule
                                        </span>
                                        <span className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
                                            {/[0-9]/.test(password) ? <CheckCircle className="mr-1 inline h-3 w-3" /> : '○'} Chiffre
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Confirmer le mot de passe</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="input-modern pl-10 pr-12"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600" tabIndex={-1}>
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {confirmPassword && password !== confirmPassword && (
                                <p className="mt-1 text-sm text-red-500">Les mots de passe ne correspondent pas</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || password !== confirmPassword}
                            className="btn-primary w-full justify-center py-3 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
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
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"></div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
