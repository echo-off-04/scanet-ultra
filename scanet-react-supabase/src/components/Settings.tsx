import { useState, useEffect } from 'react';
import {
    User, Mail, Building2, Briefcase, Globe, Phone,
    MapPin, Camera, Save, X, Loader2, CreditCard,
    Linkedin, FileText, Check, Bell, Clock, TestTube, Send
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { SUPPORTED_CURRENCIES, getCurrencyInfo, convertCurrency, formatCurrency } from '../lib/currency';
import { COUNTRIES } from '../lib/countries';
import { createNotification } from '../lib/notifications';
import { sendEmail } from '../lib/emailService';

interface SettingsProps {
    onClose?: () => void;
}

export function Settings({ onClose }: SettingsProps) {
    const { profile, updateProfile, refreshProfile } = useAuth();
    const { preferences, updatePreferences, showToast, refreshNotifications } = useNotifications();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showCurrencyConfirm, setShowCurrencyConfirm] = useState(false);
    const [pendingCurrency, setPendingCurrency] = useState<string | null>(null);
    const [testingNotifications, setTestingNotifications] = useState(false);
    const [testingEmail, setTestingEmail] = useState(false);

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        company: '',
        job_title: '',
        phone: '',
        bio: '',
        website: '',
        linkedin: '',
        country: '',
        city: '',
        preferred_currency: 'EUR',
        avatar_url: '',
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                email: profile.email || '',
                company: profile.company || '',
                job_title: profile.job_title || '',
                phone: profile.phone || '',
                bio: profile.bio || '',
                website: profile.website || '',
                linkedin: profile.linkedin || '',
                country: profile.country || '',
                city: profile.city || '',
                preferred_currency: profile.preferred_currency || 'EUR',
                avatar_url: profile.avatar_url || '',
            });
        }
    }, [profile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        // Pour le changement de devise, demander confirmation
        if (name === 'preferred_currency' && value !== formData.preferred_currency) {
            setPendingCurrency(value);
            setShowCurrencyConfirm(true);
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const confirmCurrencyChange = () => {
        if (pendingCurrency) {
            setFormData(prev => ({ ...prev, preferred_currency: pendingCurrency }));
        }
        setShowCurrencyConfirm(false);
        setPendingCurrency(null);
    };

    const cancelCurrencyChange = () => {
        setShowCurrencyConfirm(false);
        setPendingCurrency(null);
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;

        try {
            setUploadingPhoto(true);
            setErrorMessage('');

            // Créer un nom de fichier unique
            const fileExt = file.name.split('.').pop();
            const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // Upload vers Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('contact-photos')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Obtenir l'URL publique
            const { data: { publicUrl } } = supabase.storage
                .from('contact-photos')
                .getPublicUrl(filePath);

            // Mettre à jour le formulaire et le profil
            setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
            await updateProfile({ avatar_url: publicUrl });

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
            const testNotifications = [
                {
                    type: 'test_low',
                    category: 'contacts' as const,
                    title: 'Test - Priorité Basse',
                    message: 'Ceci est une notification de test de priorité basse',
                    priority: 'low' as const
                },
                {
                    type: 'test_medium',
                    category: 'opportunities' as const,
                    title: 'Test - Priorité Moyenne',
                    message: 'Ceci est une notification de test de priorité moyenne',
                    priority: 'medium' as const
                },
                {
                    type: 'test_high',
                    category: 'follow_ups' as const,
                    title: 'Test - Priorité Haute',
                    message: 'Ceci est une notification de test de priorité haute',
                    priority: 'high' as const
                },
                {
                    type: 'test_urgent',
                    category: 'events' as const,
                    title: '🔥 Test - Priorité Urgente',
                    message: 'Ceci est une notification de test de priorité urgente',
                    priority: 'urgent' as const
                }
            ];

            for (const notif of testNotifications) {
                await createNotification({
                    userId: profile.id,
                    ...notif
                });
            }

            await refreshNotifications();
            showToast('Test envoyé', '4 notifications de test ont été créées', 'success');
        } catch (error) {
            console.error('Error creating test notifications:', error);
            showToast('Erreur', 'Impossible de créer les notifications de test', 'error');
        } finally {
            setTestingNotifications(false);
        }
    };

    const handleTestEmail = async () => {
        if (!profile?.email) {
            showToast('Erreur', 'Aucune adresse email trouvée', 'error');
            return;
        }

        setTestingEmail(true);
        try {
            const result = await sendEmail({
                to: profile.email,
                templateType: 'welcome',
                data: {
                    name: profile.full_name || 'Utilisateur',
                    dashboardUrl: `${window.location.origin}/dashboard`,
                },
            });

            if (result.success) {
                showToast('Email envoyé', `Un email de test a été envoyé à ${profile.email}`, 'success');
            } else {
                throw new Error(result.error || 'Erreur inconnue');
            }
        } catch (error) {
            console.error('Error sending test email:', error);
            showToast('Erreur', `Impossible d'envoyer l'email de test: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
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
                        {/* Photo de profil */}
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-4 border-white/30">
                                {formData.avatar_url ? (
                                    <img
                                        src={formData.avatar_url}
                                        alt={formData.full_name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-12 h-12 text-white" />
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-gray-50 transition-colors">
                                {uploadingPhoto ? (
                                    <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
                                ) : (
                                    <Camera className="w-4 h-4 text-gray-600" />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    className="hidden"
                                    disabled={uploadingPhoto}
                                />
                            </label>
                        </div>
                        <div className="text-white">
                            <h1 className="text-2xl font-bold">{formData.full_name || 'Votre profil'}</h1>
                            <p className="text-white/70">{formData.email}</p>
                            {formData.company && (
                                <p className="text-white/70 text-sm mt-1">{formData.job_title} chez {formData.company}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Messages de succès/erreur */}
                {successMessage && (
                    <div className="mx-8 mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700">
                        <Check className="w-5 h-5" />
                        {successMessage}
                    </div>
                )}
                {errorMessage && (
                    <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                        <X className="w-5 h-5" />
                        {errorMessage}
                    </div>
                )}

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Section Informations personnelles */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-[#0E3A5D]" />
                            Informations personnelles
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nom complet
                                </label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                                    placeholder="Jean Dupont"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    disabled
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Téléphone
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                                        placeholder="+33 6 12 34 56 78"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    LinkedIn
                                </label>
                                <div className="relative">
                                    <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="url"
                                        name="linkedin"
                                        value={formData.linkedin}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                                        placeholder="https://linkedin.com/in/..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section Informations professionnelles */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-[#0E3A5D]" />
                            Informations professionnelles
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Entreprise
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="company"
                                        value={formData.company}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                                        placeholder="Nom de l'entreprise"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Poste
                                </label>
                                <input
                                    type="text"
                                    name="job_title"
                                    value={formData.job_title}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                                    placeholder="Directeur commercial"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Site web
                                </label>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="url"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                                        placeholder="https://www.example.com"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bio
                                </label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all resize-none"
                                    placeholder="Présentez-vous en quelques mots..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section Localisation */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-[#0E3A5D]" />
                            Localisation
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Pays
                                </label>
                                <select
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                                >
                                    <option value="">Sélectionner un pays</option>
                                    {COUNTRIES.map((country) => (
                                        <option key={country.code} value={country.name}>
                                            {country.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ville
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                                    placeholder="Paris"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section Préférences */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-[#0E3A5D]" />
                            Préférences
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Devise par défaut
                                </label>
                                <select
                                    name="preferred_currency"
                                    value={formData.preferred_currency}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                                >
                                    {SUPPORTED_CURRENCIES.map((currency) => (
                                        <option key={currency.code} value={currency.code}>
                                            {currency.symbol} - {currency.name} ({currency.code})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-2">
                                    Tous les montants seront convertis et affichés dans cette devise
                                </p>
                            </div>
                            <div className="flex items-center">
                                <div className="bg-gray-50 rounded-xl p-4 flex-1">
                                    <p className="text-sm text-gray-600">Devise actuelle</p>
                                    <p className="text-2xl font-bold text-[#0E3A5D] mt-1">
                                        {currentCurrencyInfo.symbol} {currentCurrencyInfo.code}
                                    </p>
                                    <p className="text-xs text-gray-500">{currentCurrencyInfo.name}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section Notifications */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-[#0E3A5D]" />
                            Notifications
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600">
                                    Gérez vos préférences de notifications pour rester informé des événements importants.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleTestEmail}
                                        disabled={testingEmail}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                    >
                                        {testingEmail ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Envoi...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Tester l'email
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleTestNotifications}
                                        disabled={testingNotifications}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                    >
                                        {testingNotifications ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Envoi...
                                            </>
                                        ) : (
                                            <>
                                                <TestTube className="w-4 h-4" />
                                                Tester les notifications
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Toggle Contacts */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-medium text-gray-900">Contacts</p>
                                    <p className="text-sm text-gray-500">Nouveaux contacts, modifications et mises à jour</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => updatePreferences({ contacts_enabled: !preferences?.contacts_enabled })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        preferences?.contacts_enabled ? 'bg-[#0E3A5D]' : 'bg-gray-300'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            preferences?.contacts_enabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* Toggle Opportunités */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-medium text-gray-900">Opportunités</p>
                                    <p className="text-sm text-gray-500">Changements de statut, opportunités haute valeur</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => updatePreferences({ opportunities_enabled: !preferences?.opportunities_enabled })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        preferences?.opportunities_enabled ? 'bg-[#0E3A5D]' : 'bg-gray-300'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            preferences?.opportunities_enabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* Toggle Relances */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-medium text-gray-900">Relances</p>
                                    <p className="text-sm text-gray-500">Rappels pour les relances planifiées</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => updatePreferences({ reminders_enabled: !preferences?.reminders_enabled })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        preferences?.reminders_enabled ? 'bg-[#0E3A5D]' : 'bg-gray-300'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            preferences?.reminders_enabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* Toggle Activité d'équipe */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-medium text-gray-900">Activité d'équipe</p>
                                    <p className="text-sm text-gray-500">Mises à jour et activités de l'équipe</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => updatePreferences({ team_activity_enabled: !preferences?.team_activity_enabled })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        preferences?.team_activity_enabled ? 'bg-[#0E3A5D]' : 'bg-gray-300'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            preferences?.team_activity_enabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* Digest email */}
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Résumé par email
                                </label>
                                <select
                                    value={preferences?.email_digest || 'daily'}
                                    onChange={(e) => updatePreferences({ email_digest: e.target.value as 'never' | 'daily' | 'weekly' })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all bg-white"
                                >
                                    <option value="never">Jamais</option>
                                    <option value="daily">Quotidien</option>
                                    <option value="weekly">Hebdomadaire</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-2">
                                    Recevez un résumé de vos notifications par email
                                </p>
                            </div>

                            {/* Quiet hours */}
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-600" />
                                        <p className="font-medium text-gray-900">Heures de silence</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => updatePreferences({ quiet_hours_enabled: !preferences?.quiet_hours_enabled })}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            preferences?.quiet_hours_enabled ? 'bg-[#0E3A5D]' : 'bg-gray-300'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                preferences?.quiet_hours_enabled ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                                {preferences?.quiet_hours_enabled && (
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Début</label>
                                            <input
                                                type="time"
                                                value={preferences?.quiet_hours_start || '22:00'}
                                                onChange={(e) => updatePreferences({ quiet_hours_start: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 bg-white text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Fin</label>
                                            <input
                                                type="time"
                                                value={preferences?.quiet_hours_end || '08:00'}
                                                onChange={(e) => updatePreferences({ quiet_hours_end: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 bg-white text-sm"
                                            />
                                        </div>
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 mt-2">
                                    Désactiver les notifications pendant ces heures
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Boutons */}
                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                        {onClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Annuler
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-3 bg-[#0E3A5D] text-white rounded-xl font-medium hover:bg-[#0c2d47] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Enregistrement...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Enregistrer les modifications
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Modal de confirmation changement devise */}
            {showCurrencyConfirm && pendingCurrencyInfo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            Changer de devise ?
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Vous êtes sur le point de changer votre devise de{' '}
                            <strong>{currentCurrencyInfo.code}</strong> vers{' '}
                            <strong>{pendingCurrencyInfo.code}</strong>.
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                            Tous vos montants (opportunités, statistiques, etc.) seront automatiquement
                            convertis selon les taux de change actuels fournis par l'API Frankfurter.
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={cancelCurrencyChange}
                                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmCurrencyChange}
                                className="flex-1 px-4 py-3 bg-[#0E3A5D] text-white rounded-xl font-medium hover:bg-[#0c2d47] transition-colors"
                            >
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
