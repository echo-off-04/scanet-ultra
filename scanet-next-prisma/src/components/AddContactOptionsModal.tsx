'use client';

import { X, Camera, QrCode, UserPlus } from 'lucide-react';

interface AddContactOptionsModalProps {
    onClose: () => void;
    onScanCard: () => void;
    onShowEventQR: () => void;
    onManualAdd: () => void;
    hasActiveEvent?: boolean;
}

export function AddContactOptionsModal({ onClose, onScanCard, onShowEventQR, onManualAdd, hasActiveEvent }: AddContactOptionsModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-slate-900">Ajouter un contact</h2>
                    <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => { onClose(); onScanCard(); }}
                        className="group flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 text-left transition-colors hover:bg-slate-50"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700 transition-colors group-hover:bg-white">
                            <Camera className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-medium text-slate-900">Scanner une carte</h3>
                            <p className="text-sm text-slate-500">Capture automatique via la caméra</p>
                        </div>
                    </button>

                    {hasActiveEvent && (
                        <button
                            onClick={() => { onClose(); onShowEventQR(); }}
                            className="group flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 text-left transition-colors hover:bg-slate-50"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700 transition-colors group-hover:bg-white">
                                <QrCode className="h-6 w-6" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-medium text-slate-900">QR Code événement</h3>
                                <p className="text-sm text-slate-500">Inscription via QR code</p>
                            </div>
                        </button>
                    )}

                    <button
                        onClick={() => { onClose(); onManualAdd(); }}
                        className="group flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 text-left transition-colors hover:bg-slate-50"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700 transition-colors group-hover:bg-white">
                            <UserPlus className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-medium text-slate-900">Saisie manuelle</h3>
                            <p className="text-sm text-slate-500">Ajouter les informations à la main</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
