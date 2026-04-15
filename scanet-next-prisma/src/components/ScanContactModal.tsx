'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, X, RotateCcw, Check, Tag, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { compressImage } from '@/lib/imageProcessing';
import { toast } from 'sonner';
import { MaterialButton } from './material/MaterialButton';
import { MaterialIconButton } from './material/MaterialIconButton';

interface ScanContactModalProps {
    onClose: () => void;
    onContactAdded: () => void;
}

interface ExtractedData {
    full_name: string;
    email: string;
    phone: string;
    company: string;
    job_title: string;
    website: string;
    address: string;
    linkedin: string;
}

const EMPTY_EXTRACTED_DATA: ExtractedData = {
    full_name: '',
    email: '',
    phone: '',
    company: '',
    job_title: '',
    website: '',
    address: '',
    linkedin: '',
};

function mapScannedData(payload: Record<string, unknown>): ExtractedData {
    const firstName = typeof payload.firstName === 'string' ? payload.firstName.trim() : '';
    const lastName = typeof payload.lastName === 'string' ? payload.lastName.trim() : '';
    const fullName = typeof payload.full_name === 'string'
        ? payload.full_name.trim()
        : typeof payload.fullName === 'string'
            ? payload.fullName.trim()
            : [firstName, lastName].filter(Boolean).join(' ').trim();

    return {
        full_name: fullName,
        email: typeof payload.email === 'string' ? payload.email.trim() : '',
        phone: typeof payload.phone === 'string' ? payload.phone.trim() : '',
        company: typeof payload.company === 'string' ? payload.company.trim() : '',
        job_title: typeof payload.job_title === 'string'
            ? payload.job_title.trim()
            : typeof payload.jobTitle === 'string'
                ? payload.jobTitle.trim()
                : '',
        website: typeof payload.website === 'string' ? payload.website.trim() : '',
        address: typeof payload.address === 'string' ? payload.address.trim() : '',
        linkedin: typeof payload.linkedin === 'string'
            ? payload.linkedin.trim()
            : typeof payload.linkedin_url === 'string'
                ? payload.linkedin_url.trim()
                : '',
    };
}

