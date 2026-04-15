'use client';

import { useState, useRef } from 'react';
import { X, Download, Copy, Check, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { MaterialButton } from './material/MaterialButton';
import { MaterialIconButton } from './material/MaterialIconButton';

interface EventQRCodeModalProps {
    eventName: string;
    qrCodeToken: string;
    onClose: () => void;
}

export function EventQRCodeModal({ eventName, qrCodeToken, onClose }: EventQRCodeModalProps) {
    const [copied, setCopied] = useState(false);
    const qrRef = useRef<HTMLDivElement>(null);

    const registrationUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/join-event/${qrCodeToken}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(registrationUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            console.error('Failed to copy');
        }
    };

    const handleDownload = () => {
        if (!qrRef.current) return;
        const svg = qrRef.current.querySelector('svg');
        if (!svg) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = 600;
        canvas.height = 750;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#111827';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(eventName, canvas.width / 2, 50);

        ctx.fillStyle = '#666666';
        ctx.font = '16px Arial';
        ctx.fillText('Scannez pour vous inscrire', canvas.width / 2, 80);

        const svgData = new XMLSerializer().serializeToString(svg);
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 50, 100, 500, 500);
            ctx.fillStyle = '#999999';
            ctx.font = '12px Arial';
            ctx.fillText(registrationUrl, canvas.width / 2, canvas.height - 30);

            const link = document.createElement('a');
            link.download = `qr-${eventName.replace(/\s+/g, '-').toLowerCase()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };
        img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700">
                            <QrCode className="h-5 w-5" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900">QR Code</h2>
                    </div>
                    <MaterialIconButton ariaLabel="Fermer" onClick={onClose} icon={<X className="h-5 w-5" />} />
                </div>

                <p className="mb-6 text-center text-slate-600">
                    Partagez ce QR code pour permettre aux participants de s'inscrire à <strong>{eventName}</strong>
                </p>

                <div ref={qrRef} className="mb-6 flex justify-center rounded-xl border border-slate-200 bg-slate-50 p-6">
                    <QRCodeSVG value={registrationUrl} size={256} level="H" includeMargin />
                </div>

                <div className="mb-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <input
                        type="text"
                        value={registrationUrl}
                        readOnly
                        className="flex-1 truncate bg-transparent text-sm text-slate-600 outline-none"
                    />
                    <MaterialButton onClick={handleCopy} variant="outlined" icon={copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />} className="text-sm">
                        {copied ? 'Copié' : 'Copier'}
                    </MaterialButton>
                </div>

                <MaterialButton onClick={handleDownload} icon={<Download className="h-5 w-5" />} className="w-full justify-center py-3">
                    Télécharger le QR Code
                </MaterialButton>
            </div>
        </div>
    );
}
