'use client';

import { useState, useEffect } from 'react';
import {
    User, Mail, Building2, Briefcase, Globe, Phone,
    MapPin, Camera, Save, X, Loader2, CreditCard,
    Linkedin, Check, Bell, Clock, TestTube, Send
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { SUPPORTED_CURRENCIES, getCurrencyInfo } from '@/lib/currency';
import { COUNTRIES } from '@/lib/countries';
import { toast } from 'sonner';

interface SettingsProps {
    onClose?: () => void;
}

export function Settings({ onClose }: SettingsProps) {
    const { profile, updateProfile } = useAuth();
    const { preferences, updatePreferences, refreshNotifications } = useNotifications();
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showCurrencyConfirm, setShowCurrencyConfirm] = useState(false);
    const [pendingCurrency, setPendingCurrency] = useState<string | null>(null);
    const [testingNotifications, setTestingNotifications] = useState(false);
    const [testingEmail, setTestingEmail] = useState(false);

    const [formData, setFormData] = useState({
        full_name: '', email: '', company: '', job_title: '', phone: '',
        bio: '', website: '', linkedin: '', country: '', city: '',
        preferred_currency: 'EUR', avatar_url: '',
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '', email: profile.email || '',
                company: profile.company || '', job_title: profile.job_title || '',
                phone: profile.phone || '', bio: profile.bio || '',
                website: profile.website || '', linkedin: profile.linkedin || '',
                country: profile.country || '', city: profile.city || '',
                preferred_currency: profile.preferred_currency || 'EUR',
                avatar_url: profile.avatar_url || '',
            });
        }
    }, [profile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'preferred_currency' && value !== formData.preferred_currency) {
            setPendingCurrency(value);
            setShowCurrencyConfirm(true);
            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const confirmCurrencyChange = () => {
        if (pendingCurrency) setFormData(prev => ({ ...prev, preferred_currency: pendingCurrency }));
        setShowCurrencyConfirm(false);
        setPendingCurrency(null);
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;
        try {
            setUploadingPhoto(true);
            setErrorMessage('');
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            const res = await fetch('/api/profile/avatar', { method: 'POST', body: formDataUpload });
            if (!res.ok) throw new Error('Upload failed');
            const { url } = await res.json();
            setFormData(prev => ({ ...prev, avatar_url: url }));
            await updateProfile({ avatar_url: url });
            setSuccessMessage('Photo de profil mise à jour !');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error uploading photo:', error);
            setErrorMessage('Erreur lors de l\'upload de la photo');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        try {
            setSaving(true);
            setErrorMessage('');
            await updateProfile({
                full_name: formData.full_name || null,
                company: formData.company || null,
                job_title: formData.job_title || null,
                avatar_url: formData.avatar_url || null,
                phone: formData.phone || null,
                bio: formData.bio || null,
                website: formData.website || null,
                linkedin: formData.linkedin || null,
                country: formData.country || null,
                city: formData.city || null,
                preferred_currency: formData.preferred_currency || 'EUR',
            });
            setSuccessMessage('Profil mis à jour avec succès !');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error saving profile:', error);
            setErrorMessage('Erreur lors de la sauvegarde du profil');
        } finally {
            setSaving(false);
        }
    };

    const handleTestNotifications = async () => {
        if (!profile) return;
        setTestingNotifications(true);
        try {
            const res = await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'test',
                    category: 'contacts',
                    title: 'Test - Notification',
                    message: 'Ceci est une notification de test',
                    priority: 'medium',
                }),
            });
            if (!res.ok) throw new Error('Failed');
            await refreshNotifications();
            toast.success('Notification de test envoyée !');
        } catch (error) {
            console.error('Error creating test notifications:', error);
            toast.error('Impossible de créer les notifications de test');
        } finally {
            setTestingNotifications(false);
        }
    };

    const handleTestEmail = async () => {
        if (!profile?.email) { toast.error('Aucune adresse email trouvée'); return; }
        setTestingEmail(true);
        try {
            const res = await fetch('/api/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: profile.email,
                    templateType: 'welcome',
                    data: { name: profile.full_name || 'Utilisateur', dashboardUrl: `${window.location.origin}/dashboard` },
                }),
            });
            if (!res.ok) throw new Error('Failed');
            toast.success(`Email de test envoyé à ${profile.email}`);
        } catch (error) {
            console.error('Error sending test email:', error);
            toast.error('Impossible d\'envoyer l\'email de test');
        } finally {
            setTestingEmail(false);
        }
    };

    const currentCurrencyInfo = getCurrencyInfo(formData.preferred_currency);
    const pendingCurrencyInfo = pendingCurrency ? getCurrencyInfo(pendingCurrency) : null;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#0E3A5D] to-[#1e5a8e] px-8 py-8">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-4 border-white/30">
                                {formData.avatar_url ? (
                                    <img src={formData.avatar_url} alt={formData.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-12 h-12 text-white" />
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-gray-50">
                                {uploadingPhoto ? <Loader2 className="w-4 h-4 text-gray-600 animate-spin" /> : <Camera className="w-4 h-4 text-gray-600" />}
                                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploadingPhoto} />
                            </label>
                        </div>
                        <div className="text-white">
                            <h1 className="text-2xl font-bold">{formData.full_name || 'Votre profil'}</h1>
                            <p className="text-white/70">{formData.email}</p>
                            {formData.company && <p className="text-white/70 text-sm mt-1">{formData.job_title} chez {formData.company}</p>}
                        </div>
                    </div>
                </div>

                {/* Messages */}
                {successMessage && (
                    <div className="mx-8 mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700">
                        <Check className="w-5 h-5" />{successMessage}
                    </div>
                )}
                {errorMessage && (
                    <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                        <X className="w-5 h-5" />{errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Informations personnelles */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-[#0E3A5D]" />Informations personnelles
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
                                <input type="text" name="full_name" value={formData.full_name} onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]" placeholder="Jean Dupont" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input type="email" name="email" value={formData.email} disabled
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed" />
                                <p className="text-xs text-gray-500 mt-1">L&apos;email ne peut pas être modifié</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]" placeholder="+33 6 12 34 56 78" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                                <div className="relative">
                                    <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="url" name="linkedin" value={formData.linkedin} onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]" placeholder="https://linkedin.com/in/..." />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Informations professionnelles */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-[#0E3A5D]" />Informations professionnelles
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Entreprise</label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="text" name="company" value={formData.company} onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]" placeholder="Nom de l'entreprise" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Poste</label>
                                <input type="text" name="job_title" value={formData.job_title} onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]" placeholder="Directeur commercial" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Site web</label>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="url" name="website" value={formData.website} onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]" placeholder="https://www.example.com" />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                                <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] resize-none" placeholder="Présentez-vous en quelques mots..." />
                            </div>
                        </div>
                    </div>

                    {/* Localisation */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-[#0E3A5D]" />Localisation
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Pays</label>
                                <select name="country" value={formData.country} onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]">
                                    <option value="">Sélectionner un pays</option>
                                    {COUNTRIES.map(country => <option key={country.code} value={country.name}>{country.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                                <input type="text" name="city" value={formData.city} onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]" placeholder="Paris" />
                            </div>
                        </div>
                    </div>

                    {/* Préférences */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-[#0E3A5D]" />Préférences
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Devise par défaut</label>
                                <select name="preferred_currency" value={formData.preferred_currency} onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]">
                                    {SUPPORTED_CURRENCIES.map(currency => (
                                        <option key={currency.code} value={currency.code}>{currency.symbol} - {currency.name} ({currency.code})</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-2">Tous les montants seront convertis et affichés dans cette devise</p>
                            </div>
                            <div className="flex items-center">
                                <div className="bg-gray-50 rounded-xl p-4 flex-1">
                                    <p className="text-sm text-gray-600">Devise actuelle</p>
                                    <p className="text-2xl font-bold text-[#0E3A5D] mt-1">{currentCurrencyInfo?.symbol} {currentCurrencyInfo?.code}</p>
                                    <p className="text-xs text-gray-500">{currentCurrencyInfo?.name}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-[#0E3A5D]" />Notifications
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600">Gérez vos préférences de notifications.</p>
                                <div className="flex gap-2">
                                    <button type="button" onClick={handleTestEmail} disabled={testingEmail}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 disabled:opacity-50 text-sm font-medium">
                                        {testingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        {testingEmail ? 'Envoi...' : 'Tester l\'email'}
                                    </button>
                                    <button type="button" onClick={handleTestNotifications} disabled={testingNotifications}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50 text-sm font-medium">
                                        {testingNotifications ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                                        {testingNotifications ? 'Envoi...' : 'Tester les notifications'}
                                    </button>
                                </div>
                            </div>

                            {[
                                { key: 'contacts_enabled', label: 'Contacts', desc: 'Nouveaux contacts, modifications et mises à jour' },
                                { key: 'opportunities_enabled', label: 'Opportunités', desc: 'Changements de statut, opportunités haute valeur' },
                                { key: 'reminders_enabled', label: 'Relances', desc: 'Rappels pour les relances planifiées' },
                                { key: 'team_activity_enabled', label: 'Activité d\'équipe', desc: 'Mises à jour et activités de l\'équipe' },
                            ].map(toggle => (
                                <div key={toggle.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-gray-900">{toggle.label}</p>
                                        <p className="text-sm text-gray-500">{toggle.desc}</p>
                                    </div>
                                    <button type="button" onClick={() => updatePreferences({ [toggle.key]: !(preferences as any)?.[toggle.key] })}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${(preferences as any)?.[toggle.key] ? 'bg-[#0E3A5D]' : 'bg-gray-300'}`}>
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${(preferences as any)?.[toggle.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            ))}

                            <div className="p-4 bg-gray-50 rounded-xl">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Résumé par email</label>
                                <select value={preferences?.email_digest || 'daily'}
                                    onChange={(e) => updatePreferences({ email_digest: e.target.value as 'never' | 'daily' | 'weekly' })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] bg-white">
                                    <option value="never">Jamais</option>
                                    <option value="daily">Quotidien</option>
                                    <option value="weekly">Hebdomadaire</option>
                                </select>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-600" />
                                        <p className="font-medium text-gray-900">Heures de silence</p>
                                    </div>
                                    <button type="button" onClick={() => updatePreferences({ quiet_hours_enabled: !preferences?.quiet_hours_enabled })}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences?.quiet_hours_enabled ? 'bg-[#0E3A5D]' : 'bg-gray-300'}`}>
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences?.quiet_hours_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                                {preferences?.quiet_hours_enabled && (
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Début</label>
                                            <input type="time" value={preferences?.quiet_hours_start || '22:00'}
                                                onChange={(e) => updatePreferences({ quiet_hours_start: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 bg-white text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Fin</label>
                                            <input type="time" value={preferences?.quiet_hours_end || '08:00'}
                                                onChange={(e) => updatePreferences({ quiet_hours_end: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 bg-white text-sm" />
                                        </div>
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 mt-2">Désactiver les notifications pendant ces heures</p>
                            </div>
                        </div>
                    </div>

                    {/* Boutons */}
                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                        {onClose && (
                            <button type="button" onClick={onClose} className="px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50">
                                Annuler
                            </button>
                        )}
                        <button type="submit" disabled={saving}
                            className="px-8 py-3 bg-[#0E3A5D] text-white rounded-xl font-medium hover:bg-[#0c2d47] disabled:opacity-50 flex items-center gap-2">
                            {saving ? <><Loader2 className="w-5 h-5 animate-spin" />Enregistrement...</> : <><Save className="w-5 h-5" />Enregistrer les modifications</>}
                        </button>
                    </div>
                </form>
            </div>

            {/* Modal confirmation devise */}
            {showCurrencyConfirm && pendingCurrencyInfo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Changer de devise ?</h3>
                        <p className="text-gray-600 mb-4">
                            Vous êtes sur le point de changer votre devise de <strong>{currentCurrencyInfo?.code}</strong> vers <strong>{pendingCurrencyInfo.code}</strong>.
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                            Tous vos montants seront automatiquement convertis selon les taux de change actuels.
                        </p>
                        <div className="flex items-center gap-3">
                            <button onClick={() => { setShowCurrencyConfirm(false); setPendingCurrency(null); }}
                                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50">Annuler</button>
                            <button onClick={confirmCurrencyChange}
                                className="flex-1 px-4 py-3 bg-[#0E3A5D] text-white rounded-xl font-medium hover:bg-[#0c2d47]">Confirmer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
