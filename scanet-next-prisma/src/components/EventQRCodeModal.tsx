'use client';

import { useState, useRef } from 'react';
import { X, Download, Copy, Check, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

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

        ctx.fillStyle = '#0E3A5D';
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                            <QrCode className="w-5 h-5 text-purple-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">QR Code</h2>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-center text-gray-600 mb-6">
                    Partagez ce QR code pour permettre aux participants de s'inscrire à <strong>{eventName}</strong>
                </p>

                <div ref={qrRef} className="flex justify-center mb-6 p-6 bg-white rounded-2xl border border-gray-100">
                    <QRCodeSVG value={registrationUrl} size={256} level="H" includeMargin />
                </div>

                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl mb-6">
                    <input
                        type="text"
                        value={registrationUrl}
                        readOnly
                        className="flex-1 bg-transparent text-sm text-gray-600 outline-none truncate"
                    />
                    <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copié' : 'Copier'}
                    </button>
                </div>

                <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0E3A5D] text-white rounded-xl font-medium hover:bg-[#1E5A8E] transition-colors"
                >
                    <Download className="w-5 h-5" />
                    Télécharger le QR Code
                </button>
            </div>
        </div>
    );
}
