'use client';

import { Star, Send, Building2, MapPin } from 'lucide-react';
import type { Contact } from '@/types';

interface ModernContactCardProps {
    contact: Contact;
    onClick: (contact: Contact) => void;
}

export function ModernContactCard({ contact, onClick }: ModernContactCardProps) {
    const statusColors: Record<string, string> = {
        lead: 'bg-blue-100 text-blue-700',
        prospect: 'bg-amber-100 text-amber-700',
        client: 'bg-emerald-100 text-emerald-700',
        partner: 'bg-purple-100 text-purple-700',
    };

    const statusLabels: Record<string, string> = {
        lead: 'Lead',
        prospect: 'Prospect',
        client: 'Client',
        partner: 'Partenaire',
    };

    return (
        <div
            onClick={() => onClick(contact)}
            className="glass-card p-4 cursor-pointer hover:shadow-xl transition-all group"
        >
            <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0E3A5D] to-[#1E5A8E] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {contact.avatar_url ? (
                        <img src={contact.avatar_url} alt={contact.full_name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                        contact.full_name?.[0]?.toUpperCase() || '?'
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">{contact.full_name}</h3>
                        {contact.is_favorite && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                    </div>
                    {contact.company && (
                        <p className="text-sm text-gray-500 flex items-center gap-1 truncate">
                            <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                            {contact.company}
                        </p>
                    )}
                    {contact.city && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {contact.city}
                        </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                        {contact.status && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[contact.status] || 'bg-gray-100 text-gray-700'}`}>
                                {statusLabels[contact.status] || contact.status}
                            </span>
                        )}
                        {contact.tags?.slice(0, 2).map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600 truncate max-w-[80px]">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); if (contact.email) window.location.href = `mailto:${contact.email}`; }}
                    className="w-9 h-9 rounded-full bg-[#0E3A5D]/10 text-[#0E3A5D] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-[#0E3A5D] hover:text-white flex-shrink-0"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
