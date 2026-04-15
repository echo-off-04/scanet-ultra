'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Mail, Lock, User, Eye, EyeOff, CheckCircle } from 'lucide-react';

const errorMessages: Record<string, string> = {
    'Invalid login credentials': 'Identifiants de connexion invalides',
    'User already registered': 'Un compte existe déjà avec cet email',
    'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères',
    'Invalid email': 'Adresse email invalide',
    'Email not confirmed': 'Veuillez confirmer votre adresse email',
    'Please enter your full name': 'Veuillez entrer votre nom complet',
    'An error occurred': 'Une erreur est survenue',
    'Network request failed': 'Erreur de connexion au serveur',
    'CredentialsSignin': 'Email ou mot de passe incorrect',
    'Email ou mot de passe incorrect': 'Email ou mot de passe incorrect',
};

const translateError = (error: string): string => {
    return errorMessages[error] || error;
};

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

export default function AuthPage() {
    const router = useRouter();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formShake, setFormShake] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isSignUp) {
                if (!fullName.trim()) {
                    throw new Error('Please enter your full name');
                }

                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, fullName }),
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'An error occurred');
                }

                // Auto sign in after registration
                const result = await signIn('credentials', {
                    email,
                    password,
                    redirect: false,
                });

                if (result?.error) throw new Error(result.error);
                router.push('/');
            } else {
                const result = await signIn('credentials', {
                    email,
                    password,
                    redirect: false,
                });

                if (result?.error) throw new Error(result.error);
                router.push('/');
            }
        } catch (err: any) {
            const errorMsg = translateError(err.message || 'An error occurred');
            setError(errorMsg);
            setFormShake(true);
            setTimeout(() => setFormShake(false), 500);
        } finally {
            setLoading(false);
        }
    };

    const passwordStrength = getPasswordStrength(password);

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
            <div className="w-full max-w-md">
                <div className={`rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all ${formShake ? 'animate-shake' : ''}`}>
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                            Scanet
                        </div>
                        <h1 className="mb-2 text-3xl font-semibold text-slate-900">
                            {isSignUp ? 'Créer un compte' : 'Bienvenue'}
                        </h1>
                        <p className="text-sm text-slate-500">
                            {isSignUp ? 'Commencez à gérer votre réseau professionnel' : 'Connectez-vous pour accéder à vos contacts'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isSignUp && (
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Nom complet</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="input-modern pl-10 pr-4"
                                        placeholder="Jean Dupont"
                                        required={isSignUp}
                                    />
                                </div>
                            </div>
                        )}

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

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Mot de passe</label>
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
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>

                            {isSignUp && password.length > 0 && (
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

                        {!isSignUp && (
                            <div className="text-right">
                                <Link href="/forgot-password" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
                                    Mot de passe oublié ?
                                </Link>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-xs text-red-500">
                                    !
                                </div>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full justify-center py-3 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                    Chargement...
                                </>
                            ) : (
                                isSignUp ? "S'inscrire" : 'Se connecter'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => { setIsSignUp(!isSignUp); setError(''); setPassword(''); }}
                            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                        >
                            {isSignUp ? 'Déjà un compte ? Connectez-vous' : "Pas encore de compte ? Inscrivez-vous"}
                        </button>
                    </div>

                    <p className="mt-8 text-center text-xs text-slate-400">
                        En continuant, vous acceptez nos{' '}
                        <a href="#" className="font-medium text-slate-500 hover:text-slate-900 hover:underline">Conditions d&apos;utilisation</a>{' '}
                        et notre{' '}
                        <a href="#" className="font-medium text-slate-500 hover:text-slate-900 hover:underline">Politique de confidentialité</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
