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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Ajouter un contact</h2>
                    <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => { onClose(); onScanCard(); }}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-200 hover:border-[#0E3A5D] hover:bg-[#0E3A5D]/5 transition-all group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <Camera className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-semibold text-gray-900">Scanner une carte</h3>
                            <p className="text-sm text-gray-500">Capture automatique via la caméra</p>
                        </div>
                    </button>

                    {hasActiveEvent && (
                        <button
                            onClick={() => { onClose(); onShowEventQR(); }}
                            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-200 hover:border-[#0E3A5D] hover:bg-[#0E3A5D]/5 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                <QrCode className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-gray-900">QR Code événement</h3>
                                <p className="text-sm text-gray-500">Inscription via QR code</p>
                            </div>
                        </button>
                    )}

                    <button
                        onClick={() => { onClose(); onManualAdd(); }}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-200 hover:border-[#0E3A5D] hover:bg-[#0E3A5D]/5 transition-all group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                            <UserPlus className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-semibold text-gray-900">Saisie manuelle</h3>
                            <p className="text-sm text-gray-500">Ajouter les informations à la main</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
