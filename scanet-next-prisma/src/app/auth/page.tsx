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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex">
            {/* Left side - Branding (hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0E3A5D 0%, #1e5a8e 100%)' }}>
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center px-12 text-white">
                    <div className="mb-8">
                        <img
                            src="https://i.ibb.co/q3YDjGLC/Scanetwork.png"
                            alt="Scanetwork"
                            className="h-16 object-contain"
                        />
                    </div>

                    <h2 className="text-4xl font-bold mb-4 leading-tight">
                        Transformez vos rencontres<br />en opportunités
                    </h2>
                    <p className="text-xl text-blue-100 mb-12 max-w-md">
                        La plateforme de networking qui centralise vos contacts professionnels et automatise vos suivis commerciaux.
                    </p>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
                            <p className="text-3xl font-bold">+150%</p>
                            <p className="text-sm text-blue-100">Conversions</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
                            <p className="text-3xl font-bold">10k+</p>
                            <p className="text-sm text-blue-100">Utilisateurs</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
                            <p className="text-3xl font-bold">98%</p>
                            <p className="text-sm text-blue-100">Satisfaction</p>
                        </div>
                    </div>

                    <div className="mt-12 bg-white/10 backdrop-blur rounded-2xl p-6">
                        <p className="text-blue-50 italic mb-4">
                            &ldquo;Scanetwork a révolutionné ma façon de gérer mes contacts. Je n&apos;oublie plus jamais de relancer un prospect !&rdquo;
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">M</div>
                            <div>
                                <p className="font-semibold">Marie Dupont</p>
                                <p className="text-sm text-blue-200">Directrice Commerciale</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - Form */}
            <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
                <div className="w-full max-w-md">
                    <div className={`bg-white rounded-3xl shadow-xl p-8 transition-all ${formShake ? 'animate-shake' : ''}`}>
                        <div className="flex justify-center mb-6">
                            <img src="https://i.ibb.co/q3YDjGLC/Scanetwork.png" alt="Scanetwork" className="h-14 object-contain" />
                        </div>

                        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
                            {isSignUp ? 'Créer un compte' : 'Bienvenue'}
                        </h1>
                        <p className="text-center text-gray-500 mb-8">
                            {isSignUp ? 'Commencez à gérer votre réseau professionnel' : 'Connectez-vous pour accéder à vos contacts'}
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {isSignUp && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D] focus:border-transparent transition-all"
                                            placeholder="Jean Dupont"
                                            required={isSignUp}
                                        />
                                    </div>
                                </div>
                            )}

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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
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
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                                    </button>
                                </div>

                                {isSignUp && password.length > 0 && (
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

                            {!isSignUp && (
                                <div className="text-right">
                                    <Link href="/forgot-password" className="text-sm text-[#0E3A5D] hover:text-[#1e5a8e] font-medium transition-colors">
                                        Mot de passe oublié ?
                                    </Link>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-red-500 text-xs">!</span>
                                    </div>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-[#0E3A5D] to-[#1e5a8e] text-white py-3 rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                                className="text-[#0E3A5D] hover:text-[#1e5a8e] font-medium transition-colors"
                            >
                                {isSignUp ? 'Déjà un compte ? Connectez-vous' : "Pas encore de compte ? Inscrivez-vous"}
                            </button>
                        </div>

                        <p className="mt-8 text-center text-xs text-gray-400">
                            En continuant, vous acceptez nos{' '}
                            <a href="#" className="text-[#0E3A5D] hover:underline">Conditions d&apos;utilisation</a>{' '}
                            et notre{' '}
                            <a href="#" className="text-[#0E3A5D] hover:underline">Politique de confidentialité</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