export function ScanContactModal({ onClose, onContactAdded }: ScanContactModalProps) {
    const { user } = useAuth();
    const [step, setStep] = useState<'capture' | 'captureBack' | 'review'>('capture');
    const [image, setImage] = useState<string | null>(null);
    const [backImage, setBackImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedData, setExtractedData] = useState<ExtractedData>(EMPTY_EXTRACTED_DATA);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [saving, setSaving] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const startCamera = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.onloadedmetadata = () => setIsVideoReady(true);
            }
        } catch {
            toast.error('Impossible d\'accéder à la caméra');
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
        setIsVideoReady(false);
    }, [stream]);

    useEffect(() => {
        if (step === 'capture' || step === 'captureBack') startCamera();
        return () => stopCamera();
    }, [step]);

    const captureImage = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        if (step === 'capture') {
            setImage(dataUrl);
            stopCamera();
            setStep('captureBack');
        } else {
            setBackImage(dataUrl);
            stopCamera();
            processImages(image!, dataUrl);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            if (step === 'capture') {
                setImage(dataUrl);
                setStep('captureBack');
            } else {
                setBackImage(dataUrl);
                processImages(image!, dataUrl);
            }
        };
        reader.readAsDataURL(file);
    };

    const skipBackCapture = () => {
        stopCamera();
        processImages(image!, null);
    };

    const processImages = async (frontImage: string, backImg: string | null) => {
        setIsProcessing(true);
        try {
            const processedFrontImage = await compressImage(frontImage, 800);
            const processedBackImage = backImg ? await compressImage(backImg, 800) : null;

            const res = await fetch('/api/scan-card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: processedFrontImage, backImage: processedBackImage }),
            });

            const result = await res.json();
            if (!res.ok) {
                throw new Error(result.error || 'Erreur de traitement');
            }

            const data = result?.data && typeof result.data === 'object' ? result.data as Record<string, unknown> : result as Record<string, unknown>;
            setExtractedData(mapScannedData(data));
            setStep('review');
        } catch (error) {
            console.error('Error processing card:', error);
            toast.error(error instanceof Error ? error.message : 'Erreur lors du traitement de la carte');
            setStep('capture');
            setImage(null);
            setBackImage(null);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSave = async () => {
        if (!user || !extractedData.full_name.trim()) {
            toast.error('Le nom est requis');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: extractedData.full_name,
                    email: extractedData.email || null,
                    phone: extractedData.phone || null,
                    company: extractedData.company || null,
                    job_title: extractedData.job_title || null,
                    website: extractedData.website || null,
                    address: extractedData.address || null,
                    linkedin: extractedData.linkedin || null,
                    tags,
                    source: 'scan',
                    status: 'lead',
                }),
            });

            if (!res.ok) throw new Error('Erreur');
            toast.success('Contact ajouté avec succès');
            onContactAdded();
        } catch (error) {
            console.error('Error saving contact:', error);
            toast.error('Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    const addTag = () => {
        const tag = tagInput.trim();
        if (tag && !tags.includes(tag)) { setTags([...tags, tag]); setTagInput(''); }
    };

    const resetAll = () => {
        setImage(null);
        setBackImage(null);
        setStep('capture');
        setExtractedData(EMPTY_EXTRACTED_DATA);
        setTags([]);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-slate-200 bg-white px-6 py-4">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">Scanner une carte de visite</h2>
                        <p className="text-sm text-slate-500">
                            {step === 'capture' ? 'Face avant' : step === 'captureBack' ? 'Face arrière (optionnel)' : 'Vérifier les informations'}
                        </p>
                    </div>
                    <MaterialIconButton ariaLabel="Fermer" onClick={onClose} icon={<X className="h-5 w-5" />} />
                </div>

                <div className="p-6">
                    {isProcessing ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader2 className="mb-4 h-12 w-12 animate-spin text-slate-700" />
                            <p className="text-lg font-semibold text-slate-900">Analyse de la carte en cours...</p>
                            <p className="mt-1 text-sm text-slate-500">Extraction des informations par IA</p>
                        </div>
                    ) : step === 'capture' || step === 'captureBack' ? (
                        <div className="space-y-4">
                            {image && step === 'captureBack' && (
                                <div className="mb-4">
                                    <p className="mb-2 text-sm font-medium text-slate-700">Face avant capturée ✓</p>
                                    <img src={image} alt="Face avant" className="h-20 w-32 rounded-lg border border-slate-200 object-cover" />
                                </div>
                            )}

                            <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900">
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                {!isVideoReady && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                                    </div>
                                )}
                                <div className="absolute inset-4 border-2 border-white/40 rounded-xl pointer-events-none" />
                            </div>

                            <canvas ref={canvasRef} className="hidden" />

                            <div className="flex items-center justify-center gap-4">
                                <MaterialButton onClick={() => fileInputRef.current?.click()} variant="outlined" icon={<Upload className="h-4 w-4" />}>
                                    Fichier
                                </MaterialButton>
                                <MaterialButton onClick={captureImage} disabled={!isVideoReady} icon={<Camera className="h-5 w-5" />}>
                                    Capturer
                                </MaterialButton>
                                {step === 'captureBack' && (
                                    <MaterialButton onClick={skipBackCapture} variant="outlined">Passer</MaterialButton>
                                )}
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                                {image && <img src={image} alt="Avant" className="h-16 w-24 rounded-lg border border-slate-200 object-cover" />}
                                {backImage && <img src={backImage} alt="Arrière" className="h-16 w-24 rounded-lg border border-slate-200 object-cover" />}
                                <MaterialButton onClick={resetAll} variant="text" icon={<RotateCcw className="h-4 w-4" />} className="px-0 text-sm">
                                    Rescanner
                                </MaterialButton>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { key: 'full_name', label: 'Nom complet *', type: 'text' },
                                    { key: 'email', label: 'Email', type: 'email' },
                                    { key: 'phone', label: 'Téléphone', type: 'tel' },
                                    { key: 'company', label: 'Entreprise', type: 'text' },
                                    { key: 'job_title', label: 'Poste', type: 'text' },
                                    { key: 'website', label: 'Site web', type: 'url' },
                                    { key: 'linkedin', label: 'LinkedIn', type: 'url' },
                                    { key: 'address', label: 'Adresse', type: 'text' },
                                ].map(field => (
                                    <div key={field.key}>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">{field.label}</label>
                                        <input
                                            type={field.type}
                                            value={(extractedData as any)[field.key]}
                                            onChange={(e) => setExtractedData({ ...extractedData, [field.key]: e.target.value })}
                                            className="input-modern text-sm"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Tags</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {tags.map(tag => (
                                        <span key={tag} className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                                            {tag}
                                            <button onClick={() => setTags(tags.filter(t => t !== tag))}><X className="h-3.5 w-3.5" /></button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                                        className="input-modern flex-1 py-2 text-sm" placeholder="Ajouter un tag..." />
                                    <MaterialIconButton ariaLabel="Ajouter le tag" onClick={addTag} icon={<Plus className="h-4 w-4" />} />
                                </div>
                            </div>

                            <div className="flex gap-3 border-t border-slate-200 pt-4">
                                <MaterialButton onClick={onClose} variant="outlined" className="flex-1 justify-center">Annuler</MaterialButton>
                                <MaterialButton onClick={handleSave} disabled={saving || !extractedData.full_name.trim()} icon={<Check className="h-5 w-5" />} className="flex-1 justify-center">
                                    {saving ? 'Enregistrement...' : 'Enregistrer le contact'}
                                </MaterialButton>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
