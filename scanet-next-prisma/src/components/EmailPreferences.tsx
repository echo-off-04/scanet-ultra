'use client';

import { useState, useEffect } from 'react';
import { Mail, Bell, Clock, ToggleLeft, ToggleRight, History, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { EmailLogs } from './EmailLogs';
import { MaterialButton } from './material/MaterialButton';

interface EmailPreferencesProps {
    onClose?: () => void;
}

interface Preferences {
    welcome_emails: boolean;
    notification_emails: boolean;
    marketing_emails: boolean;
    opportunity_emails: boolean;
    event_emails: boolean;
    digest_frequency: 'never' | 'daily' | 'weekly' | 'monthly';
}

export function EmailPreferences({ onClose }: EmailPreferencesProps) {
    const { user } = useAuth();
    const [preferences, setPreferences] = useState<Preferences>({
        welcome_emails: true,
        notification_emails: true,
        marketing_emails: false,
        opportunity_emails: true,
        event_emails: true,
        digest_frequency: 'weekly',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'preferences' | 'history'>('preferences');

    useEffect(() => {
        if (user) loadPreferences();
    }, [user]);

    const loadPreferences = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/email/preferences');
            if (res.ok) {
                const data = await res.json();
                setPreferences(prev => ({ ...prev, ...data }));
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    const savePreferences = async (updates: Partial<Preferences>) => {
        const newPrefs = { ...preferences, ...updates };
        setPreferences(newPrefs);
        setSaving(true);
        try {
            const res = await fetch('/api/email/preferences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPrefs),
            });
            if (!res.ok) throw new Error('Erreur');
            toast.success('Préférences mises à jour');
        } catch (error) {
            console.error('Error saving preferences:', error);
            toast.error('Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
        <button type="button" onClick={onChange} className="flex-shrink-0">
            {enabled ? (
                <ToggleRight className="h-10 w-10 text-slate-700" />
            ) : (
                <ToggleLeft className="h-10 w-10 text-slate-300" />
            )}
        </button>
    );

    const categories = [
        { key: 'welcome_emails' as const, label: 'Emails de bienvenue', desc: 'Recevoir un email lors de l\'inscription' },
        { key: 'notification_emails' as const, label: 'Notifications', desc: 'Recevoir les notifications par email' },
        { key: 'opportunity_emails' as const, label: 'Opportunités', desc: 'Mises à jour sur vos opportunités' },
        { key: 'event_emails' as const, label: 'Événements', desc: 'Rappels et mises à jour d\'événements' },
        { key: 'marketing_emails' as const, label: 'Marketing', desc: 'Nouveautés et offres spéciales' },
    ];

    if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-slate-700" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex w-fit items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
                <MaterialButton onClick={() => setActiveTab('preferences')} variant={activeTab === 'preferences' ? 'filled' : 'text'} icon={<Settings className="h-4 w-4" />} className="text-sm">
                    Préférences
                </MaterialButton>
                <MaterialButton onClick={() => setActiveTab('history')} variant={activeTab === 'history' ? 'filled' : 'text'} icon={<History className="h-4 w-4" />} className="text-sm">
                    Historique
                </MaterialButton>
            </div>

            {activeTab === 'history' ? (
                <EmailLogs />
            ) : (
                <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
                            <Mail className="h-5 w-5 text-slate-700" />Catégories d'emails
                        </h3>
                        <div className="space-y-4">
                            {categories.map(cat => (
                                <div key={cat.key} className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
                                    <div>
                                        <p className="font-medium text-slate-900">{cat.label}</p>
                                        <p className="text-sm text-slate-500">{cat.desc}</p>
                                    </div>
                                    <Toggle enabled={preferences[cat.key]} onChange={() => savePreferences({ [cat.key]: !preferences[cat.key] })} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
                            <Clock className="h-5 w-5 text-slate-700" />Fréquence du digest
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {(['never', 'daily', 'weekly', 'monthly'] as const).map(freq => (
                                <MaterialButton
                                    key={freq}
                                    onClick={() => savePreferences({ digest_frequency: freq })}
                                    variant={preferences.digest_frequency === freq ? 'filled' : 'text'}
                                    className="justify-center text-sm"
                                >
                                    {freq === 'never' ? 'Jamais' : freq === 'daily' ? 'Quotidien' : freq === 'weekly' ? 'Hebdomadaire' : 'Mensuel'}
                                </MaterialButton>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
