import { useState, useRef } from 'react';
import { X, Camera, Upload, Loader2, RefreshCw, Sparkles, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { compressImage } from '../lib/imageProcessing';
import { notifyContactCreated } from '../lib/notifications';

interface ScanContactModalProps {
  onClose: () => void;
  onContactAdded: () => void;
}

interface ExtractedData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  status?: 'lead' | 'prospect' | 'client' | 'partner' | 'collaborator' | 'friend';
  tags?: string[];
  notes?: string;
}

export function ScanContactModal({ onClose, onContactAdded }: ScanContactModalProps) {
  const { user } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData>({
    status: 'lead',
    tags: ['scanné'],
  });
  const [step, setStep] = useState<'capture' | 'captureBack' | 'review'>('capture');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const startCamera = async () => {
    try {
      console.log('[Camera] Demande d\'accès à la caméra...');

      // Vérifier si l'API est disponible
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('[Camera] API getUserMedia non disponible');
        toast.error('Votre navigateur ne supporte pas l\'accès à la caméra.');
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      console.log('[Camera] Flux vidéo obtenu:', mediaStream.active);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;

        // Attendre que la vidéo soit prête
        videoRef.current.onloadedmetadata = () => {
          console.log('[Camera] Vidéo prête, dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
          if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
            setIsVideoReady(true);
            console.log('[Camera] Vidéo validée et prête pour la capture');
          }
        };
      }

      setStream(mediaStream);
      setIsCapturing(true);
      console.log('[Camera] Caméra démarrée avec succès');
    } catch (error) {
      console.error('[Camera] Erreur complète:', error);

      let errorMessage = 'Impossible d\'accéder à la caméra. ';

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage += 'Veuillez autoriser l\'accès à la caméra dans les paramètres de votre navigateur.';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          errorMessage += 'Aucune caméra détectée sur votre appareil.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          errorMessage += 'La caméra est déjà utilisée par une autre application.';
        } else if (error.name === 'OverconstrainedError') {
          errorMessage += 'Les paramètres de la caméra ne sont pas compatibles.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage += 'Le protocole HTTPS est requis pour accéder à la caméra.';
        } else {
          errorMessage += error.message;
        }
      }

      toast.error(errorMessage, { duration: 5000 });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
    setIsVideoReady(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) {
      console.error('[Capture] Référence vidéo manquante');
      toast.error('Erreur: référence vidéo manquante');
      return;
    }

    const videoWidth = videoRef.current.videoWidth;
    const videoHeight = videoRef.current.videoHeight;

    console.log('[Capture] Dimensions vidéo:', videoWidth, 'x', videoHeight);

    if (videoWidth === 0 || videoHeight === 0) {
      console.error('[Capture] Dimensions vidéo invalides');
      toast.error('Erreur: la vidéo n\'est pas encore prête. Veuillez réessayer dans quelques secondes.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('[Capture] Impossible de créer le contexte canvas');
      toast.error('Erreur: impossible de créer le contexte de capture');
      return;
    }

    ctx.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.92);

    console.log('[Capture] Image capturée, taille:', imageData.length, 'caractères');

    if (imageData.length < 1000) {
      console.error('[Capture] Image capturée trop petite, probablement vide');
      toast.error('Erreur: l\'image capturée est vide. Veuillez réessayer.');
      return;
    }

    if (step === 'capture') {
      setImage(imageData);
      stopCamera();
      setStep('captureBack');
      console.log('[Capture] Recto capturé avec succès');
    } else if (step === 'captureBack') {
      setBackImage(imageData);
      stopCamera();
      console.log('[Capture] Verso capturé avec succès, lancement de l\'analyse IA');
      processImageWithAI(image!, imageData);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImage(result);
        setStep('captureBack');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setBackImage(result);
        processImageWithAI(image!, result);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImageWithAI = async (frontImageData: string, backImageData?: string) => {
    console.log('[AI Scan] Début du traitement IA');
    console.log('[AI Scan] Image verso présente:', !!backImageData);
    setIsProcessing(true);
    try {
      let processedFrontImage = frontImageData;
      let processedBackImage: string | undefined = undefined;

      console.log('[AI Scan] Taille image recto (base64):', frontImageData.length);

      try {
        processedFrontImage = await compressImage(frontImageData, 800);
        console.log('[AI Scan] Compression recto réussie, nouvelle taille:', processedFrontImage.length);
      } catch (compressionError) {
        console.warn('[AI Scan] Compression recto échouée, utilisation de l\'image originale:', compressionError);
      }

      if (backImageData) {
        console.log('[AI Scan] Taille image verso (base64):', backImageData.length);
        try {
          processedBackImage = await compressImage(backImageData, 800);
          console.log('[AI Scan] Compression verso réussie, nouvelle taille:', processedBackImage.length);
        } catch (compressionError) {
          console.warn('[AI Scan] Compression verso échouée, utilisation de l\'image originale:', compressionError);
          processedBackImage = backImageData;
        }
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-business-card`;
      console.log('[AI Scan] URL de l\'API:', apiUrl);

      const requestBody: any = { image: processedFrontImage };
      if (processedBackImage) {
        requestBody.backImage = processedBackImage;
      }

      console.log('[AI Scan] Envoi de la requête...');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('[AI Scan] Statut de la réponse:', response.status, response.statusText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('[AI Scan] Erreur JSON retournée:', errorData);
        } catch (parseError) {
          const textError = await response.text();
          console.error('[AI Scan] Erreur texte retournée:', textError);
          throw new Error(`Erreur HTTP ${response.status}: ${textError}`);
        }
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('[AI Scan] Résultat reçu:', result);

      if (!result.data) {
        console.error('[AI Scan] Pas de données dans la réponse:', result);
        throw new Error('Réponse invalide: données manquantes');
      }

      setExtractedData({
        ...result.data,
        status: 'lead',
        tags: ['scanné'],
      });
      console.log('[AI Scan] Données extraites:', result.data);
      setStep('review');
    } catch (error) {
      console.error('[AI Scan] Erreur complète:', error);
      console.error('[AI Scan] Type d\'erreur:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('[AI Scan] Message d\'erreur:', error instanceof Error ? error.message : String(error));
      console.error('[AI Scan] Stack:', error instanceof Error ? error.stack : 'Pas de stack');

      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur lors du scan IA: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
      console.log('[AI Scan] Fin du traitement');
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if ((!extractedData.firstName && !extractedData.lastName) || !extractedData.email) {
      toast.error('Au moins le prénom ou le nom, et l\'email sont obligatoires');
      return;
    }

    setIsSaving(true);
    try {
      const fullName = [extractedData.firstName, extractedData.lastName].filter(Boolean).join(' ');

      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .insert({
          user_id: user.id,
          full_name: fullName,
          email: extractedData.email,
          phone: extractedData.phone || null,
          company: extractedData.company || null,
          job_title: extractedData.jobTitle || null,
          status: extractedData.status || 'lead',
          source: 'event',
          tags: extractedData.tags || ['scanné'],
          address: extractedData.address || null,
          linkedin_url: extractedData.website || null,
          rating: null,
          notes: extractedData.notes || null,
          city: extractedData.city || null,
          region: null,
          country: extractedData.country || null,
          relationship: null,
          opportunity_amount: null,
          avatar_url: null,
          industry: null,
          company_size: null,
          is_member: false,
        })
        .select()
        .single();

      if (contactError) {
        console.error('Error adding contact:', contactError);
        toast.error('Erreur lors de l\'ajout du contact. Veuillez réessayer.');
        throw contactError;
      }

      let sortingEventId: string | null = null;

      const { data: existingEvent, error: fetchError } = await supabase
        .from('events')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', 'contact a trier')
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching sorting event:', fetchError);
      }

      if (existingEvent) {
        sortingEventId = existingEvent.id;
      } else {
        const today = new Date().toISOString();
        const { data: newEvent, error: createError } = await supabase
          .from('events')
          .insert({
            user_id: user.id,
            name: 'contact a trier',
            category: 'networking',
            event_type: 'presentiel',
            status: 'completed',
            start_date: today,
            description: 'Événement par défaut pour les contacts à trier',
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating sorting event:', createError);
        } else if (newEvent) {
          sortingEventId = newEvent.id;
        }
      }

      if (sortingEventId && contactData) {
        const { error: linkError } = await supabase.from('contact_events').insert({
          contact_id: contactData.id,
          event_id: sortingEventId,
          source: 'manual',
          created_by: user.id,
        });

        if (linkError) {
          console.error('Error linking contact to sorting event:', linkError);
        }
      }

      await notifyContactCreated(user.id, contactData.full_name, contactData.id);

      onContactAdded();
      onClose();
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error('Erreur lors de l\'enregistrement du contact');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setBackImage(null);
    setExtractedData({
      status: 'lead',
      tags: ['scanné'],
    });
    setStep('capture');
    setIsVideoReady(false);
    stopCamera();
  };

  const handleSkipBackSide = () => {
    processImageWithAI(image!);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmedTag = tagInput.trim();
      if (trimmedTag && !(extractedData.tags || []).includes(trimmedTag)) {
        setExtractedData((prev) => ({
          ...prev,
          tags: [...(prev.tags || []), trimmedTag],
        }));
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setExtractedData((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((tag) => tag !== tagToRemove),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Scanner une carte de visite</h2>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {step === 'capture' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-blue-800 font-medium">Étape 1 : Scanner le recto de la carte</p>
              </div>

              {!isCapturing && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={startCamera}
                    className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <Camera className="w-12 h-12 text-blue-500 mb-3" />
                    <span className="text-lg font-semibold text-gray-700">Prendre une photo</span>
                    <span className="text-sm text-gray-500 mt-1">Utiliser la caméra</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <Upload className="w-12 h-12 text-blue-500 mb-3" />
                    <span className="text-lg font-semibold text-gray-700">Importer une image</span>
                    <span className="text-sm text-gray-500 mt-1">Choisir un fichier</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}

              {isCapturing && (
                <div className="space-y-4">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full rounded-2xl"
                    />
                    {!isVideoReady && (
                      <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                        <div className="text-center text-white">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                          <p className="text-sm">Initialisation de la caméra...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={capturePhoto}
                      disabled={!isVideoReady}
                      className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Camera className="w-5 h-5" />
                      Capturer le recto
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'captureBack' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-green-800 font-medium">✓ Recto capturé</p>
                <p className="text-sm text-gray-600 mt-1">Étape 2 : Scanner le verso (optionnel)</p>
              </div>

              {image && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Recto :</p>
                  <img src={image} alt="Recto" className="w-full max-h-32 object-contain rounded-xl border border-gray-200" />
                </div>
              )}

              {!isCapturing && !isProcessing && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={startCamera}
                    className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <Camera className="w-12 h-12 text-blue-500 mb-3" />
                    <span className="text-lg font-semibold text-gray-700">Prendre le verso</span>
                    <span className="text-sm text-gray-500 mt-1">Utiliser la caméra</span>
                  </button>

                  <button
                    onClick={() => backFileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <Upload className="w-12 h-12 text-blue-500 mb-3" />
                    <span className="text-lg font-semibold text-gray-700">Importer le verso</span>
                    <span className="text-sm text-gray-500 mt-1">Choisir un fichier</span>
                  </button>
                  <input
                    ref={backFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBackFileUpload}
                    className="hidden"
                  />
                </div>
              )}

              {isCapturing && (
                <div className="space-y-4">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full rounded-2xl"
                    />
                    {!isVideoReady && (
                      <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                        <div className="text-center text-white">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                          <p className="text-sm">Initialisation de la caméra...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={capturePhoto}
                      disabled={!isVideoReady}
                      className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Camera className="w-5 h-5" />
                      Capturer le verso
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {!isCapturing && !isProcessing && (
                <div className="flex justify-center">
                  <button
                    onClick={handleSkipBackSide}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors underline"
                  >
                    Passer cette étape (scanner uniquement le recto)
                  </button>
                </div>
              )}

            </div>
          )}

          {isProcessing && image && (
            <div className="text-center py-12">
              <div className="relative">
                <Sparkles className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto absolute top-4 left-1/2 -ml-4" />
              </div>
              <p className="text-lg font-semibold text-gray-700">Analyse IA en cours...</p>
              <p className="text-sm text-gray-500 mt-2">
                L'intelligence artificielle extrait les informations de la carte
              </p>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-1">
                <div className="mb-4 grid grid-cols-2 gap-2">
                  {image && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Recto :</p>
                      <img src={image} alt="Recto" className="w-full max-h-32 object-contain rounded-xl border border-gray-200" />
                    </div>
                  )}
                  {backImage && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Verso :</p>
                      <img src={backImage} alt="Verso" className="w-full max-h-32 object-contain rounded-xl border border-gray-200" />
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-4">Vérifiez et modifiez les informations extraites :</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={extractedData.firstName || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, firstName: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Jean"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={extractedData.lastName || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, lastName: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                    value={extractedData.email || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="jean.dupont@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={extractedData.phone || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Entreprise</label>
                  <input
                    type="text"
                    value={extractedData.company || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, company: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Acme Inc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Fonction</label>
                  <input
                    type="text"
                    value={extractedData.jobTitle || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, jobTitle: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Directeur Commercial"
                  />
                </div>

                {extractedData.website && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Site web</label>
                    <input
                      type="url"
                      value={extractedData.website || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, website: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="https://example.com"
                    />
                  </div>
                )}

                {extractedData.address && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Adresse</label>
                    <textarea
                      value={extractedData.address || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, address: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="123 rue Example, 75001 Paris"
                      rows={2}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Statut</label>
                  <select
                    value={extractedData.status || 'lead'}
                    onChange={(e) => setExtractedData({ ...extractedData, status: e.target.value as any })}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                  >
                    <option value="lead">Lead</option>
                    <option value="prospect">Prospect</option>
                    <option value="client">Client</option>
                    <option value="partner">Partenaire</option>
                    <option value="collaborator">Collaborateur</option>
                    <option value="friend">Ami.e</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tags (Appuyez sur Entrée ou virgule)
                  </label>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Ajouter un tag..."
                  />
                  {(extractedData.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {(extractedData.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                          >
                            <XIcon className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={extractedData.notes || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, notes: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    placeholder="Ajoutez des notes sur ce contact..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Recommencer
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || (!extractedData.firstName && !extractedData.lastName) || !extractedData.email}
                  className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    'Enregistrer le contact'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
