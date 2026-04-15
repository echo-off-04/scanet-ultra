'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, X, User } from 'lucide-react';

interface PhotoCaptureProps {
    onPhotoChange: (file: File | null) => void;
    currentPhoto?: string | null;
}

export function PhotoCapture({ onPhotoChange, currentPhoto }: PhotoCaptureProps) {
    const [preview, setPreview] = useState<string | null>(currentPhoto || null);
    const [showCamera, setShowCamera] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const startCamera = async () => {
        try {
            setError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
            });
            setStream(mediaStream);
            setShowCamera(true);
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            }, 100);
        } catch {
            setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
                setPreview(URL.createObjectURL(file));
                onPhotoChange(file);
            }
        }, 'image/jpeg', 0.8);
        stopCamera();
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setShowCamera(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError('La photo ne doit pas dépasser 5 Mo');
            return;
        }
        setPreview(URL.createObjectURL(file));
        onPhotoChange(file);
        setError(null);
    };

    const removePhoto = () => {
        setPreview(null);
        onPhotoChange(null);
    };

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-slate-100">
                    {preview ? (
                        <img src={preview} alt="Photo" className="w-full h-full object-cover" />
                    ) : (
                        <User className="h-10 w-10 text-slate-400" />
                    )}
                </div>
                {preview && (
                    <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2">
                <button type="button" onClick={startCamera} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm transition-colors hover:bg-slate-200">
                    <Camera className="h-4 w-4" />
                    <span>Caméra</span>
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm transition-colors hover:bg-slate-200">
                    <Upload className="h-4 w-4" />
                    <span>Fichier</span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            {showCamera && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl" />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="flex items-center justify-center gap-4 mt-4">
                            <button onClick={stopCamera} className="btn-secondary px-4 py-2 text-slate-700">
                                Annuler
                            </button>
                            <button onClick={capturePhoto} className="btn-primary px-4 py-2">
                                Capturer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
