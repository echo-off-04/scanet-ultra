'use client';

import { useState, useEffect } from 'react';
import { Mail, Bell, Clock, ToggleLeft, ToggleRight, History, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { EmailLogs } from './EmailLogs';

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
        <button onClick={onChange} className="flex-shrink-0">
            {enabled ? (
                <ToggleRight className="w-10 h-6 text-[#0E3A5D]" />
            ) : (
                <ToggleLeft className="w-10 h-6 text-gray-300" />
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

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0E3A5D]" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit">
                <button onClick={() => setActiveTab('preferences')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'preferences' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                    <Settings className="w-4 h-4" />Préférences
                </button>
                <button onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                    <History className="w-4 h-4" />Historique
                </button>
            </div>

            {activeTab === 'history' ? (
                <EmailLogs />
            ) : (
                <div className="space-y-6">
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-[#0E3A5D]" />Catégories d'emails
                        </h3>
                        <div className="space-y-4">
                            {categories.map(cat => (
                                <div key={cat.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                                    <div>
                                        <p className="font-medium text-gray-900">{cat.label}</p>
                                        <p className="text-sm text-gray-500">{cat.desc}</p>
                                    </div>
                                    <Toggle enabled={preferences[cat.key]} onChange={() => savePreferences({ [cat.key]: !preferences[cat.key] })} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-[#0E3A5D]" />Fréquence du digest
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {(['never', 'daily', 'weekly', 'monthly'] as const).map(freq => (
                                <button key={freq} onClick={() => savePreferences({ digest_frequency: freq })}
                                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${preferences.digest_frequency === freq ? 'bg-[#0E3A5D] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                    {freq === 'never' ? 'Jamais' : freq === 'daily' ? 'Quotidien' : freq === 'weekly' ? 'Hebdomadaire' : 'Mensuel'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
