'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';

export interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    company: string | null;
    job_title: string | null;
    phone: string | null;
    bio: string | null;
    website: string | null;
    linkedin: string | null;
    country: string | null;
    city: string | null;
    preferred_currency: string;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
}

interface AuthContextType {
    user: { id: string; email: string } | null;
    profile: Profile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, fullName: string) => Promise<void>;
    signOut: () => Promise<void>;
    updateProfile: (updates: Partial<Profile>) => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    const user = session?.user?.id
        ? { id: session.user.id, email: session.user.email || '' }
        : null;

    const loading = status === 'loading' || profileLoading;

    const loadProfile = useCallback(async () => {
        if (!session?.user?.id) return;
        setProfileLoading(true);
        try {
            const res = await fetch('/api/profile');
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    // Map both camelCase and snake_case for compatibility
                    setProfile({
                        id: data.id,
                        email: data.email,
                        full_name: data.full_name ?? data.fullName,
                        company: data.company,
                        job_title: data.job_title ?? data.jobTitle,
                        phone: data.phone,
                        bio: data.bio,
                        website: data.website,
                        linkedin: data.linkedin,
                        country: data.country,
                        city: data.city,
                        preferred_currency: data.preferred_currency ?? data.preferredCurrency ?? 'EUR',
                        avatar_url: data.avatar_url ?? data.avatarUrl,
                        created_at: data.created_at ?? data.createdAt,
                        updated_at: data.updated_at ?? data.updatedAt,
                    });
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setProfileLoading(false);
        }
    }, [session?.user?.id]);

    useEffect(() => {
        if (session?.user?.id) {
            loadProfile();
        } else {
            setProfile(null);
        }
    }, [session?.user?.id, loadProfile]);

    const refreshProfile = async () => {
        await loadProfile();
    };

    const updateProfile = async (updates: Partial<Profile>) => {
        if (!user) throw new Error('No user logged in');

        const res = await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });

        if (!res.ok) throw new Error('Failed to update profile');
        await loadProfile();
    };

    const signIn = async (email: string, password: string) => {
        const result = await nextAuthSignIn('credentials', {
            email,
            password,
            redirect: false,
        });

        if (result?.error) {
            throw new Error(result.error === 'CredentialsSignin'
                ? 'Email ou mot de passe incorrect'
                : result.error);
        }
    };

    const signUp = async (email: string, password: string, fullName: string) => {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, fullName }),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Erreur lors de l\'inscription');
        }

        // Auto sign in after registration
        await signIn(email, password);
    };

    const signOut = async () => {
        setProfile(null);
        await nextAuthSignOut({ redirect: false });
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, updateProfile, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
