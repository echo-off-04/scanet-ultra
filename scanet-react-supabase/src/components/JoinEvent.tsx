import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PhoneInput } from './PhoneInput';
import { PhotoCapture } from './PhotoCapture';

interface EventData {
  id: string;
  name: string;
  description: string;
  start_date: string;
  location: string;
  image_url: string | null;
  user_id: string;
  category: string;
}

export function JoinEvent() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    loadEvent();
  }, [token]);

  const loadEvent = async () => {
    if (!token) {
      setError('Token invalide');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, description, start_date, location, image_url, user_id, category')
        .eq('qr_code_token', token)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setError('Événement introuvable');
      } else {
        setEvent(data);
      }
    } catch (err) {
      console.error('Error loading event:', err);
      setError('Erreur lors du chargement de l\'événement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!event) return;

    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      const { data: existingContact, error: checkError } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', event.user_id)
        .eq('email', formData.email)
        .maybeSingle();

      if (checkError) throw checkError;

      let contactId: string;
      let photoUrl: string | null = null;

      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${event.user_id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('contact-photos')
          .upload(fileName, photoFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading photo:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('contact-photos')
            .getPublicUrl(fileName);
          photoUrl = publicUrl;
        }
      }

      if (existingContact) {
        contactId = existingContact.id;

        const updateData: any = {
          full_name: fullName,
          phone: formData.phone || null,
          company: formData.company || null,
          job_title: formData.jobTitle || null,
        };

        if (photoUrl) {
          updateData.photo_url = photoUrl;
        }

        const { error: updateError } = await supabase
          .from('contacts')
          .update(updateData)
          .eq('id', contactId);

        if (updateError) throw updateError;
      } else {
        const insertData: any = {
          user_id: event.user_id,
          full_name: fullName,
          email: formData.email,
          phone: formData.phone || null,
          company: formData.company || null,
          job_title: formData.jobTitle || null,
          status: 'lead',
          source: 'event',
          tags: ['qr-scan', event.category],
          is_member: false,
        };

        if (photoUrl) {
          insertData.photo_url = photoUrl;
        }

        const { data: newContact, error: insertError } = await supabase
          .from('contacts')
          .insert(insertData)
          .select('id')
          .single();

        if (insertError) throw insertError;
        contactId = newContact.id;
      }

      const { data: linkData, error: linkError } = await supabase
        .from('contact_events')
        .insert({
          contact_id: contactId,
          event_id: event.id,
          source: 'qr_code',
        })
        .select();

      if (linkError && linkError.code !== '23505') {
        throw linkError;
      }

      console.log('Contact successfully linked to event:', linkData);
      setSuccess(true);
    } catch (err: any) {
      console.error('Error submitting:', err);
      setError(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Chargement de l'événement...</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Événement introuvable</h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center">
          <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Enregistrement confirmé</h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            Merci de vous être enregistré.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 py-6 sm:py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
          {event?.image_url && (
            <div className="h-32 sm:h-48 bg-gradient-to-r from-blue-500 to-cyan-600 relative">
              <img
                src={event.image_url}
                alt={event.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {!event?.image_url && (
            <div className="h-32 sm:h-48 bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center">
              <Calendar className="w-12 h-12 sm:w-20 sm:h-20 text-white/30" />
            </div>
          )}

          <div className="p-4 sm:p-6 md:p-8">

            <div className="bg-blue-50 border-l-4 border-blue-600 p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-start gap-2 sm:gap-3">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm text-blue-800">
                    Remplissez le formulaire ci-dessous pour vous enregistrer
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-800 text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                    placeholder="Dupont"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  placeholder="jean.dupont@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Téléphone
                </label>
                <PhoneInput
                  value={formData.phone}
                  onChange={(value) => setFormData({ ...formData, phone: value })}
                  placeholder="+33 6 12 34 56 78"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Entreprise
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  placeholder="Acme Inc."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fonction
                </label>
                <input
                  type="text"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  placeholder="Directeur Commercial"
                />
              </div>

              <PhotoCapture
                onPhotoChange={setPhotoFile}
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 sm:py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold text-base sm:text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="hidden sm:inline">Enregistrement en cours...</span>
                    <span className="sm:hidden">Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    S'enregistrer
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
