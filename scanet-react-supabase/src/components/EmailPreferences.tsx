import { useState, useEffect } from 'react';
import { Mail, Save, Loader2, Check, X, Bell, Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getEmailPreferences, updateEmailPreferences, getEmailLogs } from '../lib/emailService';

interface EmailPreferencesProps {
  onClose?: () => void;
}

interface EmailPreference {
  welcome_emails: boolean;
  notification_emails: boolean;
  marketing_emails: boolean;
  opportunity_emails: boolean;
  event_emails: boolean;
  digest_frequency: 'never' | 'daily' | 'weekly' | 'monthly';
}

interface EmailLog {
  id: string;
  to_email: string;
  subject: string;
  template_type: string;
  status: string;
  sent_at: string;
  created_at: string;
}

export function EmailPreferences({ onClose }: EmailPreferencesProps) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<EmailPreference>({
    welcome_emails: true,
    notification_emails: true,
    marketing_emails: false,
    opportunity_emails: true,
    event_emails: true,
    digest_frequency: 'daily',
  });
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'preferences' | 'history'>('preferences');

  useEffect(() => {
    if (user) {
      loadPreferences();
      loadEmailLogs();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await getEmailPreferences(user.id);
      if (error) throw error;

      if (data) {
        setPreferences({
          welcome_emails: data.welcome_emails,
          notification_emails: data.notification_emails,
          marketing_emails: data.marketing_emails,
          opportunity_emails: data.opportunity_emails,
          event_emails: data.event_emails,
          digest_frequency: data.digest_frequency as 'never' | 'daily' | 'weekly' | 'monthly',
        });
      }
    } catch (error) {
      console.error('Error loading email preferences:', error);
      setErrorMessage('Erreur lors du chargement des préférences');
    } finally {
      setLoading(false);
    }
  };

  const loadEmailLogs = async () => {
    if (!user) return;

    try {
      const { data, error } = await getEmailLogs(user.id);
      if (error) throw error;

      if (data) {
        setEmailLogs(data as EmailLog[]);
      }
    } catch (error) {
      console.error('Error loading email logs:', error);
    }
  };

  const handleToggle = (key: keyof EmailPreference) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: typeof prev[key] === 'boolean' ? !prev[key] : prev[key],
    }));
  };

  const handleFrequencyChange = (frequency: 'never' | 'daily' | 'weekly' | 'monthly') => {
    setPreferences((prev) => ({
      ...prev,
      digest_frequency: frequency,
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { error } = await updateEmailPreferences(user.id, preferences);
      if (error) throw error;

      setSuccessMessage('Préférences enregistrées avec succès');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setErrorMessage('Erreur lors de l\'enregistrement des préférences');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'bounced':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Envoyé';
      case 'failed':
        return 'Échec';
      case 'pending':
        return 'En attente';
      case 'bounced':
        return 'Rejeté';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Mail className="w-6 h-6 text-blue-600" />
          Préférences Email
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="border-b border-gray-200">
        <div className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('preferences')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'preferences'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Préférences
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Historique
          </button>
        </div>
      </div>

      {activeTab === 'preferences' ? (
        <div className="p-6 space-y-6">
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <Check className="w-5 h-5" />
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <X className="w-5 h-5" />
              {errorMessage}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Types d'emails</h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">Emails de bienvenue</div>
                    <div className="text-sm text-gray-500">Recevoir un email lors de la création de compte</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.welcome_emails}
                  onChange={() => handleToggle('welcome_emails')}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">Notifications générales</div>
                    <div className="text-sm text-gray-500">Recevoir des emails pour les notifications</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notification_emails}
                  onChange={() => handleToggle('notification_emails')}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">Opportunités</div>
                    <div className="text-sm text-gray-500">Recevoir des emails sur les opportunités gagnées</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.opportunity_emails}
                  onChange={() => handleToggle('opportunity_emails')}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="font-medium text-gray-900">Événements</div>
                    <div className="text-sm text-gray-500">Recevoir des rappels d'événements</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.event_emails}
                  onChange={() => handleToggle('event_emails')}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="font-medium text-gray-900">Emails marketing</div>
                    <div className="text-sm text-gray-500">Recevoir des conseils et nouveautés</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.marketing_emails}
                  onChange={() => handleToggle('marketing_emails')}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Fréquence du résumé</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(['never', 'daily', 'weekly', 'monthly'] as const).map((frequency) => (
                <button
                  key={frequency}
                  onClick={() => handleFrequencyChange(frequency)}
                  className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all ${
                    preferences.digest_frequency === frequency
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {frequency === 'never' && 'Jamais'}
                  {frequency === 'daily' && 'Quotidien'}
                  {frequency === 'weekly' && 'Hebdomadaire'}
                  {frequency === 'monthly' && 'Mensuel'}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500">
              Recevez un résumé de votre activité par email
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Historique des emails</h3>

          {emailLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Aucun email envoyé pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emailLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{log.subject}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        À: {log.to_email}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        log.status
                      )}`}
                    >
                      {getStatusText(log.status)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(log.sent_at || log.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
