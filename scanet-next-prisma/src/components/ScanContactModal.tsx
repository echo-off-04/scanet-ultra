'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, X, RotateCcw, Check, Tag, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

export function ScanContactModal({ onClose, onContactAdded }: ScanContactModalProps) {
    const { user } = useAuth();
    const [step, setStep] = useState<'capture' | 'captureBack' | 'review'>('capture');
    const [image, setImage] = useState<string | null>(null);
    const [backImage, setBackImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedData, setExtractedData] = useState<ExtractedData>({
        full_name: '', email: '', phone: '', company: '', job_title: '', website: '', address: '', linkedin: '',
    });
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
            const res = await fetch('/api/scan-card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ front_image: frontImage, back_image: backImg }),
            });

            if (!res.ok) throw new Error('Erreur de traitement');
            const data = await res.json();
            setExtractedData({
                full_name: data.full_name || '',
                email: data.email || '',
                phone: data.phone || '',
                company: data.company || '',
                job_title: data.job_title || '',
                website: data.website || '',
                address: data.address || '',
                linkedin: data.linkedin || '',
            });
            setStep('review');
        } catch (error) {
            console.error('Error processing card:', error);
            toast.error('Erreur lors du traitement de la carte');
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
        setExtractedData({ full_name: '', email: '', phone: '', company: '', job_title: '', website: '', address: '', linkedin: '' });
        setTags([]);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Scanner une carte de visite</h2>
                        <p className="text-sm text-gray-500">
                            {step === 'capture' ? 'Face avant' : step === 'captureBack' ? 'Face arrière (optionnel)' : 'Vérifier les informations'}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6">
                    {isProcessing ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader2 className="w-12 h-12 text-[#0E3A5D] animate-spin mb-4" />
                            <p className="text-lg font-semibold text-gray-900">Analyse de la carte en cours...</p>
                            <p className="text-sm text-gray-500 mt-1">Extraction des informations par IA</p>
                        </div>
                    ) : step === 'capture' || step === 'captureBack' ? (
                        <div className="space-y-4">
                            {image && step === 'captureBack' && (
                                <div className="mb-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Face avant capturée ✓</p>
                                    <img src={image} alt="Face avant" className="w-32 h-20 object-cover rounded-lg border" />
                                </div>
                            )}

                            <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden">
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                {!isVideoReady && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                                    </div>
                                )}
                                <div className="absolute inset-4 border-2 border-white/40 rounded-xl pointer-events-none" />
                            </div>

                            <canvas ref={canvasRef} className="hidden" />

                            <div className="flex items-center justify-center gap-4">
                                <button onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">
                                    <Upload className="w-4 h-4" />Fichier
                                </button>
                                <button onClick={captureImage} disabled={!isVideoReady}
                                    className="flex items-center gap-2 px-6 py-3 bg-[#0E3A5D] text-white rounded-xl font-medium hover:bg-[#1E5A8E] disabled:opacity-50">
                                    <Camera className="w-5 h-5" />Capturer
                                </button>
                                {step === 'captureBack' && (
                                    <button onClick={skipBackCapture} className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">
                                        Passer
                                    </button>
                                )}
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                                {image && <img src={image} alt="Avant" className="w-24 h-16 object-cover rounded-lg border" />}
                                {backImage && <img src={backImage} alt="Arrière" className="w-24 h-16 object-cover rounded-lg border" />}
                                <button onClick={resetAll} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800">
                                    <RotateCcw className="w-4 h-4" />Rescanner
                                </button>
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                                        <input
                                            type={field.type}
                                            value={(extractedData as any)[field.key]}
                                            onChange={(e) => setExtractedData({ ...extractedData, [field.key]: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E3A5D] text-sm"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {tags.map(tag => (
                                        <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-[#0E3A5D]/10 text-[#0E3A5D] rounded-full text-sm">
                                            {tag}
                                            <button onClick={() => setTags(tags.filter(t => t !== tag))}><X className="w-3.5 h-3.5" /></button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Ajouter un tag..." />
                                    <button onClick={addTag} className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200"><Plus className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t">
                                <button onClick={onClose} className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">Annuler</button>
                                <button onClick={handleSave} disabled={saving || !extractedData.full_name.trim()}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#0E3A5D] text-white rounded-xl font-medium hover:bg-[#1E5A8E] disabled:opacity-50">
                                    <Check className="w-5 h-5" />{saving ? 'Enregistrement...' : 'Enregistrer le contact'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
